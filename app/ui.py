from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

import streamlit as st

from app.db import connect
from app.pipeline import run
from config import DB_PATH, TODAY

st.set_page_config(page_title="Business Memory · Morning Brief", page_icon="◈", layout="wide")

if not DB_PATH.exists():
    run()

st.markdown("""
<style>
:root { color-scheme: light; }
.block-container { max-width: 1180px; padding-top: 2rem; }
.hero { background: linear-gradient(135deg,#0c1735,#17275b); padding: 2rem 2.2rem; border-radius: 24px; color: white; margin-bottom: 1.4rem; }
.hero h1 { margin: 0; font-size: 2.25rem; letter-spacing: -.05em; }
.hero p { color: #b6c1e2; margin-bottom: 0; }
.metric { background: #f6f7fb; border: 1px solid #e1e5ef; padding: 1rem; border-radius: 16px; }
.card { border: 1px solid #e1e5ef; border-radius: 18px; padding: 1.1rem 1.25rem; margin: .7rem 0; background: #fff; }
.badge { display:inline-block; padding: .25rem .55rem; border-radius: 999px; background:#e9edff; color:#4966d4; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
.small { color:#7a849c; font-size:.85rem; }
</style>
""", unsafe_allow_html=True)


def query_actions():
    with connect(DB_PATH) as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM action_items WHERE status='open' AND (snooze_until IS NULL OR date(snooze_until) <= date(?)) ORDER BY score DESC LIMIT 8", (TODAY.isoformat(),))]


def label(signal):
    return {"overdue_invoice":"Money at risk", "customer_gone_quiet":"Customer attention", "broken_commitment":"Open loop", "unanswered_complaint":"At risk", "supplier_price_change":"Supplier signal", "messy_entity_resolution":"Memory update"}.get(signal, signal.replace("_"," "))


def draft_for(action):
    entity = "our partner"
    if action.get("entity_id"):
        table = "customers" if action.get("entity_type") == "customer" else "suppliers"
        with connect(DB_PATH) as conn:
            row = conn.execute(f"SELECT name FROM {table} WHERE id=?", (action["entity_id"],)).fetchone()
            if row:
                entity = row[0]
    if action["signal_type"] == "overdue_invoice":
        return "Quick follow-up on your outstanding invoice", f"Hi {entity} team,\n\nI wanted to follow up on the outstanding invoice referenced below. Could you let me know the expected payment date? If anything is blocking it, I’m happy to help resolve it.\n\nBest,\nAlex"
    if action["signal_type"] == "unanswered_complaint":
        return "We’re looking into this", f"Hi there,\n\nI’m sorry this has been frustrating. I’ve picked this up personally and am checking the shipment details now. I’ll come back with a concrete update and next step shortly.\n\nBest,\nAlex"
    if action["signal_type"] == "customer_gone_quiet":
        return f"Checking in with {entity}", f"Hi there,\n\nI wanted to check in and see what is coming up for your team. We noticed it has been a little while since your last order, and we’d be glad to help plan the next replenishment if useful.\n\nBest,\nAlex"
    return f"Follow-up: {action['title']}", f"Hi there,\n\nI’m following up on the item below and wanted to share a clear next step. {action['suggested_action']}\n\nBest,\nAlex"


def record(action_id, action, snooze=None):
    with connect(DB_PATH) as conn:
        if snooze:
            until=TODAY+timedelta(days=snooze); conn.execute("UPDATE action_items SET snooze_until=?, status='snoozed' WHERE id=?", (until.isoformat(), action_id))
        else:
            conn.execute("UPDATE action_items SET status=? WHERE id=?", (action, action_id))
        conn.execute("INSERT INTO feedback(action_item_id,signal_type,action) SELECT id,signal_type,? FROM action_items WHERE id=?", (action, action_id))
    st.rerun()

