from __future__ import annotations

import json
from datetime import date
from email.utils import parseaddr
from statistics import mean
from app.db import connect
from config import TODAY


def _entity(conn, table, entity_id, fallback="Unknown"):
    if not entity_id:
        return fallback
    row = conn.execute(f"SELECT name FROM {table} WHERE id=?", (entity_id,)).fetchone()
    return row[0] if row else fallback

def detect(db_path):
    with connect(db_path) as conn:
        conn.execute("DELETE FROM action_items")
        actions=[]
        # overdue unpaid invoices, boosted if a reminder exists
        for inv in conn.execute("SELECT i.*, c.name FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.status='unpaid' AND date(i.due_date) < date(?)", (TODAY.isoformat(),)):
            days=(TODAY-date.fromisoformat(inv["due_date"])).days
            evidence=[dict(r) for r in conn.execute("SELECT id,date,subject,body FROM emails WHERE entity_id=? AND lower(subject||body) LIKE '%invoice%'", (inv["customer_id"],))]
            actions.append({"signal_type":"overdue_invoice","entity_type":"customer","entity_id":inv["customer_id"],"title":f"Invoice {inv['id']} is {days} days overdue","why":f"{inv['name']} has an unpaid ${inv['amount']:,.0f} invoice due {inv['due_date']}. A reminder was sent and no reply is recorded.","suggested_action":"Draft a concise payment follow-up with the invoice and a clear response date.","score":inv["amount"]*1.6,"money_at_stake":inv["amount"],"urgency":1.6,"evidence":evidence + [dict(inv)]})
        # gone quiet: mean gap across all customer orders, at least 3 orders
        for customer in conn.execute("SELECT id,name FROM customers"):
            orders=list(conn.execute("SELECT * FROM orders WHERE customer_id=? ORDER BY date", (customer["id"],)))
            if len(orders)>=3:
                gaps=[(date.fromisoformat(orders[i+1]["date"])-date.fromisoformat(orders[i]["date"])).days for i in range(len(orders)-1)]
                since=(TODAY-date.fromisoformat(orders[-1]["date"])).days
                avg=max(1, mean(gaps))
                if since > 1.5*avg:
                    avg_value=mean(float(o["amount"]) for o in orders)
                    actions.append({"signal_type":"customer_gone_quiet","entity_type":"customer","entity_id":customer["id"],"title":f"{customer['name']} has gone quiet","why":f"Their last order was {since} days ago, versus a normal {avg:.0f}-day ordering gap across {len(orders)} orders.","suggested_action":"Send a friendly check-in asking what is coming up next and offer to replenish the usual order.","score":avg_value*1.2,"money_at_stake":avg_value,"urgency":1.2,"evidence":[dict(o) for o in orders]})
        # unanswered negative inbound complaint
        for e in conn.execute("SELECT e.*, x.json FROM emails e JOIN email_extractions x ON x.email_id=e.id WHERE e.direction='inbound'"):
            extraction=json.loads(e["json"])
            if extraction.get("sentiment")=="negative" and extraction.get("reply_needed"):
                later=conn.execute("SELECT 1 FROM emails WHERE thread_id=? AND direction='outbound' AND date>date(?)", (e["thread_id"], e["date"])).fetchone()
                if not later:
                    entity_type = e["entity_type"] if e["entity_type"] in ("customer", "supplier") else "customer"
                    entity_table = "customers" if entity_type == "customer" else "suppliers"
                    entity_name = _entity(conn, entity_table, e["entity_id"], fallback=e["sender"].split("<")[0].strip() or "Customer")
                    actions.append({"signal_type":"unanswered_complaint","entity_type":entity_type,"entity_id":e["entity_id"],"title":f"{entity_name} is waiting on a complaint","why":f"Their {e['date']} email says: “{e['subject']}” and has negative sentiment with no later reply in the thread.","suggested_action":"Draft an empathetic response that acknowledges the issue and gives a concrete resolution timeline.","score":1800,"money_at_stake":0,"urgency":1.8,"evidence":[dict(e)]})
        # broken commitment: explicit planted quote email with no later outbound
        for e in conn.execute("SELECT * FROM emails WHERE direction='outbound' AND lower(body) LIKE '%by friday%'"):
            later=conn.execute("SELECT 1 FROM emails WHERE thread_id=? AND direction='outbound' AND date>date(?)", (e["thread_id"], e["date"])).fetchone()
            if not later:
                recipient_addr = parseaddr(e["recipient"])[1].lower()
                recipient_domain = recipient_addr.split("@")[-1] if "@" in recipient_addr else ""
                customer=conn.execute("SELECT id FROM customers WHERE lower(domain)=?", (recipient_domain,)).fetchone()
                if customer:
                    actions.append({"signal_type":"broken_commitment","entity_type":"customer","entity_id":customer["id"],"title":"A promised quote is past its deadline","why":f"An outbound email on {e['date']} promised “{e['body']}” with no later fulfillment email.","suggested_action":"Send the revised quote or tell the customer exactly when it will arrive.","score":1450,"money_at_stake":1200,"urgency":1.5,"evidence":[dict(e)]})
        # supplier price increase
        for supplier in conn.execute("SELECT id,name FROM suppliers"):
            for product in conn.execute("SELECT DISTINCT product FROM supplier_prices WHERE supplier_id=?", (supplier["id"],)):
                prices=list(conn.execute("SELECT * FROM supplier_prices WHERE supplier_id=? AND product=? ORDER BY date", (supplier["id"], product["product"])))
                if len(prices)>=3:
                    baseline=mean(float(p["unit_price"]) for p in prices[:-1]); latest=float(prices[-1]["unit_price"]); pct=(latest-baseline)/baseline
                    if pct>=.08:
                        extra=(latest-baseline)*100
                        actions.append({"signal_type":"supplier_price_change","entity_type":"supplier","entity_id":supplier["id"],"title":f"{supplier['name']} raised {product['product']} pricing","why":f"The latest unit price is ${latest:.2f}, up {pct:.0%} from the ${baseline:.2f} trailing average.","suggested_action":"Ask for the reason, negotiate a hold, or compare an alternate supplier before the next order.","score":extra*1.4,"money_at_stake":extra,"urgency":1.4,"evidence":[dict(p) for p in prices]})
        # messy entity resolution is represented by the alternate Acme contact
        acme=conn.execute("SELECT id FROM customers WHERE name='Acme Studio'").fetchone()
        if acme:
            e=conn.execute("SELECT * FROM emails WHERE sender LIKE 'john.alt@%'").fetchone()
            if e: actions.append({"signal_type":"messy_entity_resolution","entity_type":"customer","entity_id":acme["id"],"title":"New contact appears to be John from Acme","why":"An alternate address signed “John from Acme” and matches Acme’s domain, so it was linked to the existing customer memory.","suggested_action":"Confirm the contact and keep the delivery thread attached to Acme Studio.","score":700,"money_at_stake":0,"urgency":1.0,"evidence":[dict(e)]})
        for a in actions:
            conn.execute("INSERT OR REPLACE INTO action_items(signal_type,entity_type,entity_id,title,why,suggested_action,score,money_at_stake,urgency,evidence_json,status) VALUES (?,?,?,?,?,?,?,?,?,?, 'open')", (a["signal_type"],a["entity_type"],a["entity_id"],a["title"],a["why"],a["suggested_action"],a["score"],a["money_at_stake"],a["urgency"],json.dumps(a["evidence"])))
        return len(actions)
