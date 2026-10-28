'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { AlertTriangle, Check, CheckCircle2, Loader2 } from 'lucide-react'
import { Field } from '@/components/ui'
import { PageShell } from '@/components/PageShell'
import { parseShiftInput } from '@/lib/validation'

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

const initial = {
  date: today(),
  shift: 'morning',
  tlName: '',
  team: 'default',
  scheduledCount: '',
  presentCount: '',
  capacityNote: '',
  processChangesShared: false,
  bugsShared: false,
  previousIssuesReviewed: false,
  feedbackRoundCompleted: false,
  noActionableFeedback: false,
  handoverNote: '',
}
type Form = typeof initial
type Errs = Partial<Record<keyof Form, string>>

const STEPS = ['Shift details', 'Huddle', 'Handover']
const STEP_FIELDS: (keyof Form)[][] = [
  ['date', 'shift', 'tlName', 'team', 'scheduledCount', 'presentCount', 'capacityNote'],
  ['processChangesShared', 'bugsShared', 'previousIssuesReviewed', 'feedbackRoundCompleted', 'noActionableFeedback'],
  ['handoverNote'],
]

const toPayload = (f: Form) => ({
  ...f,
  scheduledCount: f.scheduledCount === '' ? NaN : Number(f.scheduledCount),
  presentCount: f.presentCount === '' ? NaN : Number(f.presentCount),
})

function validate(f: Form): Errs {
  const parsed = parseShiftInput(toPayload(f))
  const errs: Errs = parsed.ok ? {} : { ...(parsed.errors as any) }
  if (errs.scheduledCount && f.scheduledCount === '') errs.scheduledCount = 'Enter how many were scheduled'
  if (errs.presentCount && f.presentCount === '') errs.presentCount = 'Enter how many are present'
  for (const k of ['tlName', 'date', 'shift', 'team'] as const) if (errs[k] === 'Required') errs[k] = 'This field is required'
  if (f.date > today()) errs.date = 'Date cannot be in the future'
  if (f.presentCount !== '' && f.scheduledCount !== '' && Number(f.presentCount) < Number(f.scheduledCount) && !f.capacityNote.trim()) {
    errs.capacityNote = 'Add a note explaining the shortfall'
  }
  return errs
}

