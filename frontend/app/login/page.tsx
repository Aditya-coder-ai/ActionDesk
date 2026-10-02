'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BrainCircuit, Check, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('alex@actiondesk.ai')
  const [password, setPassword] = useState('••••••••••••')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      router.push('/workspace')
    }, 600)
  }

  return (
    <div className="relative min-h-screen bg-[#0C1735] text-white flex flex-col justify-between selection:bg-[#5C7CFF]/30">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#5C7CFF]/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-[#8DE6C2]/10 blur-3xl" />
        <div className="absolute inset-0 dark-grid opacity-30" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between p-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck size={14} className="text-[#8DE6C2]" />
          <span>Grounded in SQLite Business Memory</span>
        </div>
      </header>

      {/* Login Card */}
      <main className="relative z-10 mx-auto w-full max-w-md px-6 py-8">
        <div className="rounded-[28px] border border-white/15 bg-[#12204A]/70 p-8 shadow-[0_30px_90px_rgba(2,10,34,.35)] backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#8CA1FF]/40 bg-gradient-to-br from-[#607CFF] to-[#443DAB] shadow-[0_12px_30px_rgba(75,86,255,.35)]">
              <span className="absolute h-6 w-6 rotate-45 rounded-[6px] border-[1.5px] border-white/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#8DE6C2]" />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Sign in to ActionDesk</h1>
            <p className="mt-2 text-xs text-white/60">
              Your business memory is synced and waiting for your morning review.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#AEBBFF] block mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@actiondesk.ai"
                  className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-3 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-[#5C7CFF] focus:bg-white/10 focus:ring-4 focus:ring-[#5C7CFF]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#AEBBFF]">
                  Password
                </label>
                <span className="text-[10px] text-white/40">Demo mode</span>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-3 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-[#5C7CFF] focus:bg-white/10 focus:ring-4 focus:ring-[#5C7CFF]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C7CFF] py-3.5 text-xs font-bold text-white shadow-[0_12px_28px_rgba(92,124,255,.35)] transition hover:-translate-y-0.5 hover:bg-[#6D8AFF] disabled:opacity-50"
            >
              <span>{isLoading ? 'Accessing Business Memory...' : 'Sign in to Executive Workspace'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Demo Login Pill */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8DE6C2]" />
                <span className="font-bold text-white/90">Executive Demo</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('alex@actiondesk.ai')
                  setIsLoading(true)
                  setTimeout(() => router.push('/workspace'), 500)
                }}
                className="text-[11px] font-bold text-[#8DE6C2] hover:underline"
              >
                1-Click Sign In →
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/50">
              Pre-configured with 6 live signals from <code className="text-[#AEBBFF]">business_memory.sqlite3</code>.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-[11px] text-white/40">
        <span>© 2026 ActionDesk, Inc. Grounded AI executive memory.</span>
      </footer>
    </div>
  )
}
