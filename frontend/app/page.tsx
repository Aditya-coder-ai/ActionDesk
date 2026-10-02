'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, BrainCircuit, Check, ChevronRight, CircleDollarSign,
  Clock3, Database, FileText, Layers3, LogIn, Mail, Menu, MessageSquare, MoreHorizontal, Network,
  PanelTop, Play, Plus, Search, Send, Settings2, Sparkles, Store, Target, Users, WalletCards, X,
  Zap
} from 'lucide-react'

const sources = [
  { label: 'Emails', icon: Mail, tone: 'bg-[#E8EDFF] text-[#5C7CFF]' },
  { label: 'Sales data', icon: CircleDollarSign, tone: 'bg-[#E5F7F0] text-[#16815F]' },
  { label: 'Documents', icon: FileText, tone: 'bg-[#FFF2D7] text-[#A26800]' },
  { label: 'Messages', icon: MessageSquare, tone: 'bg-[#F0E9FF] text-[#7555D5]' },
  { label: 'Tasks', icon: Check, tone: 'bg-[#FBE5EA] text-[#C35A73]' },
]

const actionCards = [
  { title: 'Follow up with customer', meta: 'Sarah Chen · 2 days since reply', badge: 'High priority', icon: Users, color: 'text-[#5C7CFF]', bg: 'bg-[#E9EDFF]' },
  { title: 'Invoice overdue', meta: 'Northstar Studio · $2,400', badge: 'Needs attention', icon: WalletCards, color: 'text-[#B57712]', bg: 'bg-[#FFF1D6]' },
  { title: 'Supplier response pending', meta: 'River & Co. · sent yesterday', badge: 'Waiting', icon: Store, color: 'text-[#16815F]', bg: 'bg-[#E3F7EE]' },
  { title: 'Sales opportunity detected', meta: 'Acme team · viewed proposal 4×', badge: 'Momentum', icon: Target, color: 'text-[#7555D5]', bg: 'bg-[#F0E9FF]' },
]

const useCases = [
  { icon: Users, title: 'Customer follow-ups', copy: 'See who is waiting, what was promised, and the right tone to use.', accent: 'blue' },
  { icon: WalletCards, title: 'Pending payments', copy: 'Turn payment signals into calm, timely reminders before cash gets tight.', accent: 'amber' },
  { icon: Store, title: 'Supplier coordination', copy: 'Keep every order, delay, and response in one visible thread.', accent: 'green' },
  { icon: Target, title: 'Sales opportunities', copy: 'Spot intent in the details your CRM misses and move with context.', accent: 'purple' },
  { icon: Check, title: 'Employee tasks', copy: 'Connect internal asks to the customer or deadline they affect.', accent: 'rose' },
  { icon: Bell, title: 'Important reminders', copy: 'Never rely on memory for the promise that matters most.', accent: 'blue' },
  { icon: MessageSquare, title: 'Missed communication', copy: 'Catch the quiet gaps between a message and a next step.', accent: 'amber' },
]

const demoScenarios = {
  'Customer follow-up': {
    tab: 'Customer follow-up',
    context: 'Sarah mentioned she would review the proposal with her partner by Friday.',
    action: 'Send a friendly check-in with the revised delivery timeline.',
    reason: 'ActionDesk found a promise, a deadline, and no follow-up activity after it.',
    confidence: '94%',
  },
  'Supplier delay': {
    tab: 'Supplier delay',
    context: 'River & Co. confirmed the packaging order but has not shared a dispatch date.',
    action: 'Ask for a dispatch date and flag the inventory risk for next week.',
    reason: 'ActionDesk connected the supplier email to your inventory planning note.',
    confidence: '89%',
  },
  'Sales signal': {
    tab: 'Sales signal',
    context: 'The Acme team opened the proposal four times and asked about implementation support.',
    action: 'Share the onboarding plan and suggest a 20-minute decision call.',
    reason: 'ActionDesk connected proposal activity with a high-intent question.',
    confidence: '97%',
  },
}

type DemoKey = keyof typeof demoScenarios

