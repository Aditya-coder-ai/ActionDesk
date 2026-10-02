from __future__ import annotations

import os
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
DATA_DIR = ROOT / "data"
DB_PATH = ROOT / "business_memory.sqlite3"
TODAY = date.fromisoformat(os.getenv("BUSINESS_MEMORY_TODAY", "2026-10-02"))
HAIKU_MODEL = "claude-haiku-4-5-20251001"
SONNET_MODEL = "claude-sonnet-5-5"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GMAIL_CLIENT_SECRET_FILE = Path(os.getenv("GMAIL_CLIENT_SECRET_FILE", ROOT / "credentials.json"))
GMAIL_TOKEN_FILE = Path(os.getenv("GMAIL_TOKEN_FILE", ROOT / "gmail_token.json"))
GMAIL_QUERY = os.getenv("GMAIL_QUERY", "newer_than:90d")
GMAIL_MAX_MESSAGES = int(os.getenv("GMAIL_MAX_MESSAGES", "100"))
GMAIL_OWNER_EMAIL = os.getenv("GMAIL_OWNER_EMAIL", "")
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
