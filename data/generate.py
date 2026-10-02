from __future__ import annotations

import csv, json
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TODAY = date(2026, 10, 2)

def d(days_ago: int) -> str: return (TODAY - timedelta(days=days_ago)).isoformat()

def email(i, thread, sender, subject, body, days_ago, direction="inbound", to="owner@actiondesk.local"):
    return {"id": f"e{i:03d}", "thread_id": thread, "from": sender, "to": to, "date": d(days_ago), "subject": subject, "body": body, "direction": direction}

def main():
    emails = [
      email(1,"t-acme-quiet","sarah@acme.example","Order confirmation","Thanks, the usual replenishment looks good. Please ship next week.",76),
      email(2,"t-acme-quiet","owner@actiondesk.local","Re: Order confirmation","Great, we'll have it ready.",75,"outbound","sarah@acme.example"),
      email(3,"t-acme-quiet","sarah@acme.example","Re: Order confirmation","Perfect, thank you.",54),
      email(4,"t-acme-quiet","sarah@acme.example","Re: Order confirmation","Could we add the blue units next time?",33),
      email(5,"t-northstar-overdue","owner@actiondesk.local","Invoice 1042 reminder","Following up on invoice INV-1042 for $2,400, now past due. Could you confirm payment timing?",25,"outbound","billing@northstar.example"),
      email(6,"t-northstar-overdue","owner@actiondesk.local","Re: Invoice 1042 reminder","Just checking this reached you.",12,"outbound","billing@northstar.example"),
      email(7,"t-broken-promise","owner@actiondesk.local","Quote for Q4 packaging","I'll send the revised quote by Friday, September 18.",18,"outbound","maria@brightline.example"),
      email(8,"t-complaint","jordan@cedar.example","Still waiting on the damaged shipment","This is extremely frustrating. We have been waiting two weeks and nobody has explained what happened. Please fix this today.",3),
      email(9,"t-supplier-price","lena@river.example","Updated pricing for kraft boxes","Our kraft box unit price will move from $1.20 to $1.48 starting this month due to material costs.",8),
      email(10,"t-messy-acme","john.alt@acme.example","John from Acme - urgent reorder","Hi, John from Acme here. We need 80 blue units by next Friday. Please use this address for the delivery thread.",2),
      email(11,"t-mosaic","lee@mosaic.example","Re: Monthly report","The report looks good, thanks.",5),
      email(12,"t-harbor","nina@harbor.example","October order","Please send 30 units of the standard kit.",4),
      email(13,"t-harbor","owner@actiondesk.local","Re: October order","Confirmed — dispatching tomorrow.",3,"outbound","nina@harbor.example"),
      email(14,"t-papertrail","ops@papertrail.example","Delivery update","Your stationery order shipped today and should arrive Thursday.",6),
      email(15,"t-brightline","maria@brightline.example","Re: Sample pack","The samples arrived and look great. We'll review internally.",10),
      email(16,"t-brightline","owner@actiondesk.local","Re: Sample pack","Sounds good, happy to answer questions.",9,"outbound","maria@brightline.example"),
      email(17,"t-northstar-paid","billing@northstar.example","Payment receipt","Paid invoice INV-1031 in full. Receipt attached.",28),
      email(18,"t-cedar-decoy","jordan@cedar.example","Thanks","Thanks for sorting that out last month.",45),
      email(19,"t-cedar-decoy","owner@actiondesk.local","Re: Thanks","Any time.",44,"outbound","jordan@cedar.example"),
    ]
    routine = [
      ("sarah@acme.example","Quick question","Can you confirm the updated product dimensions?"),
      ("lee@mosaic.example","Weekly sync","Sharing the notes from our weekly sync."),
      ("nina@harbor.example","Delivery received","Everything arrived safely."),
      ("maria@brightline.example","Re: Pricing","Thanks for the pricing sheet."),
      ("ops@papertrail.example","Invoice paid","Thanks for your payment."),
      ("billing@northstar.example","Statement","Attached is your monthly statement."),
      ("sarah@acme.example","Holiday hours","Our office will be closed Monday."),
      ("lee@mosaic.example","Product notes","A few notes for the next release."),
      ("nina@harbor.example","Re: Delivery received","Great, glad it arrived."),
      ("maria@brightline.example","Sample feedback","The team likes the green option."),
      ("ops@papertrail.example","Tracking","Here is the tracking link."),
      ("billing@northstar.example","Receipt","Your recent payment was received."),
      ("sarah@acme.example","Re: Holiday hours","Thanks for letting us know."),
      ("lee@mosaic.example","Next steps","Let's revisit this next week."),
      ("nina@harbor.example","Stock check","We still have enough inventory."),
      ("maria@brightline.example","Calendar","I've sent a calendar invite."),
      ("ops@papertrail.example","Order packed","Your order is packed and ready."),
      ("billing@northstar.example","Remittance","Remittance advice attached."),
      ("sarah@acme.example","Thanks","Appreciate the quick turnaround."),
      ("lee@mosaic.example","All set","All set on our side."),
    ]
    for offset, (sender, subject, body) in enumerate(routine, 20):
        emails.append(email(offset, f"routine-{offset}", sender, subject, body, (offset % 25) + 1))
    (ROOT / "emails.json").write_text(json.dumps(emails, indent=2))
    invoices = [
      {"invoice_id":"INV-1042","customer":"Northstar Studio","amount":"2400","issue_date":d(50),"due_date":d(28),"status":"unpaid"},
      {"invoice_id":"INV-1031","customer":"Northstar Studio","amount":"1800","issue_date":d(55),"due_date":d(33),"status":"paid"},
      {"invoice_id":"INV-2050","customer":"Brightline Retail","amount":"1200","issue_date":d(15),"due_date":d(-15),"status":"unpaid"},
      {"invoice_id":"INV-3010","customer":"Cedar & Co","amount":"850","issue_date":d(20),"due_date":d(-10),"status":"paid"},
      {"invoice_id":"INV-4010","customer":"Mosaic Labs","amount":"950","issue_date":d(18),"due_date":d(-12),"status":"paid"},
      {"invoice_id":"INV-5010","customer":"Harbor House","amount":"700","issue_date":d(10),"due_date":d(-20),"status":"paid"},
    ]
    with (ROOT / "invoices.csv").open("w", newline="") as f:
        w=csv.DictWriter(f, fieldnames=invoices[0].keys()); w.writeheader(); w.writerows(invoices)
    orders=[]
    for i, days in enumerate([88,67,47,30,52],1): orders.append({"order_id":f"O-A{i}","customer":"Acme Studio","date":d(days),"amount":"900","product":"Blue units"})
    for i, days in enumerate([65,38,8],1): orders.append({"order_id":f"O-N{i}","customer":"Northstar Studio","date":d(days),"amount":"1400","product":"Kits"})
    for i, days in enumerate([28,14],1): orders.append({"order_id":f"O-B{i}","customer":"Brightline Retail","date":d(days),"amount":"1200","product":"Packaging"})
    for i, days in enumerate([40,18,3],1): orders.append({"order_id":f"O-C{i}","customer":"Cedar & Co","date":d(days),"amount":"850","product":"Shipping supplies"})
    for i, days in enumerate([45,20,5],1): orders.append({"order_id":f"O-M{i}","customer":"Mosaic Labs","date":d(days),"amount":"950","product":"Labels"})
    for i, days in enumerate([38,12],1): orders.append({"order_id":f"O-H{i}","customer":"Harbor House","date":d(days),"amount":"700","product":"Standard kit"})
    with (ROOT / "orders.csv").open("w", newline="") as f:
        w=csv.DictWriter(f, fieldnames=orders[0].keys()); w.writeheader(); w.writerows(orders)
    prices=[
      {"price_id":"P1","supplier":"River & Co","product":"Kraft boxes","date":d(90),"unit_price":"1.18"},
      {"price_id":"P2","supplier":"River & Co","product":"Kraft boxes","date":d(60),"unit_price":"1.22"},
      {"price_id":"P3","supplier":"River & Co","product":"Kraft boxes","date":d(8),"unit_price":"1.48"},
      {"price_id":"P4","supplier":"Papertrail Supply","product":"Stationery","date":d(70),"unit_price":"4.10"},
      {"price_id":"P5","supplier":"Papertrail Supply","product":"Stationery","date":d(12),"unit_price":"4.15"},
    ]
    with (ROOT / "supplier_prices.csv").open("w", newline="") as f:
        w=csv.DictWriter(f, fieldnames=prices[0].keys()); w.writeheader(); w.writerows(prices)
    ground=[
      {"entity":"Acme Studio","signal_type":"customer_gone_quiet"},
      {"entity":"Northstar Studio","signal_type":"overdue_invoice"},
      {"entity":"Brightline Retail","signal_type":"broken_commitment"},
      {"entity":"Cedar & Co","signal_type":"unanswered_complaint"},
      {"entity":"River & Co","signal_type":"supplier_price_change"},
      {"entity":"Acme Studio","signal_type":"messy_entity_resolution"},
    ]
    (ROOT / "ground_truth.json").write_text(json.dumps(ground, indent=2))

if __name__ == "__main__": main()
