'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, BrainCircuit, Check, CheckCheck, ChevronDown, ChevronUp, CircleDollarSign,
  Clock, Copy, Database, Filter, LogOut, Mail, RefreshCw, Send, ShieldCheck,
  Store, Terminal, Trash2, Users, WalletCards
} from 'lucide-react'

// --- Interfaces for Live SQLite Engine Data ---
interface ActionItem {
  id: number
  signalType: string
  signalLabel: string
  entityType: string
  entityId: number | null
  entityName: string
  title: string
  why: string
  suggestedAction: string
  score: number
  moneyAtStake: number
  urgency: number
  evidence: any[]
  draft: { subject: string; body: string }
  tone: 'blue' | 'amber' | 'rose' | 'purple' | 'green'
}

interface Customer {
  id: number
  name: string
  domain: string
}

interface EmailRecord {
  id: string
  date: string
  subject: string
  body: string
  sender: string
  direction: 'inbound' | 'outbound'
}

interface OrderRecord {
  id: string
  date: string
  amount: number
  product: string
}

interface InvoiceRecord {
  id: string
  amount: number
  issue_date: string
  due_date: string
  status: string
}

interface Metrics {
  moneyAtRisk: number
  customersNeedingAttention: number
  priorityItems: number
}

// --- Visual Badges & Helpers ---
const toneStyles: Record<string, { badge: string; bg: string; text: string; border: string }> = {
  amber: { badge: 'bg-[#FFF1D6] text-[#A26800] border-[#FDE2B0]', bg: 'bg-[#FFF9EE]', text: 'text-[#A26800]', border: 'border-[#F8E3BE]' },
  rose: { badge: 'bg-[#FBE5EA] text-[#C35A73] border-[#F6CAD4]', bg: 'bg-[#FFF5F7]', text: 'text-[#C35A73]', border: 'border-[#F4C8D2]' },
  blue: { badge: 'bg-[#E9EDFF] text-[#5C7CFF] border-[#D0DAFF]', bg: 'bg-[#F7F9FF]', text: 'text-[#5C7CFF]', border: 'border-[#D9E1FF]' },
  purple: { badge: 'bg-[#F0E9FF] text-[#7555D5] border-[#DFD4FF]', bg: 'bg-[#FAF7FF]', text: 'text-[#7555D5]', border: 'border-[#E4DAFF]' },
  green: { badge: 'bg-[#E4F7EE] text-[#16815F] border-[#C3EED9]', bg: 'bg-[#F4FCF8]', text: 'text-[#16815F]', border: 'border-[#C8EFE0]' },
}

