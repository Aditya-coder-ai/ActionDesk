from __future__ import annotations

import base64
import html
import re
from datetime import datetime, timezone
from email.utils import parseaddr
from pathlib import Path
from typing import Any

from app.db import connect
from app.ingest import upsert_emails
from config import GMAIL_CLIENT_SECRET_FILE, GMAIL_MAX_MESSAGES, GMAIL_OWNER_EMAIL, GMAIL_QUERY, GMAIL_SCOPES, GMAIL_TOKEN_FILE


def _decode(value: str | None) -> str:
    if not value:
        return ""
    raw = base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
    return raw.decode("utf-8", errors="replace")


def _text_from_payload(payload: dict[str, Any]) -> str:
    plain, fallback = [], []
    def visit(part: dict[str, Any]):
        mime = part.get("mimeType", "")
        body = part.get("body", {})
        if body.get("data"):
            text = _decode(body["data"])
            if mime in ("", "text/plain"): plain.append(text)
            elif mime == "text/html": fallback.append(re.sub(r"<[^>]+>", " ", html.unescape(text)))
        for child in part.get("parts", []) or []: visit(child)
    visit(payload)
    return "\n".join(plain or fallback).strip()


def normalize_message(message: dict[str, Any], owner_email: str = "") -> dict[str, str]:
    headers = {h.get("name", "").lower(): h.get("value", "") for h in message.get("payload", {}).get("headers", [])}
    sender = headers.get("from", "")
    owner = owner_email.lower().strip()
    direction = "outbound" if owner and parseaddr(sender)[1].lower() == owner else "inbound"
    received = datetime.fromtimestamp(int(message.get("internalDate", "0")) / 1000, tz=timezone.utc).date().isoformat()
    return {"id": f"gmail:{message['id']}", "thread_id": f"gmail-thread:{message.get('threadId', message['id'])}", "from": sender, "to": headers.get("to", ""), "date": received, "subject": headers.get("subject", "(no subject)"), "body": _text_from_payload(message.get("payload", {})), "direction": direction}


def authorize(client_secret_file: Path = GMAIL_CLIENT_SECRET_FILE, token_file: Path = GMAIL_TOKEN_FILE):
    """Run the local installed-app OAuth flow with Gmail readonly scope."""
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    if not client_secret_file.exists():
        raise FileNotFoundError(f"Missing Gmail OAuth client file: {client_secret_file}")
    creds = Credentials.from_authorized_user_file(str(token_file), GMAIL_SCOPES) if token_file.exists() else None
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(str(client_secret_file), GMAIL_SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent")
        token_file.write_text(creds.to_json())
    return creds


def _message_ids(service, cursor: str | None, query: str, max_messages: int) -> tuple[list[str], str | None]:
    profile = service.users().getProfile(userId="me").execute()
    latest_cursor = profile.get("historyId")
    ids: list[str] = []
    if cursor:
        try:
            page = service.users().history().list(userId="me", startHistoryId=cursor, historyTypes=["messageAdded"], maxResults=max_messages).execute()
            for item in page.get("history", []):
                ids.extend(m["messageId"] for m in item.get("messagesAdded", []))
        except Exception as exc:
            if "404" not in str(exc): raise
    if not cursor or not ids:
        page_token = None
        while len(ids) < max_messages:
            response = service.users().messages().list(userId="me", q=query, maxResults=min(100, max_messages-len(ids)), pageToken=page_token).execute()
            ids.extend(m["id"] for m in response.get("messages", []))
            page_token = response.get("nextPageToken")
            if not page_token: break
    return list(dict.fromkeys(ids))[:max_messages], latest_cursor


def sync_gmail(db_path, query: str = GMAIL_QUERY, max_messages: int = GMAIL_MAX_MESSAGES) -> dict[str, int | str]:
    """Read Gmail messages, upsert them into the common email table, and save history cursor."""
    from googleapiclient.discovery import build
    creds = authorize()
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    with connect(db_path) as conn:
        state = conn.execute("SELECT cursor FROM sync_state WHERE source='gmail'").fetchone()
    ids, latest_cursor = _message_ids(service, state["cursor"] if state else None, query, max_messages)
    normalized = []
    for message_id in ids:
        message = service.users().messages().get(userId="me", id=message_id, format="full").execute()
        normalized.append(normalize_message(message, GMAIL_OWNER_EMAIL))
    inserted = upsert_emails(normalized, db_path)
    with connect(db_path) as conn:
        conn.execute("INSERT OR REPLACE INTO sync_state(source,cursor) VALUES ('gmail',?)", (latest_cursor or (state["cursor"] if state else None),))
    return {"fetched": len(normalized), "upserted": inserted, "cursor": latest_cursor or "unchanged"}
