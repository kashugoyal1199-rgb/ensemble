'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { Field } from '@/components/ui'
import { PageShell } from '@/components/PageShell'
import { parseIssueInput } from '@/lib/validation'

const initial = {
  title: '',
  category: 'product',
  description: '',
  exampleTask: '',
  expectedBehaviour: '',
  actualBehaviour: '',
  impact: 'delayed',
  frequency: 'first_time',
  workaround: '',
  suggestedOwner: '',
  urgency: 'weekly_review',
  containmentNote: '',
  reportedBy: '',
  team: 'default',
}
type Form = typeof initial

const opts = {
  category: [['product', 'Product'], ['experience', 'Experience'], ['process', 'Process'], ['training', 'Training'], ['qa', 'QA'], ['customer', 'Customer'], ['other', 'Other']],
  impact: [['blocked', 'Blocked task'], ['delayed', 'Delayed task'], ['extra_effort', 'Extra effort or repeated work'], ['customer_impact', 'Customer impact'], ['safety_risk', 'Safety, privacy, payment, or fraud risk'], ['workable', 'Confusing but workable']],
  frequency: [['first_time', 'First time'], ['same_faffer', 'Repeated by the same Faffer'], ['multiple_faffers', 'Affecting multiple Faffers'], ['recurring', 'Recurring across shifts']],
  urgency: [['immediate', 'Immediate (needs urgent escalation)'], ['same_day', 'Same day'], ['weekly_review', 'Weekly review']],
  owner: [['', 'Not sure'], ['product', 'Product'], ['engineering', 'Engineering'], ['ops', 'Ops'], ['qa', 'QA'], ['training', 'Training']],
} as const

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const parsed = parseIssueInput(f)
  const errs: Partial<Record<keyof Form, string>> = parsed.ok ? {} : { ...(parsed.errors as any) }
  const norm = (m: string | undefined) => (m === 'Required' ? 'This field is required' : m)
  for (const k of Object.keys(errs) as (keyof Form)[]) errs[k] = norm(errs[k])
  if (f.urgency === 'immediate' && !f.containmentNote.trim()) {
    errs.containmentNote = 'Describe how you are containing this while it is urgent'
  }
  return errs
}

export default function ReportIssuePage() {
  const { data: auth } = useSession()
  const [f, setF] = useState<Form>(initial)
  const sessionName = auth?.user?.name || auth?.user?.email || ''
  useEffect(() => {
    if (sessionName) setF(p => (p.reportedBy === sessionName ? p : { ...p, reportedBy: sessionName }))
  }, [sessionName])
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [createdId, setCreatedId] = useState('')

  const errors = validate(f)
  const err = (k: keyof Form) => (touched[k] || submitted ? errors[k] : undefined)

  const bind = (k: keyof Form) => ({
    name: k,
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value })),
    onBlur: () => setTouched(t => ({ ...t, [k]: true })),
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setServerError('')
    if (Object.keys(errors).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(body?.fields ? Object.values(body.fields).join(' · ') : body?.error || 'Something went wrong. Please try again.')
        return
      }
      setCreatedId(body.id)
    } catch {
      setServerError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (createdId) {
    return (
      <PageShell title="Issue reported" subtitle="Thanks — it’s been logged.">
        <div className="card animate-rise flex flex-col items-center p-10 text-center">
          <CheckCircle2 size={44} className="text-emerald-500" />
          <p className="mt-4 text-sm text-slate-600">Reference</p>
          <p className="font-mono text-lg font-semibold">{createdId}</p>
          <div className="mt-6 flex gap-3">
            <button className="btn-secondary" onClick={() => { setF({ ...initial, reportedBy: sessionName }); setTouched({}); setSubmitted(false); setCreatedId('') }}>
              Report another
            </button>
            <Link href="/" className="btn-primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Report an issue" subtitle="Tell us what’s getting in the way. Fields marked * are required.">
      <form onSubmit={submit} noValidate className="space-y-6">
        {serverError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {serverError}
          </div>
        )}

        <section className="card space-y-5 p-6">
          <h2 className="text-base font-semibold">The basics</h2>
          <Field label="Title *" error={err('title')} counter={{ value: f.title.length, max: 120 }}>
            {p => <input {...p} {...bind('title')} type="text" placeholder="Short summary of the problem" className="input" />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category *" error={err('category')}>
              {p => (
                <select {...p} {...bind('category')} className="input">
                  {opts.category.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Reporting as" error={err('reportedBy')}>
              {p => <input {...p} {...bind('reportedBy')} type="text" readOnly className="input" />}
            </Field>
          </div>
          <Field label="Description *" error={err('description')} hint="What happened, and what did you expect?" counter={{ value: f.description.length, max: 5000 }}>
            {p => <textarea {...p} {...bind('description')} rows={4} className="input resize-y" />}
          </Field>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-base font-semibold">Severity</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Impact *" error={err('impact')}>
              {p => (
                <select {...p} {...bind('impact')} className="input">
                  {opts.impact.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Frequency *" error={err('frequency')}>
              {p => (
                <select {...p} {...bind('frequency')} className="input">
                  {opts.frequency.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
          </div>
          <Field label="Urgency *" error={err('urgency')}>
            {p => (
              <select {...p} {...bind('urgency')} className="input">
                {opts.urgency.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            )}
          </Field>
          {f.urgency === 'immediate' && (
            <Field label="Containment *" error={err('containmentNote')} hint="What is being done right now to limit the damage?" counter={{ value: f.containmentNote.length, max: 1000 }}>
              {p => <textarea {...p} {...bind('containmentNote')} rows={3} className="input resize-y" />}
            </Field>
          )}
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-base font-semibold">
            More detail <span className="font-normal text-slate-500">(optional)</span>
          </h2>
          <Field label="Example task ID or link" error={err('exampleTask')}>
            {p => <input {...p} {...bind('exampleTask')} type="text" className="input" />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Expected behaviour" error={err('expectedBehaviour')} counter={{ value: f.expectedBehaviour.length, max: 1000 }}>
              {p => <textarea {...p} {...bind('expectedBehaviour')} rows={3} className="input resize-y" />}
            </Field>
            <Field label="Actual behaviour" error={err('actualBehaviour')} counter={{ value: f.actualBehaviour.length, max: 1000 }}>
              {p => <textarea {...p} {...bind('actualBehaviour')} rows={3} className="input resize-y" />}
            </Field>
          </div>
          <Field label="Immediate workaround" error={err('workaround')} counter={{ value: f.workaround.length, max: 1000 }}>
            {p => <textarea {...p} {...bind('workaround')} rows={2} className="input resize-y" />}
          </Field>
          <Field label="Suggested owner" error={err('suggestedOwner')}>
            {p => (
              <select {...p} {...bind('suggestedOwner')} className="input">
                {opts.owner.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            )}
          </Field>
        </section>

        <div className="flex justify-end gap-3">
          <Link href="/" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary min-w-32">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit issue'}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