function Logo({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label="ActionDesk home">
      <span className={`relative grid h-8 w-8 place-items-center rounded-[10px] ${dark ? 'bg-white/10 text-white' : 'bg-[#0C1735] text-white'}`}>
        <span className="absolute h-4 w-4 rotate-45 rounded-[4px] border-[1.5px] border-[#7C92FF]" />
        <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-[#8DE6C2]' : 'bg-[#5C7CFF]'}`} />
      </span>
      <span className={`text-[15px] font-bold tracking-[-.04em] ${dark ? 'text-white' : 'text-[#0C1735]'}`}>
        Action<span className={dark ? 'text-[#AEBBFF]' : 'text-[#5C7CFF]'}>Desk</span>
      </span>
    </a>
  )
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const sectionItems = [
  { id: 'top', label: 'Top' },
  { id: 'memory', label: 'Memory' },
  { id: 'brief', label: 'Morning brief' },
  { id: 'engine', label: 'Action engine' },
  { id: 'context', label: 'Context' },
  { id: 'demo', label: 'Preview' },
  { id: 'use-cases', label: 'Use cases' },
  { id: 'how-it-works', label: 'How it works' },
]

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px] origin-left bg-[#8DE6C2] shadow-[0_0_14px_rgba(141,230,194,.65)]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}

function SectionRail() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    const elements = sectionItems
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-38% 0px -52% 0px', threshold: [0, 0.2, 0.5, 1] }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 2xl:block" aria-label="Page sections">
      <div className="flex flex-col items-end gap-2 rounded-full border border-[#DCE2F0]/80 bg-white/65 p-2 shadow-[0_12px_35px_rgba(12,23,53,.08)] backdrop-blur-xl">
        {sectionItems.map(({ id, label }) => (
          <a key={id} href={`#${id}`} aria-label={`Jump to ${label}`} className="group flex items-center gap-2 rounded-full px-1.5 py-1">
            <span
              className={`text-[9px] font-bold transition-all duration-300 ${
                active === id ? 'w-auto max-w-24 opacity-100 text-[#5C7CFF]' : 'w-0 max-w-0 overflow-hidden opacity-0 text-[#65708B]'
              }`}
            >
              {label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                active === id ? 'h-2.5 w-2.5 bg-[#5C7CFF] shadow-[0_0_0_4px_rgba(92,124,255,.14)]' : 'h-1.5 w-1.5 bg-[#C4CDE2] group-hover:bg-[#9BA9D3]'
              }`}
            />
          </a>
        ))}
      </div>
    </nav>
  )
}

function AmbientParallax({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const targetRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  return (
    <div ref={targetRef} className={className}>
      <motion.div className="relative h-full w-full" style={{ y: shouldReduceMotion ? 0 : y }}>
        {children}
      </motion.div>
    </div>
  )
}

function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'purple' }) {
  const styles = {
    blue: 'bg-[#E9EDFF] text-[#5C7CFF]',
    green: 'bg-[#E4F7EE] text-[#16815F]',
    amber: 'bg-[#FFF1D6] text-[#A26800]',
    purple: 'bg-[#F0E9FF] text-[#7555D5]',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[tone]}`}>{children}</span>
}

function HeroFlow() {
  return (
    <div className="relative mx-auto min-h-[430px] max-w-[640px] overflow-hidden rounded-[28px] border border-white/15 bg-[#111F46]/70 p-6 shadow-[0_30px_90px_rgba(2,10,34,.28)] backdrop-blur-xl sm:p-8">
      <div className="absolute inset-0 dark-grid opacity-40" />
      <div className="absolute -right-28 -top-28 h-64 w-64 rounded-full bg-[#5C7CFF]/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#AEBBFF]">Live business memory</p>
          <p className="mt-2 text-sm text-white/75">Your information, finally in context.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8DE6C2] shadow-[0_0_0_4px_rgba(141,230,194,.12)]" />
          <span className="text-[10px] text-white/70">Syncing now</span>
        </div>
      </div>
      <div className="relative mt-8 grid grid-cols-[1fr_1.05fr_1fr] items-center gap-3 sm:gap-5">
        <div className="space-y-3">
          {sources.slice(0, 3).map((source, index) => {
            const Icon = source.icon
            return (
              <motion.div
                key={source.label}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.12 }}
                className="source-chip flex items-center gap-2.5 rounded-[14px] border border-white/10 bg-white/[.07] p-2.5 sm:p-3"
              >
                <span className={`grid h-7 w-7 place-items-center rounded-lg ${source.tone}`}>
                  <Icon size={14} />
                </span>
                <span className="text-[11px] font-semibold text-white/80">{source.label}</span>
              </motion.div>
            )
          })}
        </div>
        <div className="relative flex h-[190px] items-center justify-center">
          <div className="absolute left-[-12%] top-[26%] h-px w-[125%] origin-left rotate-[20deg] bg-gradient-to-r from-[#7C92FF]/0 via-[#7C92FF]/70 to-[#8DE6C2]/80 pulse-line" />
          <div className="absolute left-[-12%] top-[69%] h-px w-[125%] origin-left rotate-[-18deg] bg-gradient-to-r from-[#7C92FF]/0 via-[#7C92FF]/70 to-[#8DE6C2]/80 pulse-line" />
          <div className="absolute left-[-2%] top-1/2 h-px w-[105%] bg-gradient-to-r from-[#7C92FF]/0 via-[#7C92FF]/60 to-[#8DE6C2]/80 pulse-line" />
          <div className="absolute h-[138px] w-[138px] rounded-[36px] border border-[#8CA1FF]/40 bg-gradient-to-br from-[#607CFF] to-[#443DAB] shadow-[0_24px_50px_rgba(75,86,255,.35)] float-slow" />
          <div className="relative grid h-[102px] w-[102px] place-items-center rounded-[29px] border border-white/25 bg-[#182963]/75 backdrop-blur-xl">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-[#AEBBFF]/10 blur-lg" />
              <BrainCircuit size={40} strokeWidth={1.2} className="relative text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 rounded-full border border-white/15 bg-[#152452] px-3 py-1.5 text-[10px] font-bold text-[#DCE1FF] shadow-lg">
            ActionDesk
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Clear context', icon: Network },
            { label: 'Next best action', icon: ArrowDownRight },
            { label: 'No loose ends', icon: Check },
          ].map(({ label, icon: Icon }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + index * 0.12 }}
              className="flex items-center gap-2.5 rounded-[14px] border border-[#8DE6C2]/20 bg-[#8DE6C2]/[.06] p-2.5 sm:p-3"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#8DE6C2]/10 text-[#8DE6C2]">
                <Icon size={14} />
              </span>
              <span className="text-[11px] font-semibold text-white/80">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="relative mt-9 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Signals</p>
          <p className="mt-1 text-lg font-semibold text-white">2,481</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Connected</p>
          <p className="mt-1 text-lg font-semibold text-white">18.4k</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/40">In motion</p>
          <p className="mt-1 text-lg font-semibold text-[#8DE6C2]">24</p>
        </div>
      </div>
    </div>
  )
}

function MemoryOrbit() {
  const nodes = [
    { label: 'Customers', icon: Users, pos: 'left-[1%] top-[13%]', tone: 'bg-[#E9EDFF] text-[#5C7CFF]' },
    { label: 'Conversations', icon: MessageSquare, pos: 'right-[2%] top-[12%]', tone: 'bg-[#F0E9FF] text-[#7555D5]' },
    { label: 'Transactions', icon: CircleDollarSign, pos: 'left-[0%] bottom-[15%]', tone: 'bg-[#E5F7F0] text-[#16815F]' },
    { label: 'Follow-ups', icon: Clock3, pos: 'right-[1%] bottom-[12%]', tone: 'bg-[#FFF2D7] text-[#A26800]' },
  ]
  return (
    <div className="relative mx-auto h-[390px] max-w-[610px] sm:h-[440px]">
      <div className="absolute left-1/2 top-1/2 h-[265px] w-[265px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C8D1F2] bg-[#EEF1FF]/70 sm:h-[320px] sm:w-[320px]" />
      <div className="absolute left-1/2 top-1/2 h-[185px] w-[185px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#B5C2EE] sm:h-[230px] sm:w-[230px]" />
      <div className="absolute left-1/2 top-1/2 grid h-[122px] w-[122px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[34px] bg-[#0C1735] text-white shadow-[0_18px_45px_rgba(12,23,53,.22)]">
        <div className="text-center">
          <BrainCircuit size={28} className="mx-auto text-[#AEBBFF]" strokeWidth={1.25} />
          <p className="mt-2 text-[10px] font-bold tracking-[.08em]">
            BUSINESS<br />MEMORY
          </p>
        </div>
      </div>
      {nodes.map(({ label, icon: Icon, pos, tone }, index) => (
        <div
          key={label}
          className={`absolute ${pos} z-10 flex items-center gap-2 rounded-2xl border border-white bg-white px-3 py-2.5 shadow-[0_12px_26px_rgba(12,23,53,.1)] sm:px-4 sm:py-3`}
        >
          <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
            <Icon size={14} />
          </span>
          <span className="text-[11px] font-bold text-[#0C1735] sm:text-xs">{label}</span>
          <span
            className="absolute left-1/2 top-1/2 -z-10 h-px w-[130px] origin-left bg-gradient-to-r from-[#A7B3DE] to-transparent"
            style={{ transform: `rotate(${index === 0 ? 34 : index === 1 ? 146 : index === 2 ? -34 : -146}deg)` }}
          />
        </div>
      ))}
      <div className="absolute bottom-[4%] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#C9D0E9] bg-white/80 px-3 py-2 text-[10px] font-semibold text-[#65708B] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5C7CFF]" /> remembering 7,204 business signals
      </div>
    </div>
  )
}

