'use client'

import React, { useState } from 'react'
import { ExternalLink, Eye, EyeOff, FileText, Sheet } from 'lucide-react'
import { Field } from './ui'
import { validateApiKey, validateFeedbackFormUrl, validateSheetId } from '@/lib/validation'

interface Props {
  feedbackLink: string
  apiKey: string
  sheetId: string
  onSaveLink: (url: string) => void
  onSaveSheets: (apiKey: string, sheetId: string) => void
}

export function AdminSettings({ feedbackLink, apiKey, sheetId, onSaveLink, onSaveSheets }: Props) {
  const [link, setLink] = useState(feedbackLink)
  const [key, setKey] = useState(apiKey)
  const [sheet, setSheet] = useState(sheetId)
  const [showKey, setShowKey] = useState(false)
  const [t, setT] = useState({ link: false, key: false, sheet: false })

  const linkRes = validateFeedbackFormUrl(link)
  const keyRes = validateApiKey(key)
  const sheetRes = validateSheetId(sheet)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        noValidate
        className="card space-y-5 p-6"
        onSubmit={e => {
          e.preventDefault()
          setT(s => ({ ...s, link: true }))
          if (linkRes.ok) {
            onSaveLink(linkRes.value)
            setLink(linkRes.value)
          }
        }}
      >
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <FileText size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Feedback form</h2>
            <p className="text-sm text-slate-600">Linked from Monday’s “Feedback form completion”.</p>
          </div>
        </header>
        <Field label="Google Form link" error={t.link && !linkRes.ok ? linkRes.error : undefined} hint="Must be an https link on google.com or forms.gle.">
          {p => (
            <input {...p} type="url" value={link} onChange={e => setLink(e.target.value)} onBlur={() => setT(s => ({ ...s, link: !!link }))} placeholder="https://forms.gle/…" className="input" />
          )}
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary">
            Save link
          </button>
          {feedbackLink && (
            <a href={feedbackLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Open form <ExternalLink size={14} />
            </a>
          )}
        </div>
      </form>

      <form
        noValidate
        className="card space-y-5 p-6"
        onSubmit={e => {
          e.preventDefault()
          setT(s => ({ ...s, key: true, sheet: true }))
          if (keyRes.ok && sheetRes.ok) {
            onSaveSheets(keyRes.value, sheetRes.value)
            setSheet(sheetRes.value)
          }
        }}
      >
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Sheet size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Google Sheets</h2>
            <p className="text-sm text-slate-600">Pull form responses into the dashboard.</p>
          </div>
        </header>
        <Field label="API key" error={t.key && !keyRes.ok ? keyRes.error : undefined} hint="Stored in this browser only.">
          {p => (
            <div className="relative">
              <input
                {...p}
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={key}
                onChange={e => setKey(e.target.value)}
                onBlur={() => setT(s => ({ ...s, key: !!key }))}
                className="input pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:text-slate-800"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}
        </Field>
        <Field label="Sheet ID or URL" error={t.sheet && !sheetRes.ok ? sheetRes.error : undefined} hint="Paste the sheet’s URL and the ID is extracted for you.">
          {p => (
            <input {...p} type="text" spellCheck={false} value={sheet} onChange={e => setSheet(e.target.value)} onBlur={() => setT(s => ({ ...s, sheet: !!sheet }))} className="input font-mono" />
          )}
        </Field>
        <button type="submit" className="btn-primary">
          Save credentials
        </button>
      </form>
    </div>
  )
}