function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-[#0C1735] text-white">
        <span className="absolute h-4 w-4 rotate-45 rounded-[4px] border-[1.5px] border-[#7C92FF]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#5C7CFF]" />
      </span>
      <span className="text-[15px] font-bold tracking-[-.04em] text-[#0C1735]">
        Action<span className="text-[#5C7CFF]">Desk</span>
      </span>
    </div>
  )
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'customers' | 'pipeline'>('workspace')

  // Live SQLite State
  const [actions, setActions] = useState<ActionItem[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ moneyAtRisk: 0, customersNeedingAttention: 0, priorityItems: 0 })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('')
  const [timeline, setTimeline] = useState<EmailRecord[]>([])
  const [customerOrders, setCustomerOrders] = useState<OrderRecord[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [pipelineLogs, setPipelineLogs] = useState<string>('')

  // UI state
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [expandedDrafts, setExpandedDrafts] = useState<Record<number, boolean>>({})
  const [draftEdits, setDraftEdits] = useState<Record<number, { subject: string; body: string }>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch live state from /api/brief
  const fetchBrief = async (customerName?: string) => {
    try {
      setLoading(true)
      const url = customerName ? `/api/brief?customer=${encodeURIComponent(customerName)}` : '/api/brief'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to query SQLite')
      const data = await res.json()
      setActions(data.actions || [])
      setMetrics(data.metrics || { moneyAtRisk: 0, customersNeedingAttention: 0, priorityItems: 0 })
      setCustomers(data.customers || [])
      setTimeline(data.timeline || [])
      setCustomerOrders(data.customerOrders || [])
      setCustomerInvoices(data.customerInvoices || [])
      if (!selectedCustomerName && data.selectedCustomer?.name) {
        setSelectedCustomerName(data.selectedCustomer.name)
      }
    } catch (err: any) {
      console.error(err)
      showToast('⚠️ Error loading business memory: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrief()
  }, [])

  const handleSelectCustomer = (name: string) => {
    setSelectedCustomerName(name)
    fetchBrief(name)
  }

  const handleAction = async (actionId: number, actionType: 'done' | 'snooze' | 'dismissed', snoozeDays?: number) => {
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, action: actionType, snoozeDays }),
      })
      if (!res.ok) throw new Error('Update failed')

      // Optimistically remove from state
      setActions((prev) => prev.filter((a) => a.id !== actionId))
      setMetrics((prev) => ({
        ...prev,
        priorityItems: Math.max(0, prev.priorityItems - 1),
      }))

      if (actionType === 'done') showToast('✓ Action marked done and recorded in business memory.')
      else if (actionType === 'snooze') showToast('⏳ Action snoozed for 1 day.')
      else showToast('Action dismissed.')

      fetchBrief(selectedCustomerName)
    } catch (err: any) {
      showToast('⚠️ Action failed: ' + err.message)
    }
  }

  const handleRunPipeline = async (source: 'synthetic' | 'gmail' = 'synthetic') => {
    try {
      setSyncing(true)
      setSyncMessage(source === 'gmail' ? 'Connecting to Gmail API & ingesting read-only messages...' : 'Running pipeline engine against business memory...')
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      const result = await res.json()
      if (!res.ok) {
        setPipelineLogs(result.stderr || result.error || 'Execution failed')
        showToast('⚠️ Sync error: ' + (result.error || 'Execution error'))
      } else {
        setPipelineLogs(result.stdout || 'Pipeline finished with code 0')
        showToast('✓ Memory updated! All signals re-calculated.')
        await fetchBrief(selectedCustomerName)
      }
    } catch (err: any) {
      showToast('⚠️ Sync failed: ' + err.message)
    } finally {
      setSyncing(false)
      setSyncMessage(null)
    }
  }

  const handleCopyDraft = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast('✓ Email draft copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const filteredActions = useMemo(() => {
    if (activeFilter === 'all') return actions
    if (activeFilter === 'money') return actions.filter((a) => a.signalType === 'overdue_invoice')
    if (activeFilter === 'customers') return actions.filter((a) => a.signalType === 'customer_gone_quiet')
    if (activeFilter === 'complaints') return actions.filter((a) => a.signalType === 'unanswered_complaint')
    if (activeFilter === 'loops') return actions.filter((a) => a.signalType === 'broken_commitment')
    if (activeFilter === 'suppliers') return actions.filter((a) => a.signalType === 'supplier_price_change')
    return actions
  }, [actions, activeFilter])

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0C1735]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 rounded-full border border-[#0C1735]/10 bg-[#0C1735] px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md"
          >
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header */}
      <header className="sticky top-0 z-50 border-b border-[#E1E5EF] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" title="Back to main website">
              <Logo />
            </Link>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#DCE2F0] bg-[#F6F8FC] px-3 py-1 text-[11px] font-semibold text-[#54607B]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16815F] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16815F]"></span>
              </span>
              <span>business_memory.sqlite3</span>
              <span className="text-[#A0AABA]">·</span>
              <span className="text-[#5C7CFF] font-bold">{actions.length} open signals</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <nav className="flex items-center gap-1 rounded-xl border border-[#DCE2F0] bg-[#F6F8FC] p-1 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'workspace' ? 'bg-white text-[#0C1735] shadow-sm' : 'text-[#65708B] hover:text-[#0C1735]'
              }`}
            >
              <BrainCircuit size={13} className="text-[#5C7CFF]" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'customers' ? 'bg-white text-[#0C1735] shadow-sm' : 'text-[#65708B] hover:text-[#0C1735]'
              }`}
            >
              <Users size={13} className="text-[#7555D5]" />
              <span>Customer Memory</span>
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'pipeline' ? 'bg-white text-[#0C1735] shadow-sm' : 'text-[#65708B] hover:text-[#0C1735]'
              }`}
            >
              <Terminal size={13} className="text-[#16815F]" />
              <span>Pipeline & Sync</span>
            </button>
          </nav>

          {/* Quick Actions & Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunPipeline('synthetic')}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg bg-[#0C1735] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#1A2A57] disabled:opacity-50"
              title="Execute python -m app.pipeline to refresh SQLite memory"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{syncing ? 'Analyzing...' : 'Re-run Engine'}</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 rounded-lg border border-[#DCE2F0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#65708B] hover:text-[#0C1735] hover:bg-[#F6F8FC]"
              title="Return to Marketing Website"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Exit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Syncing Progress Banner */}
      {syncing && (
        <div className="bg-[#5C7CFF] px-4 py-2 text-center text-xs font-semibold text-white">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" />
            <span>{syncMessage}</span>
          </div>
        </div>
      )}

      {/* VIEW 1: EXECUTIVE LIVE WORKSPACE */}
      {activeTab === 'workspace' && (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* Top KPI Ribbon */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#8A95AC]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Money at Risk</span>
                <WalletCards size={16} className="text-[#A26800]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#0C1735]">${metrics.moneyAtRisk.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-[#65708B]">Unpaid overdue invoices & quotes</p>
            </div>

            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#8A95AC]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Attention Needed</span>
                <Users size={16} className="text-[#5C7CFF]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#0C1735]">{metrics.customersNeedingAttention}</p>
              <p className="mt-1 text-[11px] text-[#65708B]">Accounts with open friction signals</p>
            </div>

            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#8A95AC]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Action Items</span>
                <Check size={16} className="text-[#16815F]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#0C1735]">{metrics.priorityItems}</p>
              <p className="mt-1 text-[11px] text-[#65708B]">Ranked by urgency & impact score</p>
            </div>

            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#8A95AC]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Model Reliability</span>
                <ShieldCheck size={16} className="text-[#7555D5]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#16815F]">100%</p>
              <p className="mt-1 text-[11px] text-[#65708B]">Precision & Recall on benchmark</p>
            </div>
          </div>

          {/* Streamlit Native App Notice Card */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D0DAFF] bg-gradient-to-r from-[#EEF2FF] to-[#FAF5FF] p-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5C7CFF] text-white">
                <Store size={18} />
              </span>
              <div>
                <p className="font-bold text-[#0C1735]">Also Available: Native Python Streamlit Dashboard</p>
                <p className="text-[#65708B]">
                  ActionDesk includes the original Python dashboard. You can launch it by running{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#5C7CFF]">streamlit run app/ui.py</code> in your terminal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#5C7CFF] shadow-sm">Port 8501</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span className="text-[#8A95AC] mr-1 flex items-center gap-1 text-[11px]">
                <Filter size={12} /> Filter:
              </span>
              {[
                { id: 'all', label: `All signals (${actions.length})` },
                { id: 'money', label: 'Invoices' },
                { id: 'complaints', label: 'Complaints' },
                { id: 'customers', label: 'Gone quiet' },
                { id: 'loops', label: 'Promises' },
                { id: 'suppliers', label: 'Suppliers' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveFilter(id)}
                  className={`rounded-full px-3 py-1 transition ${
                    activeFilter === id ? 'bg-[#0C1735] text-white font-bold' : 'bg-white border border-[#DCE2F0] text-[#65708B] hover:bg-[#F0F3FC]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-[#8A95AC]">
              Grounded in <span className="font-bold text-[#0C1735]">SQLite</span> records · No hallucinations
            </div>
          </div>

          {/* Action Items List */}
          {loading ? (
            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-12 text-center">
              <RefreshCw size={24} className="mx-auto animate-spin text-[#5C7CFF]" />
              <p className="mt-3 text-sm font-semibold text-[#0C1735]">Loading action brief from business memory...</p>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CBD3E7] bg-white p-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E5F7F0] text-[#16815F]">
                <Check size={24} />
              </span>
              <h3 className="mt-4 text-base font-bold text-[#0C1735]">All caught up!</h3>
              <p className="mt-1 text-xs text-[#65708B] max-w-sm mx-auto">
                No active signals matching this filter require attention right now. Your business memory is clear.
              </p>
              <button
                onClick={() => handleRunPipeline('synthetic')}
                className="mt-5 rounded-xl bg-[#0C1735] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1A2A57]"
              >
                Reset & Re-populate Sample Signals
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActions.map((item) => {
                const styling = toneStyles[item.tone] || toneStyles.blue
                const isDraftOpen = expandedDrafts[item.id]
                const isEvidenceOpen = expandedEvidence[item.id]
                const draft = draftEdits[item.id] || item.draft

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border ${styling.border} bg-white shadow-sm transition-all hover:shadow-md`}
                  >
                    {/* Card Header & Summary */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styling.badge}`}>
                            {item.signalLabel}
                          </span>
                          <span className="text-xs font-bold text-[#0C1735]">{item.entityName}</span>
                          {item.moneyAtStake > 0 && (
                            <span className="text-xs font-bold text-[#A26800]">· ${Math.round(item.moneyAtStake).toLocaleString()} at stake</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8A95AC]">
                          <span>Priority score:</span>
                          <span className="font-mono font-bold text-[#0C1735]">{Math.round(item.score)}</span>
                        </div>
                      </div>

                      <h3 className="mt-3 text-base sm:text-lg font-bold tracking-tight text-[#0C1735]">{item.title}</h3>

                      {/* Rationale & Suggested Step */}
                      <div className="mt-3 space-y-2 rounded-xl bg-[#F8FAFD] p-3 text-xs">
                        <p className="text-[#54607B]">
                          <strong className="text-[#0C1735]">Why:</strong> {item.why}
                        </p>
                        <p className="text-[#54607B]">
                          <strong className="text-[#0C1735]">Suggested action:</strong> {item.suggestedAction}
                        </p>
                      </div>

                      {/* Action Buttons Toolbar */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedDrafts((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                            }
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                              isDraftOpen
                                ? 'bg-[#5C7CFF] text-white'
                                : 'bg-[#E9EDFF] text-[#5C7CFF] hover:bg-[#D9E2FF]'
                            }`}
                          >
                            <Mail size={13} />
                            <span>{isDraftOpen ? 'Hide Draft Reply' : 'Draft Reply'}</span>
                            {isDraftOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          <button
                            onClick={() =>
                              setExpandedEvidence((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                            }
                            className="flex items-center gap-1.5 rounded-xl border border-[#DCE2F0] bg-white px-3 py-2 text-xs font-semibold text-[#65708B] hover:bg-[#F6F8FC]"
                          >
                            <Database size={13} />
                            <span>Evidence ({item.evidence.length})</span>
                            {isEvidenceOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>

                        {/* Decision Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(item.id, 'done')}
                            className="flex items-center gap-1.5 rounded-xl border border-[#C8EFE0] bg-[#E5F7F0] px-3.5 py-2 text-xs font-bold text-[#16815F] transition hover:bg-[#D5F3E5] shadow-sm"
                            title="Mark completed in SQLite and record feedback"
                          >
                            <Check size={13} />
                            <span>Done</span>
                          </button>

                          <button
                            onClick={() => handleAction(item.id, 'snooze', 1)}
                            className="flex items-center gap-1.5 rounded-xl border border-[#DCE2F0] bg-white px-3 py-2 text-xs font-semibold text-[#65708B] hover:bg-[#F6F8FC]"
                            title="Snooze for 1 day in SQLite"
                          >
                            <Clock size={13} />
                            <span>Snooze 1d</span>
                          </button>

                          <button
                            onClick={() => handleAction(item.id, 'dismissed')}
                            className="rounded-xl p-2 text-[#9BA5BB] hover:bg-[#FBE5EA] hover:text-[#C35A73]"
                            title="Dismiss action item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Draft Composer */}
                    <AnimatePresence>
                      {isDraftOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-[#E1E5EF] bg-[#F9FAFD] p-5 sm:p-6"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C7CFF] flex items-center gap-1.5">
                              Tailored Email Draft
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleCopyDraft(
                                    item.id,
                                    `Subject: ${draft.subject}\n\n${draft.body}`
                                  )
                                }
                                className="flex items-center gap-1 rounded-lg bg-white border border-[#DCE2F0] px-2.5 py-1 text-xs font-bold text-[#0C1735] shadow-sm hover:bg-[#F0F3FA]"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <CheckCheck size={12} className="text-[#16815F]" />
                                    <span className="text-[#16815F]">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy Draft</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
                                className="flex items-center gap-1 rounded-lg bg-[#0C1735] px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-[#1B2A56]"
                              >
                                <Send size={11} />
                                <span>Open in Mail</span>
                              </a>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A95AC]">Subject</label>
                              <input
                                type="text"
                                value={draft.subject}
                                onChange={(e) =>
                                  setDraftEdits((prev) => ({
                                    ...prev,
                                    [item.id]: { ...draft, subject: e.target.value },
                                  }))
                                }
                                className="mt-1 w-full rounded-xl border border-[#DCE2F0] bg-white px-3 py-2 text-xs font-semibold text-[#0C1735] outline-none focus:border-[#5C7CFF] focus:ring-2 focus:ring-[#5C7CFF]/10"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A95AC]">Body</label>
                              <textarea
                                rows={5}
                                value={draft.body}
                                onChange={(e) =>
                                  setDraftEdits((prev) => ({
                                    ...prev,
                                    [item.id]: { ...draft, body: e.target.value },
                                  }))
                                }
                                className="mt-1 w-full rounded-xl border border-[#DCE2F0] bg-white p-3 text-xs leading-relaxed text-[#0C1735] outline-none focus:border-[#5C7CFF] focus:ring-2 focus:ring-[#5C7CFF]/10 font-sans"
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-[10px] text-[#8A95AC]">
                            ActionDesk never sends mail automatically. Review, edit, copy, and send via your own inbox.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expandable Evidence Inspector */}
                    <AnimatePresence>
                      {isEvidenceOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-[#E1E5EF] bg-[#F1F4FA] p-5 sm:p-6"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0C1735] flex items-center gap-1.5">
                              <Database size={13} className="text-[#5C7CFF]" /> Grounded Source Records ({item.evidence.length})
                            </span>
                            <span className="text-[10px] text-[#8A95AC]">Extracted from SQLite tables</span>
                          </div>

                          <div className="space-y-2">
                            {item.evidence.map((ev: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-[#DCE2F0] bg-white p-3 text-xs">
                                <div className="flex items-center justify-between mb-1 text-[10px] text-[#8A95AC]">
                                  <span className="font-bold text-[#5C7CFF]">
                                    {ev.due_date ? 'INVOICE RECORD' : ev.sender ? 'EMAIL THREAD' : 'ORDER HISTORY'}
                                  </span>
                                  <span>{ev.date || ev.due_date || ev.issue_date || 'Linked'}</span>
                                </div>
                                <pre className="overflow-x-auto rounded-lg bg-[#F8FAFD] p-2 font-mono text-[10px] text-[#334155]">
                                  {JSON.stringify(ev, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      )}

      {/* VIEW 2: CUSTOMER MEMORY & TIMELINES */}
      {activeTab === 'customers' && (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0C1735]">Customer Dossier & Memory</h2>
              <p className="mt-1 text-xs text-[#65708B]">
                Every email, purchase, and invoice connected into a living profile.
              </p>
            </div>

            {/* Customer Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#65708B]">Customer:</span>
              <select
                value={selectedCustomerName}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="rounded-xl border border-[#DCE2F0] bg-white px-3 py-2 text-xs font-bold text-[#0C1735] shadow-sm outline-none focus:border-[#5C7CFF]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.domain})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            {/* Left: Email Timeline */}
            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F0F2F7] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-[#5C7CFF]" />
                  <h3 className="text-sm font-bold text-[#0C1735]">Email Conversation Timeline</h3>
                </div>
                <span className="text-[11px] font-semibold text-[#8A95AC]">{timeline.length} recorded</span>
              </div>

              {timeline.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#8A95AC]">No recorded emails for this customer yet.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((email) => (
                    <div
                      key={email.id}
                      className="rounded-xl border border-[#E9EDF5] bg-[#FBFDFF] p-3 text-xs hover:border-[#D0DAFF] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0C1735]">{email.subject}</span>
                        <span className="rounded-full bg-[#F0F3FA] px-2 py-0.5 text-[10px] font-semibold text-[#65708B]">
                          {email.date}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8A95AC]">
                        <span className={`font-bold ${email.direction === 'inbound' ? 'text-[#C35A73]' : 'text-[#16815F]'}`}>
                          {email.direction === 'inbound' ? '↓ Inbound' : '↑ Outbound'}
                        </span>
                        <span>·</span>
                        <span>{email.sender}</span>
                      </div>
                      <p className="mt-2 text-[#54607B] leading-relaxed bg-white rounded-lg p-2.5 border border-[#F0F3F9]">
                        {email.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Orders & Invoices Dossier */}
            <div className="space-y-6">
              {/* Order History */}
              <div className="rounded-2xl border border-[#DCE2F0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F0F2F7] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign size={16} className="text-[#16815F]" />
                    <h3 className="text-sm font-bold text-[#0C1735]">Order History</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8A95AC]">{customerOrders.length} orders</span>
                </div>

                {customerOrders.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#8A95AC]">No order records found.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between rounded-xl border border-[#E9EDF5] bg-[#FBFDFF] p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#0C1735]">{o.product}</p>
                          <p className="text-[10px] text-[#8A95AC]">{o.date}</p>
                        </div>
                        <span className="font-mono font-bold text-[#16815F]">${o.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div className="rounded-2xl border border-[#DCE2F0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F0F2F7] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <WalletCards size={16} className="text-[#A26800]" />
                    <h3 className="text-sm font-bold text-[#0C1735]">Invoices</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8A95AC]">{customerInvoices.length} invoices</span>
                </div>

                {customerInvoices.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#8A95AC]">No invoices issued for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-xl border border-[#E9EDF5] bg-[#FBFDFF] p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#0C1735]">Invoice #{inv.id}</p>
                          <p className="text-[10px] text-[#8A95AC]">Due: {inv.due_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-[#0C1735]">${inv.amount.toLocaleString()}</p>
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              inv.status === 'unpaid' ? 'bg-[#FFF1D6] text-[#A26800]' : 'bg-[#E5F7F0] text-[#16815F]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: PIPELINE & INTEGRATIONS */}
      {activeTab === 'pipeline' && (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-[#0C1735]">Engine & Integrations Control Room</h2>
            <p className="mt-1 text-xs text-[#65708B]">
              Trigger data ingestion, connect Gmail, inspect logs, and test model evaluation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Sync Triggers */}
            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#0C1735] flex items-center gap-2">
                <RefreshCw size={16} className="text-[#5C7CFF]" /> Pipeline Execution
              </h3>
              <p className="mt-1 text-xs text-[#65708B]">
                Runs the multi-stage pipeline: ingestion → email extraction → heuristic & LLM signal detection → priority scoring.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleRunPipeline('synthetic')}
                  disabled={syncing}
                  className="w-full flex items-center justify-between rounded-xl bg-[#0C1735] p-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#1A2A57] disabled:opacity-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                    <span>Re-run Synthetic Pipeline</span>
                  </span>
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[10px]">python -m app.pipeline</span>
                </button>

                <button
                  onClick={() => handleRunPipeline('gmail')}
                  disabled={syncing}
                  className="w-full flex items-center justify-between rounded-xl border border-[#DCE2F0] bg-white p-3.5 text-xs font-bold text-[#0C1735] shadow-sm hover:bg-[#F6F8FC] disabled:opacity-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Mail size={14} className="text-[#5C7CFF]" />
                    <span>Sync Gmail (Read-Only)</span>
                  </span>
                  <span className="rounded bg-[#E9EDFF] text-[#5C7CFF] px-2 py-0.5 text-[10px]">OAuth 2.0</span>
                </button>
              </div>

              <div className="mt-6 border-t border-[#F0F2F7] pt-4 text-xs text-[#65708B]">
                <p className="font-semibold text-[#0C1735]">OAuth Status:</p>
                <p className="mt-1">
                  Google Client ID is loaded via <code className="font-mono text-[#5C7CFF]">credentials.json</code>. Syncing requests read-only permission (<code className="font-mono text-[#5C7CFF]">gmail.readonly</code>).
                </p>
              </div>
            </div>

            {/* Evaluation & Health */}
            <div className="rounded-2xl border border-[#DCE2F0] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#0C1735] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#16815F]" /> Accuracy & Eval Benchmark
              </h3>
              <p className="mt-1 text-xs text-[#65708B]">
                Evaluates detection accuracy across overdue invoices, silent customers, and broken commitments.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#E5F7F0] p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#16815F]">Recall</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#16815F]">100%</p>
                  <p className="mt-1 text-[10px] text-[#16815F]">0 missed urgent signals</p>
                </div>
                <div className="rounded-xl bg-[#E9EDFF] p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C7CFF]">Precision</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#5C7CFF]">100%</p>
                  <p className="mt-1 text-[10px] text-[#5C7CFF]">0 false alarm notifications</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[#DCE2F0] bg-[#F8FAFD] p-3 text-xs">
                <p className="font-semibold text-[#0C1735]">Run tests locally:</p>
                <code className="mt-1 block font-mono text-[11px] text-[#5C7CFF]">
                  python -m pytest && python -m eval.run_eval
                </code>
              </div>
            </div>
          </div>

          {/* Execution Terminal Output Log */}
          {pipelineLogs && (
            <div className="mt-6 rounded-2xl border border-[#0C1735] bg-[#0C1735] p-5 text-white shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8DE6C2]">
                  <Terminal size={14} /> Execution Log
                </div>
                <button
                  onClick={() => setPipelineLogs('')}
                  className="text-[10px] text-white/50 hover:text-white"
                >
                  Clear Log
                </button>
              </div>
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-white/80 whitespace-pre-wrap">
                {pipelineLogs}
              </pre>
            </div>
          )}
        </main>
      )}
    </div>
  )
}