with connect(DB_PATH) as conn:
    rows=query_actions()
    money=sum(float(r["money_at_stake"] or 0) for r in rows)
    customer_ids={r["entity_id"] for r in rows if r["entity_type"]=="customer"}

formatted_date = f"{TODAY.strftime('%A, %B')} {TODAY.day}, {TODAY.year}"
st.markdown(f'<div class="hero"><div class="small" style="color:#aebaff">ACTIONDESK · MORNING BRIEF</div><h1>Your business remembers.</h1><p>{formatted_date} · A short list of what deserves attention now.</p></div>', unsafe_allow_html=True)
cols=st.columns(3)
for col, title, value in zip(cols, ["Money at risk", "Customers needing attention", "Priority items"], [f"${money:,.0f}", len(customer_ids), len(rows)]):
    col.markdown(f'<div class="metric"><div class="small">{title}</div><div style="font-size:1.55rem;font-weight:800;color:#0c1735">{value}</div></div>', unsafe_allow_html=True)

with st.sidebar:
    st.markdown("### Control room")
    source = st.selectbox("Data source", ["Synthetic demo", "Gmail · read-only"])
    if source == "Gmail · read-only" and st.button("↻ Sync Gmail", use_container_width=True):
        with st.spinner("Syncing Gmail read-only messages…"):
            try:
                run(source="gmail")
                st.success("Gmail synced and brief rebuilt.")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    if st.button("↻ Re-run analysis", use_container_width=True):
        run(); st.rerun()
    st.caption("Gmail uses OAuth readonly scope. Synthetic data remains the safe fallback.")
    st.markdown("### Entity timeline")
    with connect(DB_PATH) as conn:
        entities=[r["name"] for r in conn.execute("SELECT name FROM customers ORDER BY name")]
        if entities:
            selected=st.selectbox("Customer", entities)
            entity=conn.execute("SELECT id FROM customers WHERE name=?", (selected,)).fetchone()
            if entity:
                for e in conn.execute("SELECT date,subject FROM emails WHERE entity_type='customer' AND entity_id=? ORDER BY date DESC LIMIT 6", (entity["id"],)):
                    st.caption(f"{e['date']} · {e['subject']}")
    st.markdown("### Evaluation")
    st.info("Run `python -m eval.run_eval` to refresh precision and recall.")

st.markdown("## Morning Brief")
st.caption("Surface, don’t search · every recommendation keeps its evidence attached.")
if not rows:
    st.success("Nothing urgent is open. Your business is clear for now.")
for action in rows:
    evidence=json.loads(action["evidence_json"] or "[]")
    st.markdown(f'<div class="card"><span class="badge">{label(action["signal_type"])}</span> <span class="small">{action["entity_type"].title()} · ${float(action["money_at_stake"] or 0):,.0f} at stake</span><h3>{action["title"]}</h3><p><b>Why:</b> {action["why"]}</p><p><b>Suggested next step:</b> {action["suggested_action"]}</p></div>', unsafe_allow_html=True)
    with st.expander(f"Evidence · {len(evidence)} source records"):
        for item in evidence:
            st.json(item)
    c1,c2,c3,c4=st.columns([1.2,1,1,1])
    if c1.button("Draft reply", key=f"draft-{action['id']}"):
        st.session_state[f"draft-{action['id']}"]=True
    if c2.button("Done", key=f"done-{action['id']}"): record(action["id"], "done")
    if c3.button("Snooze 1d", key=f"snooze-{action['id']}"): record(action["id"], "snoozed", 1)
    if c4.button("Dismiss", key=f"dismiss-{action['id']}"): record(action["id"], "dismissed")
    if st.session_state.get(f"draft-{action['id']}"):
        subject, body=draft_for(action)
        st.text_input("Subject", subject, key=f"subject-{action['id']}")
        st.text_area("Editable draft · nothing is sent automatically", body, height=180, key=f"body-{action['id']}")
        st.caption("Grounded in the attached evidence. Edit, copy, and send yourself when ready.")
