from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, name TEXT UNIQUE, domain TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY, name TEXT UNIQUE, domain TEXT);
CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, entity_type TEXT, entity_id INTEGER);
CREATE TABLE IF NOT EXISTS emails (id TEXT PRIMARY KEY, thread_id TEXT, sender TEXT, recipient TEXT, date TEXT, subject TEXT, body TEXT, direction TEXT, entity_type TEXT, entity_id INTEGER);
CREATE TABLE IF NOT EXISTS email_extractions (email_id TEXT PRIMARY KEY, json TEXT NOT NULL, model TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, customer_id INTEGER, amount REAL, issue_date TEXT, due_date TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_id INTEGER, date TEXT, amount REAL, product TEXT);
CREATE TABLE IF NOT EXISTS supplier_prices (id TEXT PRIMARY KEY, supplier_id INTEGER, product TEXT, date TEXT, unit_price REAL);
CREATE TABLE IF NOT EXISTS commitments (id INTEGER PRIMARY KEY AUTOINCREMENT, email_id TEXT, entity_id INTEGER, text TEXT, due_date TEXT, fulfilled INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS action_items (id INTEGER PRIMARY KEY AUTOINCREMENT, signal_type TEXT, entity_type TEXT, entity_id INTEGER, title TEXT, why TEXT, suggested_action TEXT, score REAL, money_at_stake REAL, urgency REAL, status TEXT DEFAULT 'open', snooze_until TEXT, evidence_json TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(signal_type, entity_type, entity_id));
CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, action_item_id INTEGER, signal_type TEXT, action TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sync_state (source TEXT PRIMARY KEY, cursor TEXT, synced_at TEXT DEFAULT CURRENT_TIMESTAMP);
"""

@contextmanager
def connect(path: Path | str):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db(path: Path | str):
    with connect(path) as conn:
        conn.executescript(SCHEMA)

def replace_rows(path: Path | str, table: str, rows: list[dict], columns: list[str]):
    with connect(path) as conn:
        conn.execute(f"DELETE FROM {table}")
        placeholders = ",".join("?" for _ in columns)
        conn.executemany(f"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders})", [[r.get(c) for c in columns] for r in rows])

def upsert_json(path: Path | str, table: str, key: str, key_value: str, payload: dict, model: str = "rules"):
    with connect(path) as conn:
        conn.execute(f"INSERT OR REPLACE INTO {table} ({key}, json, model) VALUES (?, ?, ?)", (key_value, json.dumps(payload), model))
