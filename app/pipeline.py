from __future__ import annotations

import argparse
from pathlib import Path
from app.db import init_db
from app.ingest import ingest
from app.extract import extract_all
from app.signals import detect
from config import DATA_DIR, DB_PATH


def run(source: str = "synthetic", max_messages: int | None = None):
    DATA_DIR.joinpath("emails.json").exists() or __import__("data.generate", fromlist=["main"]).main()
    init_db(DB_PATH)
    count = 0
    if source == "gmail":
        # Seed the reference entities and financial records once so Gmail can enrich the same memory.
        with __import__("app.db", fromlist=["connect"]).connect(DB_PATH) as conn:
            has_customers = conn.execute("SELECT 1 FROM customers LIMIT 1").fetchone()
        if not has_customers:
            count = ingest(DATA_DIR, DB_PATH)
        from app.gmail import sync_gmail
        result = sync_gmail(DB_PATH, max_messages=max_messages) if max_messages else sync_gmail(DB_PATH)
        print(f"Gmail sync fetched {result['fetched']} messages and upserted {result['upserted']} (cursor: {result['cursor']})")
    else:
        count=ingest(DATA_DIR, DB_PATH)
    cached,total=extract_all(DB_PATH)
    signals=detect(DB_PATH)
    print(f"Ingested {count} emails; extraction cache hits: {cached}/{total}; action items: {signals}; database: {DB_PATH}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the Business Memory action brief")
    parser.add_argument("--source", choices=["synthetic", "gmail"], default="synthetic")
    parser.add_argument("--max-messages", type=int, default=None)
    args = parser.parse_args()
    run(args.source, args.max_messages)