export default function ShiftCheckinPage() {
  const { data: auth } = useSession()
  const [f, setF] = useState<Form>(initial)
  const sessionName = auth?.user?.name || auth?.user?.email || ''
  useEffect(() => {
    if (sessionName) setF(p => (p.tlName === sessionName ? p : { ...p, tlName: sessionName }))
  }, [sessionName])
  const [step, setStep] = useState(0)
  const [attempted, setAttempted] = useState<Set<number>>(new Set())
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const errors = validate(f)
  const err = (k: keyof Form) => (touched[k] || STEP_FIELDS.some((fs, i) => fs.includes(k) && attempted.has(i)) ? errors[k] : undefined)
  const stepHasError = (i: number) => STEP_FIELDS[i].some(k => errors[k])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(p => ({ ...p, [k]: v }))
  const bind = (k: keyof Form) => ({
    name: k,
    value: f[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
    onBlur: () => setTouched(t => ({ ...t, [k]: true })),
  })

  const lastStep = STEPS.length - 1
  // "No actionable feedback" skips straight to submit-ready after the huddle step.
  const next = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    setAttempted(s => new Set(s).add(step))
    if (stepHasError(step)) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    if (step < lastStep) return setStep(step + 1)

    setLoading(true)
    try {
      const res = await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toPayload(f)) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(body?.fields ? Object.values(body.fields).join(' · ') : body?.error || 'Something went wrong. Please try again.')
        return
      }
      setDone(true)
    } catch {
      setServerError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <PageShell title="Check-in submitted" subtitle="Your shift has been recorded.">
        <div className="card animate-rise flex flex-col items-center p-10 text-center">
          <CheckCircle2 size={44} className="text-emerald-500" />
          <p className="mt-4 text-sm text-slate-600">
            {f.tlName} · {f.shift} shift · {f.date}
          </p>
          <div className="mt-6 flex gap-3">
            <button className="btn-secondary" onClick={() => { setF({ ...initial, date: today(), tlName: sessionName }); setStep(0); setAttempted(new Set()); setTouched({}); setDone(false) }}>
              New check-in
            </button>
            <Link href="/" className="btn-primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  const checks: [keyof Form, string, string][] = [
    ['processChangesShared', 'Process changes shared', 'New instructions and tool changes were passed on.'],
    ['bugsShared', 'Bugs shared', 'Known bugs and workarounds were covered.'],
    ['previousIssuesReviewed', 'Previous issues reviewed', 'Status of open issues was reviewed.'],
    ['feedbackRoundCompleted', 'Feedback round completed', 'Each Faffer had a chance to give feedback.'],
  ]

  return (
    <PageShell title="Shift check-in" subtitle="Three quick steps to close out the huddle.">
      <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? 'bg-indigo-600 text-white' : i === step ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            <span className={`hidden text-sm sm:inline ${i === step ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{s}</span>
            {i < lastStep && <span className={`h-px flex-1 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
          </li>
        ))}
      </ol>

      <form onSubmit={next} noValidate className="card animate-rise space-y-5 p-6" key={step}>
        {serverError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {serverError}
          </div>
        )}

        {step === 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date" error={err('date')}>
                {p => <input {...p} {...bind('date')} type="date" max={today()} className="input" />}
              </Field>
              <Field label="Shift" error={err('shift')}>
                {p => (
                  <select {...p} {...bind('shift')} className="input">
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                )}
              </Field>
              <Field label="Your name" error={err('tlName')}>
                {p => <input {...p} {...bind('tlName')} type="text" readOnly className="input" />}
              </Field>
              <Field label="Team" error={err('team')}>
                {p => (
                  <select {...p} {...bind('team')} className="input">
                    <option value="default">Default team</option>
                    <option value="ops">Ops</option>
                    <option value="tech">Tech</option>
                  </select>
                )}
              </Field>
              <Field label="Scheduled Faffers" error={err('scheduledCount')}>
                {p => <input {...p} {...bind('scheduledCount')} type="number" inputMode="numeric" min={0} max={1000} step={1} className="input" />}
              </Field>
              <Field label="Present Faffers" error={err('presentCount')}>
                {p => <input {...p} {...bind('presentCount')} type="number" inputMode="numeric" min={0} max={1000} step={1} className="input" />}
              </Field>
            </div>
            <Field label="Capacity note (optional)" error={err('capacityNote')} hint="Required if fewer people are present than scheduled." counter={{ value: f.capacityNote.length, max: 1000 }}>
              {p => <textarea {...p} {...bind('capacityNote')} rows={3} className="input resize-y" />}
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-medium text-slate-800">What was covered in the huddle?</legend>
              {checks.map(([k, label, desc]) => (
                <label key={k} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50 has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50/50">
                  <input type="checkbox" checked={f[k] as boolean} onChange={e => set(k, e.target.checked as never)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{label}</span>
                    <span className="block text-xs text-slate-600">{desc}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-slate-300 p-3.5 transition hover:bg-slate-50">
              <input type="checkbox" checked={f.noActionableFeedback} onChange={e => set('noActionableFeedback', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span>
                <span className="block text-sm font-medium text-slate-900">No actionable feedback this shift</span>
                <span className="block text-xs text-slate-600">Tick if the feedback round produced nothing to follow up on.</span>
              </span>
            </label>
          </>
        )}

        {step === 2 && (
          <Field label="What should the next shift know? (optional)" error={err('handoverNote')} counter={{ value: f.handoverNote.length, max: 2000 }}>
            {p => <textarea {...p} {...bind('handoverNote')} rows={6} placeholder="Open issues, things to watch, who to ping…" className="input resize-y" />}
          </Field>
        )}

        <div className="flex items-center justify-between pt-1">
          {step > 0 ? (
            <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <Link href="/" className="btn-secondary">
              Cancel
            </Link>
          )}
          <button type="submit" disabled={loading} className="btn-primary min-w-28">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : step === lastStep ? 'Submit check-in' : 'Continue'}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
