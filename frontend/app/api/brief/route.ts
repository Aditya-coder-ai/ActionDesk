import { NextResponse } from 'next/server'
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

function getDb() {
  const p1 = path.resolve(process.cwd(), '..', 'business_memory.sqlite3')
  const p2 = path.resolve(process.cwd(), 'business_memory.sqlite3')
  const dbPath = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : null
  if (!dbPath) {
    throw new Error('Database business_memory.sqlite3 not found')
  }
  return new DatabaseSync(dbPath)
}

function label(signal: string): string {
  const map: Record<string, string> = {
    overdue_invoice: 'Money at risk',
    customer_gone_quiet: 'Customer attention',
    broken_commitment: 'Open loop',
    unanswered_complaint: 'At risk',
    supplier_price_change: 'Supplier signal',
    messy_entity_resolution: 'Memory update',
  }
  return map[signal] || signal.replace(/_/g, ' ')
}

function draftFor(action: any, entityName: string): { subject: string; body: string } {
  const entity = entityName || 'our partner'
  if (action.signal_type === 'overdue_invoice') {
    return {
      subject: 'Quick follow-up on your outstanding invoice',
      body: `Hi ${entity} team,\n\nI wanted to follow up on the outstanding invoice referenced below. Could you let me know the expected payment date? If anything is blocking it, I’m happy to help resolve it.\n\nBest,\nAlex`,
    }
  }
  if (action.signal_type === 'unanswered_complaint') {
    return {
      subject: 'We’re looking into this',
      body: `Hi there,\n\nI’m sorry this has been frustrating. I’ve picked this up personally and am checking the shipment details now. I’ll come back with a concrete update and next step shortly.\n\nBest,\nAlex`,
    }
  }
  if (action.signal_type === 'customer_gone_quiet') {
    return {
      subject: `Checking in with ${entity}`,
      body: `Hi there,\n\nI wanted to check in and see what is coming up for your team. We noticed it has been a little while since your last order, and we’d be glad to help plan the next replenishment if useful.\n\nBest,\nAlex`,
    }
  }
  return {
    subject: `Follow-up: ${action.title}`,
    body: `Hi there,\n\nI’m following up on the item below and wanted to share a clear next step. ${action.suggested_action}\n\nBest,\nAlex`,
  }
}

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const customerName = searchParams.get('customer')

    // Query active action items
    const rawActions = db
      .prepare(
        "SELECT * FROM action_items WHERE status = 'open' AND (snooze_until IS NULL OR date(snooze_until) <= date('now')) ORDER BY score DESC LIMIT 8"
      )
      .all() as any[]

    const actions = rawActions.map((a) => {
      let entityName = 'Partner'
      if (a.entity_id) {
        const table = a.entity_type === 'customer' ? 'customers' : 'suppliers'
        const entityRow = db.prepare(`SELECT name FROM ${table} WHERE id = ?`).get(a.entity_id) as any
        if (entityRow) entityName = entityRow.name
      }
      let evidence = []
      try {
        evidence = JSON.parse(a.evidence_json || '[]')
      } catch {
        evidence = []
      }
      const draft = draftFor(a, entityName)

      let tone = 'blue'
      if (a.signal_type === 'overdue_invoice') tone = 'amber'
      else if (a.signal_type === 'unanswered_complaint') tone = 'rose'
      else if (a.signal_type === 'customer_gone_quiet') tone = 'blue'
      else if (a.signal_type === 'broken_commitment') tone = 'purple'
      else if (a.signal_type === 'supplier_price_change') tone = 'green'
      else tone = 'blue'

      return {
        id: a.id,
        signalType: a.signal_type,
        signalLabel: label(a.signal_type),
        entityType: a.entity_type,
        entityId: a.entity_id,
        entityName,
        title: a.title,
        why: a.why,
        suggestedAction: a.suggested_action,
        score: a.score,
        moneyAtStake: a.money_at_stake || 0,
        urgency: a.urgency,
        evidence,
        draft,
        tone,
      }
    })

    const moneyAtRisk = actions.reduce((sum, a) => sum + (Number(a.moneyAtStake) || 0), 0)
    const customerIds = new Set(actions.filter((a) => a.entityType === 'customer').map((a) => a.entityId))

    // Customer list for timeline
    const customers = db.prepare('SELECT id, name, domain FROM customers ORDER BY name').all() as any[]

    // Customer timeline emails
    let selectedCustomerId = customers[0]?.id
    if (customerName) {
      const found = customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase())
      if (found) selectedCustomerId = found.id
    }

    let timeline = []
    let customerOrders = []
    let customerInvoices = []
    if (selectedCustomerId) {
      timeline = db
        .prepare(
          "SELECT id, date, subject, body, sender, direction FROM emails WHERE entity_type = 'customer' AND entity_id = ? ORDER BY date DESC LIMIT 10"
        )
        .all(selectedCustomerId) as any[]
      customerOrders = db
        .prepare('SELECT id, date, amount, product FROM orders WHERE customer_id = ? ORDER BY date DESC LIMIT 10')
        .all(selectedCustomerId) as any[]
      customerInvoices = db
        .prepare('SELECT id, amount, issue_date, due_date, status FROM invoices WHERE customer_id = ? ORDER BY due_date DESC LIMIT 10')
        .all(selectedCustomerId) as any[]
    }

    const recentFeedback = db
      .prepare('SELECT f.id, f.signal_type, f.action, f.created_at, a.title FROM feedback f LEFT JOIN action_items a ON a.id = f.action_item_id ORDER BY f.id DESC LIMIT 5')
      .all() as any[]

    return NextResponse.json({
      actions,
      metrics: {
        moneyAtRisk,
        customersNeedingAttention: customerIds.size,
        priorityItems: actions.length,
      },
      customers,
      timeline,
      customerOrders,
      customerInvoices,
      recentFeedback,
      selectedCustomer: customers.find((c) => c.id === selectedCustomerId) || null,
      syncedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb()
    const { actionId, action, snoozeDays } = await request.json()

    if (!actionId || !action) {
      return NextResponse.json({ error: 'Missing actionId or action' }, { status: 400 })
    }

    if (action === 'snooze' && snoozeDays) {
      const until = new Date()
      until.setDate(until.getDate() + Number(snoozeDays))
      const untilStr = until.toISOString().split('T')[0]
      db.prepare("UPDATE action_items SET status = 'snoozed', snooze_until = ? WHERE id = ?").run(
        untilStr,
        actionId
      )
    } else {
      db.prepare('UPDATE action_items SET status = ? WHERE id = ?').run(action, actionId)
    }

    db.prepare('INSERT INTO feedback(action_item_id, signal_type, action) SELECT id, signal_type, ? FROM action_items WHERE id = ?').run(
      action,
      actionId
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
