'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { AlertCircle, Loader2 } from 'lucide-react'

const ERRORS: Record<string, string> = {
  unverified: 'Your Google email address is not verified.',
  domain: 'That account isn’t allowed. Sign in with your work Google account.',
  AccessDenied: 'That account isn’t allowed. Sign in with your work Google account.',
  Configuration: 'Sign-in isn’t configured yet. Ask an admin to set the Google credentials.',
  OAuthCallback: 'Google sign-in was interrupted. Please try again.',
  OAuthSignin: 'Could not start Google sign-in. Please try again.',
  OAuthAccountNotLinked: 'That email is already linked to another sign-in method.',
  Callback: 'Google sign-in failed. Please try again.',
  SessionRequired: 'Please sign in to continue.',
}

export function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error')
    if (code) {
      setError(ERRORS[code] ?? 'Sign-in failed. Please try again.')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const start = async () => {
    setLoading(true)
    setError('')
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch {
      setError('Could not reach the sign-in service. Check your connection.')
      setLoading(false)
    }
  }

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

        <div className="card space-y-5 p-6 sm:p-8">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <button type="button" onClick={start} disabled={loading} className="btn-secondary w-full gap-3 py-3 text-base">
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
                <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.9 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-500">
            Use your work Google account. Admin access is granted by your organisation.
          </p>
        </div>
      </div>
    </main>
  )
}