const briefActions = [
  { title: 'Invoice INV-1042 is 28 days overdue', entity: 'Northstar Studio', why: 'A $2,400 invoice is unpaid and the reminder thread has no reply.', next: 'Draft a payment follow-up with a clear response date.', money: '$2,400', tone: 'amber', icon: WalletCards, evidence: 'Invoice · reminder email' },
  { title: 'Cedar & Co. is waiting on a complaint', entity: 'Cedar & Co.', why: 'Their damaged-shipment complaint is negative and still has no response.', next: 'Acknowledge the issue and give a concrete resolution timeline.', money: 'At risk', tone: 'rose', icon: MessageSquare, evidence: 'Complaint email · 3 days ago' },
  { title: 'Acme Studio has gone quiet', entity: 'Acme Studio', why: 'Their last order was 52 days ago versus a normal 20-day ordering gap.', next: 'Send a friendly check-in and offer to plan replenishment.', money: '$900', tone: 'blue', icon: Users, evidence: '5 orders · customer timeline' },
  { title: 'A promised quote is past its deadline', entity: 'Brightline Retail', why: 'An outbound email promised a revised quote by Friday with no fulfillment email after it.', next: 'Send the revised quote or confirm exactly when it will arrive.', money: '$1,200', tone: 'purple', icon: Clock3, evidence: 'Quote thread · Sept 14' },
  { title: 'River & Co. raised kraft box pricing', entity: 'River & Co.', why: 'The latest unit price is $1.48, up 21% from the trailing average.', next: 'Ask for a hold or compare an alternate supplier.', money: '$26/mo', tone: 'green', icon: Store, evidence: '3 price records · supplier email' },
]

