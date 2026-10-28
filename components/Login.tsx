'use client'

import React, { useEffect, useState } from 'react'
import { ShieldCheck, Users, ArrowRight } from 'lucide-react'
import { Field } from './ui'
import { validateEmail, validateName, LIMITS } from '@/lib/validation'
import { decodeJwtPayload, Role, Session } from '@/lib/huddle'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
// Optional comma-separated allowlist. When set, only these emails can enter as Admin Lead.
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export function Login({ onLogin, onError }: { onLogin: (s: Session) => void; onError: (msg: string) => void }) {
  const [role, setRole] = useState<Role>('subordinate')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({ name: false, email: false })
  const [submitted, setSubmitted] = useState(false)

  const nameRes = validateName(name)
  const emailRes = validateEmail(email)
  let emailError = !emailRes.ok ? emailRes.error : undefined
  if (emailRes.ok && role === 'admin' && ADMIN_EMAILS.length && !ADMIN_EMAILS.includes(emailRes.value)) {
    emailError = 'This email is not authorised as an Admin Lead'
  }
  const nameError = !nameRes.ok ? nameRes.error : undefined
  const show = (f: 'name' | 'email') => touched[f] || submitted

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!nameRes.ok || !emailRes.ok || emailError) return
    onLogin({ role, name: nameRes.value, email: emailRes.value })
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const init = () => {
      const g = (window as any).google
      const target = document.getElementById('google-signin-button')
      if (!g?.accounts?.id || !target) return
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential?: string }) => {
          const p = resp.credential ? decodeJwtPayload(resp.credential) : null
          const n = validateName(p?.name ?? '')
          const em = validateEmail(p?.email ?? '')
          if (!p || !n.ok || !em.ok || p.email_verified === false) {
            onError('Google sign-in returned an unusable profile. Try another account or sign in with email.')
            return
          }
          onLogin({ role: 'subordinate', name: n.value, email: em.value })
        },
      })
      g.accounts.id.renderButton(target, { theme: 'outline', size: 'large', width: 320, shape: 'pill' })
    }
    if ((window as any).google?.accounts?.id) return init()
    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi]')
    if (existing) {
      existing.addEventListener('load', init)
      return () => existing.removeEventListener('load', init)
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.gsi = '1'
    s.onload = init
    s.onerror = () => onError('Could not load Google Sign-In. Check your connection.')
    document.head.appendChild(s)
  }, [onLogin, onError])

  const roles: { id: Role; label: string; icon: React.ReactNode; blurb: string }[] = [
    { id: 'subordinate', label: 'Team Lead', icon: <Users size={16} />, blurb: 'Read discussion topics and add your responses.' },
    { id: 'admin', label: 'Admin Lead', icon: <ShieldCheck size={16} />, blurb: 'Set discussion topics, review every response, manage integrations.' },
  ]
  const current = roles.find(r => r.id === role)!

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="animate-rise w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/25">
            E
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to Ensemble</h1>
          <p className="mt-2 text-sm text-slate-600">One place for your team lead huddles.</p>
        </div>

        <form onSubmit={submit} noValidate className="card space-y-5 p-6 sm:p-8">
          <div role="group" aria-label="Sign in as" className="segmented w-full">
            {roles.map(r => (
              <button
                key={r.id}
                type="button"
                aria-pressed={role === r.id}
                onClick={() => setRole(r.id)}
                className="segment flex flex-1 items-center justify-center gap-2"
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          <p className="-mt-1 text-center text-xs text-slate-500">{current.blurb}</p>

          <Field label="Full name" error={show('name') ? nameError : undefined} counter={{ value: name.length, max: LIMITS.nameMax }}>
            {p => (
              <input
                {...p}
                type="text"
                autoComplete="name"
                value={name}
                maxLength={LIMITS.nameMax + 20}
                onChange={e => setName(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, name: true }))}
                placeholder="Jane Doe"
                className="input"
              />
            )}
          </Field>

          <Field label="Work email" error={show('email') ? emailError : undefined}>
            {p => (
              <input
                {...p}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                placeholder="jane@company.com"
                className="input"
              />
            )}
          </Field>

          <button type="submit" className="btn-primary w-full py-3">
            Continue as {current.label} <ArrowRight size={16} />
          </button>

          {GOOGLE_CLIENT_ID && role === 'subordinate' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs uppercase tracking-wide text-slate-500">or</span>
                </div>
              </div>
              <div id="google-signin-button" className="flex min-h-[44px] justify-center" />
            </>
          )}
        </form>
      </div>
    </main>
  )
}
