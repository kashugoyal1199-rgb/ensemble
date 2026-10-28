'use client'

import React, { useState } from 'react'
import { ChevronDown, EyeOff, Eye, Plus, Save, Trash2, MessageSquare } from 'lucide-react'
import { Avatar, Field } from './ui'
import { initials, Question, QuestionData, Session, timeAgo } from '@/lib/huddle'
import { LIMITS, validateNote, validateResponse } from '@/lib/validation'

interface Props {
  index: number
  question: Question
  data: QuestionData
  session: Session
  expanded: boolean
  onToggle: () => void
  onSaveAdmin: (faff: string, discussion: string) => boolean
  onAddResponse: (text: string) => void
  onDeleteResponse: (id: string) => void
}

export function QuestionCard({ index, question, data, session, expanded, onToggle, onSaveAdmin, onAddResponse, onDeleteResponse }: Props) {
  const isAdmin = session.role === 'admin'
  const [faff, setFaff] = useState(data.adminFaffResponse)
  const [topic, setTopic] = useState(data.adminDiscussionTopic)
  const [draft, setDraft] = useState('')
  const [draftTouched, setDraftTouched] = useState(false)

  // Re-sync when another tab changes the stored value and there are no local unsaved edits.
  const savedFaff = data.adminFaffResponse
  const savedTopic = data.adminDiscussionTopic
  const dirty = faff !== savedFaff || topic !== savedTopic
  React.useEffect(() => {
    setFaff(f => (f === savedFaff ? f : savedFaff))
    setTopic(t => (t === savedTopic ? t : savedTopic))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedFaff, savedTopic])

  const faffRes = validateNote(faff, 'Faffer notes')
  const topicRes = validateNote(topic, 'Discussion topic')
  const draftRes = validateResponse(draft)
  const draftError = !draftRes.ok && (draftTouched || draft.length > LIMITS.responseMax) ? draftRes.error : undefined

  const mine = data.tlResponses.filter(r => r.tlEmail === session.email).length
  const canDelete = (email: string) => isAdmin || email === session.email

  const submitDraft = (e?: React.FormEvent) => {
    e?.preventDefault()
    setDraftTouched(true)
    if (!draftRes.ok) return
    onAddResponse(draftRes.value)
    setDraft('')
    setDraftTouched(false)
  }

  const save = () => {
    if (!faffRes.ok || !topicRes.ok) return
    onSaveAdmin(faffRes.value, topicRes.value)
  }

  const count = data.tlResponses.length

  return (
    <section className="card overflow-hidden transition-shadow hover:shadow-md">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:p-6"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-slate-900">{question.title}</span>
            <span className="mt-0.5 block text-sm text-slate-600">{question.description}</span>
            <span className="mt-2.5 flex flex-wrap items-center gap-2">
              {data.adminDiscussionTopic ? (
                <span className="badge bg-emerald-50 text-emerald-700">Topic set</span>
              ) : (
                <span className="badge bg-slate-100 text-slate-600">No topic yet</span>
              )}
              <span className="badge gap-1 bg-slate-100 text-slate-700">
                <MessageSquare size={11} /> {count} {count === 1 ? 'response' : 'responses'}
              </span>
              {mine > 0 && <span className="badge bg-indigo-50 text-indigo-700">You responded</span>}
            </span>
          </span>
          <ChevronDown size={20} className={`mt-1 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </h3>

      {expanded && (
        <div className="animate-rise space-y-6 border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6">
          {isAdmin ? (
            <div className="space-y-5">
              <Field
                label="What Faffers are saying"
                error={!faffRes.ok ? faffRes.error : undefined}
                hint="Private. Only admins can see this."
                counter={{ value: faff.length, max: LIMITS.noteMax }}
              >
                {p => (
                  <div className="relative">
                    <textarea {...p} value={faff} onChange={e => setFaff(e.target.value)} rows={3} placeholder="Admin-only notes…" className="input resize-y" />
                    <EyeOff size={14} className="pointer-events-none absolute right-3 top-3 text-slate-400" aria-hidden />
                  </div>
                )}
              </Field>
              <Field
                label="What TLs should discuss"
                error={!topicRes.ok ? topicRes.error : undefined}
                hint="Visible to every team lead."
                counter={{ value: topic.length, max: LIMITS.noteMax }}
              >
                {p => (
                  <div className="relative">
                    <textarea {...p} value={topic} onChange={e => setTopic(e.target.value)} rows={3} placeholder="Talking points for the huddle…" className="input resize-y" />
                    <Eye size={14} className="pointer-events-none absolute right-3 top-3 text-slate-400" aria-hidden />
                  </div>
                )}
              </Field>
              <div className="flex items-center gap-3">
                <button type="button" onClick={save} disabled={!dirty || !faffRes.ok || !topicRes.ok} className="btn-primary">
                  <Save size={16} /> Save changes
                </button>
                {dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Discussion topic</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-800">
                {data.adminDiscussionTopic || <span className="text-slate-500">Your admin hasn’t set a topic for this yet.</span>}
              </p>
            </div>
          )}

          <form onSubmit={submitDraft} noValidate>
            <Field label="Your response" error={draftError} counter={{ value: draft.length, max: LIMITS.responseMax }}>
              {p => (
                <textarea
                  {...p}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={() => draft && setDraftTouched(true)}
                  onKeyDown={e => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitDraft()
                  }}
                  rows={3}
                  placeholder="Share your update…"
                  className="input resize-y"
                />
              )}
            </Field>
            <div className="mt-2 flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={draft.length > LIMITS.responseMax}>
                <Plus size={16} /> Add response
              </button>
              <span className="hidden text-xs text-slate-500 sm:inline">⌘/Ctrl + Enter to submit</span>
            </div>
          </form>

          {count > 0 && (
            <div className="border-t border-slate-200 pt-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Responses · {count}</h4>
              <ul className="space-y-3">
                {data.tlResponses.map(r => (
                  <li key={r.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <Avatar name={r.tlEmail} initials={initials(r.tlName)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold text-slate-900">{r.tlName}</span>
                        <span className="truncate text-xs text-slate-500">{r.tlEmail}</span>
                        <time className="text-xs text-slate-500" dateTime={r.timestamp} title={new Date(r.timestamp).toLocaleString()}>
                          · {timeAgo(r.timestamp)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{r.response}</p>
                    </div>
                    {canDelete(r.tlEmail) && (
                      <button
                        type="button"
                        onClick={() => onDeleteResponse(r.id)}
                        className="btn-ghost h-8 w-8 shrink-0 !p-0 hover:!bg-red-50 hover:!text-red-600"
                        aria-label={`Delete response from ${r.tlName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