function MorningBrief() {
  const [selected, setSelected] = useState(0)
  const [done, setDone] = useState<number[]>([])
  const [gmailConnected, setGmailConnected] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const visibleActions = briefActions.filter((_, index) => !done.includes(index))
  const action = briefActions[selected] || briefActions[0]
  const toneStyles = {
    amber: 'bg-[#FFF1D6] text-[#A26800]',
    rose: 'bg-[#FBE5EA] text-[#C35A73]',
    blue: 'bg-[#E9EDFF] text-[#5C7CFF]',
    purple: 'bg-[#F0E9FF] text-[#7555D5]',
    green: 'bg-[#E4F7EE] text-[#16815F]',
  }

  return (
    <div id="brief" className="overflow-hidden rounded-[22px] border border-[#CBD3E7] bg-white shadow-[0_30px_80px_rgba(20,37,82,.14)]">
      {/* Top Banner inside Brief Section linking to Real Workspace */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E7EAF2] bg-[#FBFCFF] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F4A1AC]" />
            <span className="h-2 w-2 rounded-full bg-[#F4CC7F]" />
            <span className="h-2 w-2 rounded-full bg-[#8FD7B4]" />
          </div>
          <div className="h-6 w-px bg-[#E7EAF2]" />
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0C1735]">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-[#E9EDFF] text-[#5C7CFF]">
              <BrainCircuit size={12} />
            </span>
            Morning Brief Preview
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 rounded-lg bg-[#5C7CFF] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-[#6E8EFF] transition"
          >
            <span>Open Live Operational Workspace</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="flex min-h-[440px]">
        <aside className="dash-sidebar shrink-0 border-r border-[#E7EAF2] bg-[#FBFCFF] p-4">
          <div className="mb-7 rounded-lg bg-[#E9EDFF] px-2.5 py-2 text-[10px] font-bold text-[#5C7CFF]">Morning Brief</div>
          <div className="space-y-2.5 text-[10px] font-semibold text-[#7A849C]">
            <div className="flex items-center gap-2.5">
              <Network size={13} /> Business memory
            </div>
            <div className="flex items-center gap-2.5">
              <Check size={13} /> My actions
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={13} /> Customers
            </div>
            <div className="flex items-center gap-2.5">
              <Database size={13} /> Sources
            </div>
          </div>
          <div className="mt-10 border-t border-[#E7EAF2] pt-4 text-[9px] font-bold uppercase tracking-widest text-[#A1A9BC]">Connected</div>
          <button
            onClick={() => setShowConnect(true)}
            className="mt-3 flex w-full items-center gap-2 text-left text-[10px] text-[#7A849C] transition hover:text-[#5C7CFF]"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${gmailConnected ? 'bg-[#8DE6C2]' : 'bg-[#F4CC7F]'}`} />
            {gmailConnected ? 'Gmail · synced' : 'Connect Gmail'}
          </button>
          <div className="mt-2 space-y-2 text-[10px] text-[#7A849C]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8DE6C2]" /> Sheets
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C4B5FD]" /> Drive
            </div>
          </div>
        </aside>

        <div className="dash-content flex-1 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8C96AC]">Wednesday, October 02</p>
              <h3 className="mt-1 text-xl font-bold tracking-[-.04em] text-[#0C1735] sm:text-2xl">Good morning, Alex.</h3>
              <p className="mt-1 text-[11px] text-[#7A849C]">Here’s what deserves your attention today.</p>
            </div>
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 rounded-lg bg-[#0C1735] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#17275B]"
            >
              <span>Go to Full Workspace</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#0C1735] p-3 text-white">
              <p className="text-[9px] uppercase tracking-widest text-[#AEBBFF]">Money at risk</p>
              <p className="mt-1 text-lg font-bold">$4,500</p>
            </div>
            <div className="rounded-xl border border-[#E7EAF2] p-3">
              <p className="text-[9px] uppercase tracking-widest text-[#8C96AC]">Needs attention</p>
              <p className="mt-1 text-lg font-bold text-[#0C1735]">{visibleActions.length}</p>
            </div>
            <div className="rounded-xl border border-[#E7EAF2] p-3">
              <p className="text-[9px] uppercase tracking-widest text-[#8C96AC]">Signals</p>
              <p className="mt-1 text-lg font-bold text-[#0C1735]">
                92 <span className="text-[9px] text-[#16815F]">+18%</span>
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-xl border border-[#E7EAF2] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0C1735]">Priority actions</span>
                <span className="text-[10px] font-semibold text-[#5C7CFF]">{visibleActions.length} surfaced</span>
              </div>
              <div className="mt-3 space-y-2">
                {briefActions.map(({ title, entity, money, tone, icon: Icon }, index) =>
                  done.includes(index) ? null : (
                    <button
                      key={title}
                      onClick={() => setSelected(index)}
                      className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition ${
                        selected === index ? 'bg-[#F0F3FF] ring-1 ring-[#C9D3FF]' : 'bg-[#FAFBFE] hover:bg-[#F4F6FC]'
                      }`}
                    >
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${toneStyles[tone as keyof typeof toneStyles]}`}>
                        <Icon size={12} />
                      </span>
                      <span className="block min-w-0">
                        <span className="block truncate text-[10px] font-bold text-[#0C1735]">{title}</span>
                        <span className="mt-0.5 block truncate text-[9px] text-[#8A93A8]">
                          {entity} · {money}
                        </span>
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#E7EAF2] bg-[#FBFCFF] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C96AC]">Selected signal</span>
                <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${toneStyles[action.tone as keyof typeof toneStyles]}`}>
                  {action.money}
                </span>
              </div>
              <h4 className="mt-4 text-sm font-bold leading-snug text-[#0C1735]">{action.title}</h4>
              <p className="mt-2 text-[10px] leading-relaxed text-[#7A849C]">
                <b>Why:</b> {action.why}
              </p>
              <p className="mt-3 text-[10px] leading-relaxed text-[#7A849C]">
                <b>Next:</b> {action.next}
              </p>
              <div className="mt-4 rounded-lg bg-white p-2.5 text-[9px] text-[#7A849C] shadow-[0_4px_14px_rgba(12,23,53,.05)]">
                <span className="font-bold text-[#5C7CFF]">Evidence attached</span> · {action.evidence}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/workspace"
                  className="flex-1 rounded-lg bg-[#5C7CFF] px-2 py-2 text-center text-[10px] font-bold text-white transition hover:bg-[#6D8AFF]"
                >
                  Work on this in Workspace →
                </Link>
                <button
                  onClick={() => setDone([...done, selected])}
                  className="rounded-lg border border-[#DCE2F0] px-2.5 py-2 text-[10px] font-bold text-[#65708B] transition hover:border-[#8DE6C2] hover:text-[#16815F]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConnect && (
        <div
          className="fixed inset-0 z-[130] grid place-items-center bg-[#07112B]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowConnect(false)
          }}
        >
          <div className="w-full max-w-sm rounded-[22px] border border-white/70 bg-[#FBFCFF] p-6 shadow-[0_30px_100px_rgba(4,13,42,.35)]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FBE5EA] text-[#C35A73]">
                <Mail size={18} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C7CFF]">Source connection</p>
                <h3 className="text-lg font-bold text-[#0C1735]">Connect Gmail</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#65708B]">
              Bring recent email context into the Morning Brief with read-only access. ActionDesk never sends, edits, or deletes mail.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#E5F7F0] p-3 text-[10px] font-bold text-[#16815F]">
              <Check size={14} /> Read-only sync · evidence stays attached
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowConnect(false)} className="rounded-lg px-3 py-2 text-[11px] font-bold text-[#65708B]">
                Not now
              </button>
              <button
                onClick={() => {
                  setGmailConnected(true)
                  setShowConnect(false)
                }}
                className="rounded-lg bg-[#0C1735] px-4 py-2.5 text-[11px] font-bold text-white"
              >
                Connect read-only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KnowledgeGraph() {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[26px] border border-[#D8DEEF] bg-white/70 p-5 shadow-soft sm:p-8">
      <div className="absolute inset-0 grid-lines opacity-60" />
      <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-[#C4B5FD]/20 blur-3xl" />
      <div className="relative h-[340px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 340" fill="none" aria-hidden="true">
          <path d="M102 76L242 154M102 76L223 268M515 72L380 153M515 72L401 268M103 275L242 188M512 272L380 188" stroke="#B8C2E0" strokeDasharray="4 7" />
          <path d="M242 154L380 153M242 188L380 188" stroke="#7186ED" strokeDasharray="4 7" />
        </svg>
        <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30px] bg-[#0C1735] text-center text-white shadow-[0_20px_50px_rgba(12,23,53,.23)]">
          <Sparkles size={24} className="mx-auto text-[#8DE6C2]" />
          <p className="mt-2 text-[10px] font-bold tracking-[.1em]">
            FULL<br />CONTEXT
          </p>
        </div>
        {[
          { x: '8%', y: '12%', name: 'Emails', icon: Mail, tone: 'bg-[#E9EDFF] text-[#5C7CFF]' },
          { x: '78%', y: '11%', name: 'Sales records', icon: CircleDollarSign, tone: 'bg-[#E5F7F0] text-[#16815F]' },
          { x: '9%', y: '70%', name: 'Documents', icon: FileText, tone: 'bg-[#FFF2D7] text-[#A26800]' },
          { x: '77%', y: '70%', name: 'Messages', icon: MessageSquare, tone: 'bg-[#F0E9FF] text-[#7555D5]' },
        ].map(({ x, y, name, icon: Icon, tone }, index) => (
          <motion.div
            key={name}
            className="absolute flex items-center gap-2 rounded-xl border border-white bg-white px-2.5 py-2 shadow-[0_10px_24px_rgba(12,23,53,.1)] sm:px-3"
            style={{ left: x, top: y }}
            animate={{ y: [0, index % 2 ? -5 : 5, 0] }}
            transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
              <Icon size={13} />
            </span>
            <span className="whitespace-nowrap text-[10px] font-bold text-[#0C1735] sm:text-[11px]">{name}</span>
          </motion.div>
        ))}
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#EEF1FF] px-3 py-2 text-[10px] font-bold text-[#5C7CFF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5C7CFF]" /> one connected business story
        </div>
      </div>
    </div>
  )
}

function AiDemo() {
  const [selected, setSelected] = useState<DemoKey>('Customer follow-up')
  const scenario = useMemo(() => demoScenarios[selected], [selected])
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#D7DDF0] bg-white shadow-soft">
      <div className="border-b border-[#E8EBF3] bg-[#FBFCFF] px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#5C7CFF]">Try the thinking layer</p>
            <h3 className="mt-1 text-base font-bold tracking-[-.03em] text-[#0C1735]">Give ActionDesk a signal.</h3>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-semibold text-[#7C87A1] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8DE6C2]" /> sample workspace
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(demoScenarios) as DemoKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold transition ${
                selected === key ? 'border-[#5C7CFF] bg-[#5C7CFF] text-white' : 'border-[#E1E5F0] bg-white text-[#65708B] hover:border-[#9DACED]'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
        <div className="border-b border-[#E8EBF3] p-5 md:border-b-0 md:border-r sm:p-7">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9AA3B8]">
            <MessageSquare size={13} /> incoming context
          </div>
          <p className="mt-5 text-xl font-semibold leading-snug tracking-[-.04em] text-[#0C1735]">“{scenario.context}”</p>
          <div className="mt-8 rounded-xl bg-[#F7F8FC] p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#67728E]">
              <Layers3 size={13} className="text-[#5C7CFF]" /> ActionDesk connected
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#7A849C]">{scenario.reason}</p>
          </div>
        </div>
        <div className="bg-[#0C1735] p-5 text-white sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#AEBBFF]">
              <Sparkles size={13} /> recommended next
            </div>
            <span className="rounded-full bg-[#8DE6C2]/10 px-2 py-1 text-[10px] font-bold text-[#8DE6C2]">{scenario.confidence} match</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <p className="mt-6 text-2xl font-semibold leading-tight tracking-[-.045em]">{scenario.action}</p>
              <div className="mt-8 flex gap-2">
                <Link
                  href="/workspace"
                  className="flex items-center gap-2 rounded-xl bg-[#5C7CFF] px-4 py-3 text-[11px] font-bold text-white transition hover:bg-[#6D8AFF]"
                >
                  <Send size={13} /> Draft this in Workspace
                </Link>
                <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/10" aria-label="More demo options">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-12 flex items-center gap-3 border-t border-white/10 pt-4 text-[10px] text-white/45">
            <Zap size={13} className="text-[#8DE6C2]" /> Not a chatbot. A memory that moves.
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailCaptureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setSubmitted(false)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const existingEmails = JSON.parse(window.localStorage.getItem('actiondesk_interest_emails') || '[]') as string[]
      if (!existingEmails.includes(email.trim().toLowerCase())) {
        window.localStorage.setItem('actiondesk_interest_emails', JSON.stringify([...existingEmails, email.trim().toLowerCase()]))
      }
    } catch {
      // Keep working
    }
    setSubmitted(true)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[140] grid place-items-center bg-[#07112B]/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-modal-title"
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-[#FBFCFF] p-6 shadow-[0_30px_100px_rgba(4,13,42,.35)] sm:p-8"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#5C7CFF]/15 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#7A849C] transition hover:bg-[#E9EDFF] hover:text-[#0C1735]"
              aria-label="Close email signup modal"
            >
              <X size={16} />
            </button>
            {submitted ? (
              <div className="relative py-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E4F7EE] text-[#16815F]">
                  <Check size={26} />
                </span>
                <p className="eyebrow mt-6">You’re on the list</p>
                <h2 id="email-modal-title" className="display mt-3 text-4xl font-semibold text-[#0C1735]">
                  Your next step is closer.
                </h2>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-[#65708B]">
                  We’ll send an early look at ActionDesk to <strong className="text-[#0C1735]">{email}</strong>.
                </p>
                <div className="mt-7 flex justify-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-[#5C7CFF] px-5 py-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#6D8AFF]"
                  >
                    Enter Live Demo Workspace →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E9EDFF] text-[#5C7CFF]">
                  <Mail size={20} />
                </span>
                <p className="eyebrow mt-6">Start with a clearer day</p>
                <h2 id="email-modal-title" className="display mt-3 max-w-sm text-4xl font-semibold text-[#0C1735]">
                  Let’s build your business memory.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#65708B]">
                  Leave your email and we’ll share the first steps for turning scattered signals into calm, useful action.
                </p>
                <form onSubmit={handleSubmit} className="mt-7">
                  <label htmlFor="actiondesk-email" className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A849C]">
                    Work email
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="actiondesk-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      className="min-w-0 flex-1 rounded-xl border border-[#D7DDF0] bg-white px-4 py-3 text-sm text-[#0C1735] outline-none transition placeholder:text-[#A8B1C4] focus:border-[#5C7CFF] focus:ring-4 focus:ring-[#5C7CFF]/10"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C7CFF] px-4 py-3 text-[11px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#6D8AFF]"
                    >
                      Get started <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EDF1F8] flex items-center justify-between text-[11px]">
                    <span className="text-[#9AA3B8]">Want to test right now?</span>
                    <Link href="/login" className="font-bold text-[#5C7CFF] hover:underline">
                      Go to Live Workspace →
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const [introVisible, setIntroVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 850)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {introVisible && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-[#0C1735]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Loading ActionDesk"
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                className="absolute -inset-10 rounded-full bg-[#5C7CFF]/20 blur-3xl"
                initial={{ scale: 0.65, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              <motion.div
                className="relative grid h-16 w-16 place-items-center rounded-[20px] border border-[#8CA1FF]/45 bg-gradient-to-br from-[#607CFF] to-[#443DAB] shadow-[0_20px_55px_rgba(75,86,255,.35)]"
                initial={{ scale: 0.72, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="absolute h-7 w-7 rotate-45 rounded-[8px] border-2 border-white/75" />
                <span className="relative h-2 w-2 rounded-full bg-[#8DE6C2] shadow-[0_0_0_6px_rgba(141,230,194,.15)]" />
              </motion.div>
              <motion.div
                className="relative mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/60"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
              >
                <span>Syncing your business memory</span>
                <span className="flex gap-1">
                  <i className="h-1 w-1 rounded-full bg-[#8DE6C2]" />
                  <i className="h-1 w-1 rounded-full bg-[#8DE6C2]" />
                  <i className="h-1 w-1 rounded-full bg-[#8DE6C2]" />
                </span>
              </motion.div>
              <motion.div
                className="relative mt-4 h-px w-40 overflow-hidden bg-white/10"
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.22, duration: 0.45 }}
              >
                <motion.span
                  className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-[#8DE6C2] to-transparent"
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ScrollProgress />
      <SectionRail />
      <motion.div initial={{ y: 14 }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </>
  )
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  return (
    <PageTransition>
      <main id="top" className="overflow-hidden">
        {/* Navigation Header */}
        <header className="absolute inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#0C1735]/55 px-3 py-2.5 shadow-[0_18px_50px_rgba(3,10,31,.18)] backdrop-blur-xl sm:px-4">
            <Logo dark className="shrink-0 rounded-xl p-1 transition hover:bg-white/[.08]" />
            <nav className="hidden items-center gap-1 rounded-xl border border-white/[.08] bg-white/[.035] p-1 md:flex" aria-label="Primary navigation">
              <a className="rounded-lg px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[.08] hover:text-white" href="#memory">
                Memory
              </a>
              <a className="rounded-lg px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[.08] hover:text-white" href="#engine">
                Action engine
              </a>
              <a className="rounded-lg px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[.08] hover:text-white" href="#brief">
                Morning brief
              </a>
              <a className="rounded-lg px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[.08] hover:text-white" href="#use-cases">
                Use cases
              </a>
              <a className="rounded-lg px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[.08] hover:text-white" href="#how-it-works">
                How it works
              </a>
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white/70 transition hover:bg-white/[.08] hover:text-white"
              >
                <LogIn size={13} />
                <span>Sign in</span>
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#0C1735] shadow-[0_8px_20px_rgba(255,255,255,.1)] transition hover:-translate-y-0.5 hover:bg-[#EAF0FF]"
              >
                <span>Live Workspace</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <button
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.05] text-white transition hover:bg-white/10 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
          {mobileOpen && (
            <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-[#12204A]/95 p-3 text-sm text-white shadow-xl backdrop-blur-xl md:hidden">
              <div className="grid gap-1">
                <a className="rounded-xl px-3 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" href="#memory" onClick={() => setMobileOpen(false)}>
                  Memory
                </a>
                <a className="rounded-xl px-3 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" href="#engine" onClick={() => setMobileOpen(false)}>
                  Action engine
                </a>
                <a className="rounded-xl px-3 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" href="#use-cases" onClick={() => setMobileOpen(false)}>
                  Use cases
                </a>
                <a className="rounded-xl px-3 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" href="#how-it-works" onClick={() => setMobileOpen(false)}>
                  How it works
                </a>
                <div className="my-1 border-t border-white/10" />
                <Link
                  href="/login"
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-left text-[12px] font-bold text-[#0C1735]"
                >
                  <span>Sign in to Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="hero-glow noise relative bg-[#0C1735] text-white">
          <AmbientParallax className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 top-28 h-[440px] w-[440px] rounded-full bg-[#5C7CFF]/10 blur-3xl" />
            <div className="absolute right-[8%] top-20 h-32 w-32 rounded-full border border-[#8DE6C2]/15" />
            <div className="absolute right-[12%] top-28 h-20 w-20 rounded-full border border-[#8DE6C2]/10" />
          </AmbientParallax>
          <div className="absolute inset-0 dark-grid opacity-30" />
          <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 pb-20 pt-36 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:gap-10 lg:px-10 lg:pb-28 lg:pt-40">
            <Reveal>
              <div className="max-w-xl">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#AEBBFF]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8DE6C2] shadow-[0_0_0_5px_rgba(141,230,194,.12)]" /> the memory layer for modern business
                </div>
                <h1 className="display max-w-[680px] text-[clamp(3.4rem,7.2vw,6.5rem)] font-semibold">
                  Your business remembers.<br />
                  <span className="serif text-[#AEBBFF]">Now it can act.</span>
                </h1>
                <p className="mt-7 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
                  ActionDesk captures every signal across your business, connects the dots, and tells you what matters next — before it becomes a loose end.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-[#5C7CFF] px-5 py-3.5 text-[12px] font-bold text-white shadow-[0_12px_28px_rgba(92,124,255,.3)] transition hover:-translate-y-0.5 hover:bg-[#6C8AFF]"
                  >
                    Enter Live Workspace <ArrowRight size={15} className="ml-1 inline" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-[12px] font-bold text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10">
                      <Play size={10} fill="currentColor" />
                    </span>{' '}
                    See how it works
                  </a>
                </div>
                <div className="mt-12 flex items-center gap-5 text-[10px] font-semibold text-white/40">
                  <span className="flex items-center gap-2">
                    <Check size={13} className="text-[#8DE6C2]" /> built for small teams
                  </span>
                  <span className="flex items-center gap-2">
                    <Check size={13} className="text-[#8DE6C2]" /> no busywork
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.12} className="lg:pt-8">
              <HeroFlow />
            </Reveal>
          </div>
        </section>

        {/* Sources Ribbon */}
        <section className="border-b border-[#E1E5EF] bg-[#F6F7FB] py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 sm:px-8 lg:px-10">
            <p className="max-w-[190px] text-[10px] font-bold uppercase leading-relaxed tracking-[.15em] text-[#9AA3B8]">
              One calm layer across the tools you already use
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5 text-[#9BA5BB] sm:gap-x-12">
              <span className="flex items-center gap-2 text-sm font-bold tracking-[-.04em]">
                <Mail size={16} /> gmail
              </span>
              <span className="flex items-center gap-2 text-sm font-bold tracking-[-.04em]">
                <Database size={16} /> sheets
              </span>
              <span className="flex items-center gap-2 text-sm font-bold tracking-[-.04em]">
                <FileText size={16} /> drive
              </span>
              <span className="flex items-center gap-2 text-sm font-bold tracking-[-.04em]">
                <MessageSquare size={16} /> slack
              </span>
              <span className="flex items-center gap-2 text-sm font-bold tracking-[-.04em]">
                <Store size={16} /> shopify
              </span>
            </div>
          </div>
        </section>

        {/* Section 01: Business Memory */}
        <section id="memory" className="bg-[#F6F7FB] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
              <Reveal>
                <p className="eyebrow">01 / business memory</p>
                <h2 className="display mt-5 max-w-md text-5xl font-semibold sm:text-6xl">Stop keeping the business in your head.</h2>
                <p className="mt-7 max-w-md text-[15px] leading-relaxed text-[#65708B]">
                  ActionDesk continuously remembers the small details that shape your day — who said what, what was promised, what changed, and what needs to happen next.
                </p>
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#0C1735]">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E9EDFF] text-[#5C7CFF]">
                      <Check size={14} />
                    </span>{' '}
                    A living timeline of your business
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#0C1735]">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E5F7F0] text-[#16815F]">
                      <Check size={14} />
                    </span>{' '}
                    Context that compounds over time
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#0C1735]">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFF2D7] text-[#A26800]">
                      <Check size={14} />
                    </span>{' '}
                    Fewer tabs. Fewer loose ends.
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.12}>
                <MemoryOrbit />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 02: Action Engine */}
        <section id="engine" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-end justify-between gap-10 lg:grid-cols-[.9fr_1.1fr]">
              <Reveal>
                <p className="eyebrow">02 / AI action engine</p>
                <h2 className="display mt-5 max-w-xl text-5xl font-semibold sm:text-6xl">
                  From “something happened” to “here’s what to do.”
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="max-w-md text-[15px] leading-relaxed text-[#65708B]">
                  ActionDesk watches for urgency, missed promises, and momentum. It turns raw business information into a short list of actions you can trust.
                </p>
              </Reveal>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {actionCards.map(({ title, meta, badge, icon: Icon, color, bg }, index) => (
                <Reveal key={title} delay={index * 0.06}>
                  <div className="group relative isolate flex h-full items-start gap-4 overflow-hidden rounded-[20px] border border-[#E1E5EF] bg-[#FBFCFF] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#BFCBFA] hover:shadow-panel sm:p-6">
                    <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-28 w-28 rounded-full bg-[#5C7CFF]/0 blur-2xl transition-all duration-500 group-hover:bg-[#5C7CFF]/10" />
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${bg} ${color} transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(92,124,255,.18)]`}
                    >
                      <Icon size={20} strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0C1735]">{title}</h3>
                        <span className="transition duration-300 group-hover:scale-[1.03]">
                          <Badge tone={index === 0 ? 'blue' : index === 1 ? 'amber' : index === 2 ? 'green' : 'purple'}>{badge}</Badge>
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-[#7A849C]">{meta}</p>
                      <Link
                        href="/workspace"
                        className="mt-5 flex translate-x-[-4px] items-center gap-1 text-[11px] font-bold text-[#5C7CFF] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        Inspect live action in Workspace <ChevronRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Section 03: Smart Context */}
        <section id="context" className="bg-[#F6F7FB] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
              <Reveal>
                <KnowledgeGraph />
              </Reveal>
              <Reveal delay={0.12}>
                <p className="eyebrow">03 / smart context</p>
                <h2 className="display mt-5 max-w-lg text-5xl font-semibold sm:text-6xl">The detail is useful. The connection is the insight.</h2>
                <p className="mt-7 max-w-md text-[15px] leading-relaxed text-[#65708B]">
                  A customer message means something different when ActionDesk can see the open invoice, the delivery note, and the promise you made last Tuesday.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {['Emails', 'Messages', 'Spreadsheets', 'Documents', 'Sales records'].map((item, index) => (
                    <span key={item} className="rounded-full border border-[#D9DFEE] bg-white px-3 py-2 text-[10px] font-bold text-[#65708B]">
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                          ['bg-[#5C7CFF]', 'bg-[#7555D5]', 'bg-[#16815F]', 'bg-[#A26800]', 'bg-[#C35A73]'][index]
                        }`}
                      />
                      {item}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 04: Morning Brief */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-8">
                <div>
                  <p className="eyebrow">04 / morning brief</p>
                  <h2 className="display mt-5 max-w-2xl text-5xl font-semibold sm:text-6xl">
                    A dashboard that feels less like reporting and more like relief.
                  </h2>
                </div>
                <p className="max-w-sm text-[15px] leading-relaxed text-[#65708B]">
                  No endless charts. Just the right amount of context to make a good decision before lunch.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="mt-14">
              <MorningBrief />
            </Reveal>
          </div>
        </section>

        {/* Section 05: A Little Preview */}
        <section id="demo" className="bg-[#F6F7FB] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-[.68fr_1.32fr] lg:gap-20">
              <Reveal>
                <p className="eyebrow">05 / a little preview</p>
                <h2 className="display mt-5 max-w-md text-5xl font-semibold sm:text-6xl">Watch a signal become a next step.</h2>
                <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-[#65708B]">
                  Choose a real-world moment. See how ActionDesk brings context together and makes the next move obvious.
                </p>
                <div className="mt-8 flex items-center gap-2 text-[11px] font-bold text-[#5C7CFF]">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E9EDFF]">
                    <Sparkles size={13} />
                  </span>{' '}
                  Guided product simulation
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <AiDemo />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 06: Use Cases */}
        <section id="use-cases" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <Reveal>
              <div className="max-w-2xl">
                <p className="eyebrow">06 / built for the in-between</p>
                <h2 className="display mt-5 text-5xl font-semibold sm:text-6xl">The work that falls between the tools.</h2>
                <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-[#65708B]">
                  ActionDesk picks up where your inbox, CRM, and task list leave off — in the connective tissue of running a business.
                </p>
              </div>
            </Reveal>
            <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map(({ icon: Icon, title, copy, accent }, index) => {
                const colors: Record<string, string> = {
                  blue: 'bg-[#E9EDFF] text-[#5C7CFF]',
                  amber: 'bg-[#FFF1D6] text-[#A26800]',
                  green: 'bg-[#E4F7EE] text-[#16815F]',
                  purple: 'bg-[#F0E9FF] text-[#7555D5]',
                  rose: 'bg-[#FBE5EA] text-[#C35A73]',
                }
                return (
                  <Reveal key={title} delay={index * 0.04} className={index === 0 ? 'lg:col-span-2' : ''}>
                    <div
                      className={`group relative isolate h-full overflow-hidden rounded-[20px] border border-[#E1E5EF] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#BFCBFA] hover:shadow-panel sm:p-6 ${
                        index === 0 ? 'bg-[#F5F7FF]' : 'bg-[#FBFCFF]'
                      }`}
                    >
                      <div className="pointer-events-none absolute -bottom-10 -right-8 -z-10 h-28 w-28 rounded-full bg-[#5C7CFF]/0 blur-2xl transition-all duration-500 group-hover:bg-[#5C7CFF]/10" />
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-xl ${colors[accent]} transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(92,124,255,.16)]`}
                      >
                        <Icon size={18} />
                      </span>
                      <h3 className="mt-7 text-sm font-bold text-[#0C1735]">{title}</h3>
                      <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-[#7A849C]">{copy}</p>
                      <ArrowUpRight
                        className="mt-7 text-[#AFB7C9] transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:scale-110 group-hover:text-[#5C7CFF]"
                        size={16}
                      />
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* Section 07: How it Works */}
        <section id="how-it-works" className="bg-[#0C1735] py-24 text-white sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[.55fr_1.45fr] lg:gap-20">
              <Reveal>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#AEBBFF]">07 / how it works</p>
                <h2 className="display mt-5 max-w-sm text-5xl font-semibold sm:text-6xl">A better rhythm for the business.</h2>
              </Reveal>
              <div className="grid gap-0 sm:grid-cols-5">
                {['Capture', 'Understand', 'Connect', 'Prioritize', 'Act'].map((step, index) => (
                  <Reveal key={step} delay={index * 0.08}>
                    <div className="relative border-l border-white/15 pb-8 pl-5 sm:border-l-0 sm:border-t sm:pb-0 sm:pl-0 sm:pt-6 sm:pr-5">
                      <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-[#5C7CFF] shadow-[0_0_0_5px_rgba(92,124,255,.15)] sm:left-0 sm:top-[-5px]" />
                      {index < 4 && (
                        <div className="absolute bottom-0 left-[-1px] h-8 w-px bg-gradient-to-b from-[#5C7CFF] to-transparent sm:bottom-auto sm:left-auto sm:right-4 sm:top-[-1px] sm:h-px sm:w-10 sm:bg-gradient-to-r sm:from-[#5C7CFF] sm:to-transparent" />
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7E8ECA]">0{index + 1}</p>
                      <h3 className="mt-3 text-lg font-semibold tracking-[-.03em]">{step}</h3>
                      <p className="mt-2 max-w-[150px] text-[11px] leading-relaxed text-white/45">
                        {
                          [
                            'Bring every signal into one place.',
                            'Let the details become readable.',
                            'See the thread between moments.',
                            'Know what deserves attention now.',
                            'Move with confidence, not more tabs.',
                          ][index]
                        }
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pre-footer Call to Action */}
        <section className="relative overflow-hidden bg-[#5C7CFF] py-24 text-white sm:py-32">
          <div className="absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full border border-white/15" />
          <div className="absolute -right-4 -top-16 h-[260px] w-[260px] rounded-full border border-white/10" />
          <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-white/65">The next right thing is closer than you think.</p>
              <h2 className="display mx-auto mt-6 max-w-4xl text-5xl font-semibold sm:text-7xl">
                Stop searching for what matters.<br />
                <span className="serif text-white/80">Let your business remember.</span>
              </h2>
              <p className="mx-auto mt-7 max-w-md text-[15px] leading-relaxed text-white/70">
                ActionDesk gives small teams the clarity to act on the work that actually moves the business forward.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[12px] font-bold text-[#0C1735] transition hover:-translate-y-0.5 hover:bg-[#F0F3FF]"
                >
                  Start with ActionDesk <ArrowRight size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0C1735] py-14 text-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div>
                <Logo dark />
                <p className="mt-5 max-w-xs text-[12px] leading-relaxed text-white/40">
                  The business memory and action layer for small teams who would rather move forward than search backward.
                </p>
                <div className="mt-6 flex gap-2">
                  <a href="#top" aria-label="LinkedIn" className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-[10px] font-bold text-white/55 transition hover:border-white/35 hover:text-white">
                    in
                  </a>
                  <a href="#top" aria-label="X" className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-[10px] font-bold text-white/55 transition hover:border-white/35 hover:text-white">
                    𝕏
                  </a>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Product</p>
                <div className="mt-5 grid gap-3 text-[12px] text-white/55">
                  <a href="#memory" className="transition hover:text-white">
                    Business memory
                  </a>
                  <a href="#engine" className="transition hover:text-white">
                    Action engine
                  </a>
                  <a href="#demo" className="transition hover:text-white">
                    Smart context
                  </a>
                  <a href="#how-it-works" className="transition hover:text-white">
                    How it works
                  </a>
                  <Link href="/workspace" className="font-bold text-[#8DE6C2] transition hover:underline">
                    Live Operational Workspace →
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Use cases</p>
                <div className="mt-5 grid gap-3 text-[12px] text-white/55">
                  <a href="#use-cases" className="transition hover:text-white">
                    Customer follow-ups
                  </a>
                  <a href="#use-cases" className="transition hover:text-white">
                    Sales opportunities
                  </a>
                  <a href="#use-cases" className="transition hover:text-white">
                    Supplier coordination
                  </a>
                  <a href="#use-cases" className="transition hover:text-white">
                    Team reminders
                  </a>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Say hello</p>
                <div className="mt-5 grid gap-3 text-[12px] text-white/55">
                  <a href="mailto:hello@actiondesk.ai" className="transition hover:text-white">
                    hello@actiondesk.ai
                  </a>
                  <a href="#top" className="transition hover:text-white">
                    Contact
                  </a>
                  <a href="#top" className="transition hover:text-white">
                    Privacy
                  </a>
                  <a href="#top" className="transition hover:text-white">
                    Terms
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-14 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-[10px] text-white/30">
              <span>© 2026 ActionDesk, Inc.</span>
              <span>Made for the moments between the tools.</span>
            </div>
          </div>
        </footer>
      </main>
      <EmailCaptureModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} />
    </PageTransition>
  )
}
