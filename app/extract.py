from __future__ import annotations

import json, re
from datetime import date
from typing import Any

from app.db import connect
from config import HAIKU_MODEL, ANTHROPIC_API_KEY, TODAY

DEFAULT = {"entity_mentions": [], "intent":"other", "sentiment":"neutral", "urgency":"low", "reply_needed":False, "commitments":[], "mentioned_amounts":[], "summary":""}

def heuristic(email: dict[str, Any]) -> dict[str, Any]:
    text = f"{email['subject']} {email['body']}".lower()
    sentiment = "negative" if any(w in text for w in ("frustrating", "complaint", "nobody", "damaged")) else "neutral"
    intent = "complaint" if sentiment == "negative" else "payment" if "invoice" in text or "payment" in text else "price_change" if "price" in text or "unit price" in text else "quote_request" if "quote" in text else "order" if "order" in text or "reorder" in text else "other"
    commitments=[]
    match=re.search(r"by (Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday)(?:,? ([A-Za-z]+ \d+))?", email["body"], re.I)
    if match and email["direction"] == "outbound":
        commitments=[{"text": match.group(0), "who":"us", "due_date":None}]
    return {**DEFAULT, "intent":intent, "sentiment":sentiment, "urgency":"high" if sentiment == "negative" or "urgent" in text else "medium" if any(w in text for w in ("invoice", "quote", "price", "reorder")) else "low", "reply_needed": email["direction"] == "inbound" and (sentiment == "negative" or any(w in text for w in ("question", "waiting", "please", "urgent"))), "commitments":commitments, "summary":email["body"].split(".")[0].strip()+"."}

def extract_one(email: dict[str, Any], db_path):
    with connect(db_path) as conn:
        cached=conn.execute("SELECT json FROM email_extractions WHERE email_id=?", (email["id"],)).fetchone()
        if cached: return json.loads(cached["json"]), True
    result=heuristic(email)
    if ANTHROPIC_API_KEY:
        try:
            import anthropic
            client=anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            prompt=f"Return only JSON matching this schema: entity_mentions, intent, sentiment, urgency, reply_needed, commitments, mentioned_amounts, summary. Email date: {email['date']}\nSubject: {email['subject']}\nBody: {email['body']}"
            message=client.messages.create(model=HAIKU_MODEL, max_tokens=500, system="Extract facts only. Do not invent. Resolve relative dates against the email date.", messages=[{"role":"user","content":prompt}])
            text=message.content[0].text.strip().replace("```json","").replace("```","")
            result={**DEFAULT, **json.loads(text)}
        except Exception:
            pass
    with connect(db_path) as conn:
        conn.execute("INSERT OR REPLACE INTO email_extractions(email_id,json,model) VALUES (?,?,?)", (email["id"], json.dumps(result), HAIKU_MODEL if ANTHROPIC_API_KEY else "heuristic"))
    return result, False

def extract_all(db_path):
    with connect(db_path) as conn: rows=[dict(r) for r in conn.execute("SELECT * FROM emails")]
    return sum((extract_one(row, db_path)[1] for row in rows), 0), len(rows)
