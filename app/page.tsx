'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, CalendarDays, CalendarClock, ClipboardList, Settings2 } from 'lucide-react'
import { Avatar, ConfirmDialog, Toasts, ToastMsg } from '@/components/ui'
import { Login } from '@/components/Login'
import { QuestionCard } from '@/components/QuestionCard'
import { AdminSettings } from '@/components/AdminSettings'
import {
  KEYS,
  QuestionData,
  Session,
  dailyQuestions,
  hydrate,
  initials,
  isQuestionDataList,
  mondayQuestions,
  readStorage,
  writeStorage,
} from '@/lib/huddle'

type View = 'today' | 'monday'
type Section = 'huddle' | 'settings'

const isString = (v: unknown): v is string => typeof v === 'string'

export default function Ensemble() {
  const { data: auth, status } = useSession()
  const session: Session | null = useMemo(
    () =>
      auth?.user?.email
        ? { role: auth.user.role, name: auth.user.name || auth.user.email, email: auth.user.email.toLowerCase() }
        : null,
    [auth]
  )
  const [daily, setDaily] = useState<QuestionData[]>(() => hydrate(dailyQuestions, null))
  const [monday, setMonday] = useState<QuestionData[]>(() => hydrate(mondayQuestions, null))
  const [view, setView] = useState<View>('today')
  const [section, setSection] = useState<Section>('huddle')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [feedbackLink, setFeedbackLink] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [sheetId, setSheetId] = useState('')
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [pendingDelete, setPendingDelete] = useState<{ questionId: number; id: string } | null>(null)

  const toast = useCallback((type: ToastMsg['type'], text: string) => {
    setToasts(t => [...t.slice(-2), { id: Date.now() + Math.random(), type, text }])
  }, [])
  const dismissToast = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), [])

  // Initial load + cross-tab sync
  useEffect(() => {
    const load = () => {
      setDaily(hydrate(dailyQuestions, readStorage(KEYS.daily, isQuestionDataList)))
      setMonday(hydrate(mondayQuestions, readStorage(KEYS.monday, isQuestionDataList)))
      setFeedbackLink(readStorage(KEYS.feedbackLink, isString) ?? '')
      setApiKey(readStorage(KEYS.apiKey, isString) ?? '')
      setSheetId(readStorage(KEYS.sheetId, isString) ?? '')
    }
    load()

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || [KEYS.daily, KEYS.monday, KEYS.feedbackLink, KEYS.apiKey, KEYS.sheetId].includes(e.key as any)) load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = useCallback(
    (key: string, value: unknown) => {
      if (!writeStorage(key, value)) {
        toast('error', 'Could not save — browser storage is full or disabled.')
        return false
      }
      return true
    },
    [toast]
  )

  const questions = view === 'today' ? dailyQuestions : mondayQuestions
  const data = view === 'today' ? daily : monday

  const mutate = (questionId: number, fn: (q: QuestionData) => QuestionData): boolean => {
    const isDaily = questionId <= 100
    const list = isDaily ? daily : monday
    const next = list.map(q => (q.questionId === questionId ? fn(q) : q))
    if (!persist(isDaily ? KEYS.daily : KEYS.monday, next)) return false
    ;(isDaily ? setDaily : setMonday)(next)
    return true
  }

  const stats = useMemo(() => {
    const withTopic = data.filter(d => d.adminDiscussionTopic.trim()).length
    const responses = data.reduce((n, d) => n + d.tlResponses.length, 0)
    const people = new Set(data.flatMap(d => d.tlResponses.map(r => r.tlEmail))).size
    return { withTopic, responses, people }
  }, [data])

  if (status === 'loading') return <div className="min-h-screen" aria-busy />

  if (!session) {
    return (
      <>
        <Login />
        <Toasts toasts={toasts} dismiss={dismissToast} />
      </>
    )
  }

  const isAdmin = session.role === 'admin'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">E</span>
            <span className="text-lg font-bold tracking-tight">Ensemble</span>
          </div>
          <div className="flex items-center gap-3">
            <nav className="mr-1 hidden items-center gap-1 md:flex" aria-label="Forms">
              <Link href="/shift-checkin" className="btn-ghost">Shift check-in</Link>
              <Link href="/issue" className="btn-ghost">Report issue</Link>
            </nav>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-slate-900">{session.name}</p>
              <p className="text-xs leading-tight text-slate-500">{isAdmin ? 'Admin Lead' : 'Team Lead'}</p>
            </div>
            <Avatar name={session.email} initials={initials(session.name)} />
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost" aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {section === 'settings' ? 'Feedback & integrations' : view === 'today' ? 'Today’s huddle' : 'Monday huddle'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {section === 'settings'
                ? 'Manage the feedback form and Google Sheets connection.'
                : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {section === 'huddle' && (
              <div className="segmented" role="tablist" aria-label="Huddle type">
                <button role="tab" aria-selected={view === 'today'} onClick={() => { setView('today'); setExpanded(null) }} className="segment inline-flex items-center gap-2">
                  <CalendarDays size={15} /> Today
                </button>
                <button role="tab" aria-selected={view === 'monday'} onClick={() => { setView('monday'); setExpanded(null) }} className="segment inline-flex items-center gap-2">
                  <CalendarClock size={15} /> Monday
                </button>
              </div>
            )}
            {isAdmin && (
              <div className="segmented" role="tablist" aria-label="Section">
                <button role="tab" aria-selected={section === 'huddle'} onClick={() => setSection('huddle')} className="segment inline-flex items-center gap-2">
                  <ClipboardList size={15} /> Huddle
                </button>
                <button role="tab" aria-selected={section === 'settings'} onClick={() => setSection('settings')} className="segment inline-flex items-center gap-2">
                  <Settings2 size={15} /> Settings
                </button>
              </div>
            )}
          </div>
        </div>

        {section === 'huddle' && (
          <>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { label: 'Topics set', value: `${stats.withTopic}/${questions.length}` },
                { label: 'Responses', value: stats.responses },
                { label: 'Contributors', value: stats.people },
              ].map(s => (
                <div key={s.label} className="card px-4 py-3.5">
                  <dt className="text-xs font-medium text-slate-600">{s.label}</dt>
                  <dd className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3">
              {questions.map((q, i) => {
                const qd = data.find(d => d.questionId === q.id)!
                return (
                  <QuestionCard
                    key={q.id}
                    index={i}
                    question={q}
                    data={qd}
                    session={session}
                    expanded={expanded === q.id}
                    onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
                    onSaveAdmin={(faff, topic) => {
                      const ok = mutate(q.id, d => ({ ...d, adminFaffResponse: faff, adminDiscussionTopic: topic }))
                      if (ok) toast('success', 'Changes saved')
                      return ok
                    }}
                    onAddResponse={text => {
                      const ok = mutate(q.id, d => ({
                        ...d,
                        tlResponses: [
                          ...d.tlResponses,
                          { id: crypto.randomUUID(), tlName: session.name, tlEmail: session.email, response: text, timestamp: new Date().toISOString() },
                        ],
                      }))
                      if (ok) toast('success', 'Response added')
                    }}
                    onDeleteResponse={id => setPendingDelete({ questionId: q.id, id })}
                  />
                )
              })}
            </div>
          </>
        )}

        {section === 'settings' && isAdmin && (
          <AdminSettings
            feedbackLink={feedbackLink}
            apiKey={apiKey}
            sheetId={sheetId}
            onSaveLink={url => {
              if (persist(KEYS.feedbackLink, url)) {
                setFeedbackLink(url)
                toast('success', 'Feedback link saved')
              }
            }}
            onSaveSheets={(k, s) => {
              if (persist(KEYS.apiKey, k) && persist(KEYS.sheetId, s)) {
                setApiKey(k)
                setSheetId(s)
                toast('success', 'Credentials saved')
              }
            }}
          />
        )}
      </main>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this response?"
        body="This can’t be undone."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            const target = (pendingDelete.questionId <= 100 ? daily : monday)
              .find(q => q.questionId === pendingDelete.questionId)
              ?.tlResponses.find(r => r.id === pendingDelete.id)
            // Re-check permission: admins may delete any response, team leads only their own.
            if (target && (isAdmin || target.tlEmail === session.email)) {
              if (mutate(pendingDelete.questionId, d => ({ ...d, tlResponses: d.tlResponses.filter(r => r.id !== pendingDelete.id) }))) {
                toast('success', 'Response deleted')
              }
            }
          }
          setPendingDelete(null)
        }}
      />
      <Toasts toasts={toasts} dismiss={dismissToast} />
    </div>
  )
}
