from __future__ import annotations

import csv
import json
from pathlib import Path
from email.utils import parseaddr

from app.db import connect


def load_json(path: Path) -> list[dict]:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def link_entity(address: str, customers: list[dict], suppliers: list[dict]):
    email = parseaddr(address)[1].lower()
    domain = email.split("@")[-1]
    for entity_type, entities in (("customer", customers), ("supplier", suppliers)):
        for entity in entities:
            if domain == entity["domain"]:
                return entity_type, entity["name"]
    return "other", None


def ingest(path: Path, db_path: Path):
    emails = load_json(path / "emails.json")
    customers = [{"name": c, "domain": d} for c, d in [("Acme Studio", "acme.example"), ("Northstar Studio", "northstar.example"), ("Brightline Retail", "brightline.example"), ("Cedar & Co", "cedar.example"), ("Mosaic Labs", "mosaic.example"), ("Harbor House", "harbor.example")]]
    suppliers = [{"name": "River & Co", "domain": "river.example"}, {"name": "Papertrail Supply", "domain": "papertrail.example"}]
    with connect(db_path) as conn:
        conn.execute("DELETE FROM customers"); conn.execute("DELETE FROM suppliers"); conn.execute("DELETE FROM contacts"); conn.execute("DELETE FROM emails"); conn.execute("DELETE FROM invoices"); conn.execute("DELETE FROM orders"); conn.execute("DELETE FROM supplier_prices"); conn.execute("DELETE FROM commitments")
        for index, entity in enumerate(customers, 1): conn.execute("INSERT INTO customers(id,name,domain,notes) VALUES (?,?,?,?)", (index, entity["name"], entity["domain"], "Synthetic demo customer"))
        for index, entity in enumerate(suppliers, 1): conn.execute("INSERT INTO suppliers(id,name,domain) VALUES (?,?,?)", (index, entity["name"], entity["domain"]))
        customer_ids = {r["name"]: r["id"] for r in conn.execute("SELECT id,name FROM customers")}
        supplier_ids = {r["name"]: r["id"] for r in conn.execute("SELECT id,name FROM suppliers")}
        for email in emails:
            entity_type, entity_name = link_entity(email["from"], customers, suppliers)
            entity_id = (customer_ids if entity_type == "customer" else supplier_ids).get(entity_name)
            conn.execute("INSERT INTO emails VALUES (?,?,?,?,?,?,?,?,?,?)", (email["id"], email["thread_id"], email["from"], email["to"], email["date"], email["subject"], email["body"], email["direction"], entity_type, entity_id))
            conn.execute("INSERT OR IGNORE INTO contacts(email,name,entity_type,entity_id) VALUES (?,?,?,?)", (email["from"], email["from"].split("<")[0].strip(), entity_type, entity_id))
        for row in load_csv(path / "invoices.csv"):
            conn.execute("INSERT INTO invoices VALUES (?,?,?,?,?,?)", (row["invoice_id"], customer_ids[row["customer"]], float(row["amount"]), row["issue_date"], row["due_date"], row["status"]))
        for row in load_csv(path / "orders.csv"):
            conn.execute("INSERT INTO orders VALUES (?,?,?,?,?)", (row["order_id"], customer_ids[row["customer"]], row["date"], float(row["amount"]), row["product"]))
        for row in load_csv(path / "supplier_prices.csv"):
            conn.execute("INSERT INTO supplier_prices VALUES (?,?,?,?,?)", (row["price_id"], supplier_ids[row["supplier"]], row["product"], row["date"], float(row["unit_price"])))
    return len(emails)


def upsert_emails(emails: list[dict], db_path: Path) -> int:
    """Add normalized emails without deleting synthetic or previously synced records."""
    with connect(db_path) as conn:
        customers = {r["domain"]: ("customer", r["id"]) for r in conn.execute("SELECT id,domain FROM customers")}
        suppliers = {r["domain"]: ("supplier", r["id"]) for r in conn.execute("SELECT id,domain FROM suppliers")}
        inserted = 0
        for email in emails:
            entity_type, entity_id = "other", None
            domain = parseaddr(email["from"])[1].lower().split("@")[-1]
            if domain in customers: entity_type, entity_id = customers[domain]
            elif domain in suppliers: entity_type, entity_id = suppliers[domain]
            before = conn.total_changes
            conn.execute("INSERT OR REPLACE INTO emails VALUES (?,?,?,?,?,?,?,?,?,?)", (email["id"], email["thread_id"], email["from"], email["to"], email["date"], email["subject"], email["body"], email["direction"], entity_type, entity_id))
            conn.execute("INSERT OR IGNORE INTO contacts(email,name,entity_type,entity_id) VALUES (?,?,?,?)", (email["from"], email["from"].split("<")[0].strip(), entity_type, entity_id))
            inserted += int(conn.total_changes > before)
        return inserted
