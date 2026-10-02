# Business Memory — Morning Brief

A working MVP for ActionDesk’s core wedge: keep a continuously updated memory of a small business, then surface a short, prioritized list of what needs attention and why.

## What is built

- Deterministic synthetic dataset with 40 realistic emails, invoices, orders, supplier prices, six planted stories, and decoys.
- SQLite entity memory for customers, suppliers, contacts, emails, extraction cache, invoices, orders, commitments, action items, and feedback.
- Idempotent ingestion and cached extraction. If `ANTHROPIC_API_KEY` is present, email extraction can use the configured Claude Haiku model; otherwise the deterministic fallback makes the demo run offline.
- Plain Python rules for overdue invoices, gone-quiet customers, unanswered complaints, broken commitments, supplier price changes, and messy contact resolution.
- Ranked Morning Brief with evidence panels, editable draft replies, Done, Snooze, Dismiss, entity timeline, and summary metrics.
- Evaluation script and results file.
- Optional read-only Gmail sync with local OAuth, normalized into the same email memory, and an incremental Gmail history cursor.

## Run the demo

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m data.generate
python -m app.pipeline
python -m eval.run_eval
streamlit run app/ui.py
```

The UI is local at `http://localhost:8501`. No API key is required for the deterministic demo. Add `ANTHROPIC_API_KEY` to `.env` only when you want optional Claude extraction/enrichment.

## Connect Gmail (read-only)

1. In Google Cloud Console, create a project, enable the Gmail API, configure the OAuth consent screen as **External / Testing**, and add your Google account as a test user.
2. Create an OAuth client for **Desktop app**, download the JSON, and save it as `credentials.json` in the project root. Keep it out of Git.
3. Set `GMAIL_OWNER_EMAIL` in `.env`, then run:

```bash
python -m app.pipeline --source gmail --max-messages 100
```

The first run opens a local browser consent flow for the Gmail **readonly** scope and stores the refresh token in `gmail_token.json`. Subsequent runs use Gmail history IDs for incremental sync; if a history cursor expires, the connector safely falls back to the configured search query. The Streamlit sidebar also exposes **Gmail · read-only → Sync Gmail**.

Gmail messages are normalized into the same `emails` table as synthetic messages. The connector never sends, modifies, labels, or deletes mail. Do not commit `credentials.json` or `gmail_token.json`.

## Architecture

1. **Ingestion:** local JSON/CSV files are normalized into SQLite.
2. **Entity memory:** sender domains link records to known customers and suppliers. The alternate `john.alt@acme.example` contact demonstrates messy resolution.
3. **Understanding:** extraction is cached by email id. Claude is used only for extraction when configured; all demo behavior has a safe offline fallback.
4. **Signal and action engine:** deterministic rules detect signals, score them using urgency and money at stake, attach source evidence, and rank the top eight.
5. **Human-in-the-loop UI:** the owner can inspect evidence, edit a draft, mark Done, Snooze, or Dismiss. Nothing sends automatically.

## Evaluation

`python -m eval.run_eval` writes `eval/results.json` and prints precision, recall, misses, and false positives. The messy entity story is checked as an Acme memory update, while the five actionable stories are measured as alerts.

## Assumptions and incomplete roadmap

- SMTP digest, feedback-adjusted weights, low-stock alerts, and the optional Ask box are not yet wired.
- The offline extractor intentionally favors predictable demo behavior. Claude calls are optional and should remain cached.
- The synthetic “today” date is `2026-10-02` by default for reproducible evaluation; override it with `BUSINESS_MEMORY_TODAY` before starting a fresh run.
- Authentication, multi-user access, autonomous sending, WhatsApp/Slack, vector search, and mobile are out of scope.
