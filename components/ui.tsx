'use client'

import React, { useEffect, useId } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function Field({
  label,
  error,
  hint,
  counter,
  children,
}: {
  label: string
  error?: string
  hint?: string
  counter?: { value: number; max: number }
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => React.ReactNode
}) {
  const id = useId()
  const msgId = `${id}-msg`
  const over = counter && counter.value > counter.max
  const near = counter && counter.value > counter.max * 0.9
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? msgId : undefined })}
      <div className="flex items-start justify-between gap-3">
        <div id={msgId} className="min-h-[1.25rem]" aria-live="polite">
          {error ? (
            <p className="error-text">
              <AlertCircle size={13} className="shrink-0" /> {error}
            </p>
          ) : hint ? (
            <p className="hint">{hint}</p>
          ) : null}
        </div>
        {counter && (
          <p className={`mt-1.5 text-xs tabular-nums ${over ? 'font-semibold text-red-600' : near ? 'text-amber-600' : 'text-slate-500'}`}>
            {counter.value.toLocaleString()}/{counter.max.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

export interface ToastMsg {
  id: number
  type: 'success' | 'error'
  text: string
}

export function Toasts({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, dismiss }: { toast: ToastMsg; dismiss: (id: number) => void }) {
  useEffect(() => {
    const h = setTimeout(() => dismiss(toast.id), 3500)
    return () => clearTimeout(h)
  }, [toast.id, dismiss])
  const ok = toast.type === 'success'
  return (
    <div
      className={`animate-rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
        ok ? 'bg-slate-900 text-white ring-slate-900' : 'bg-red-600 text-white ring-red-700'
      }`}
    >
      {ok ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <AlertCircle size={16} className="shrink-0" />}
      <span>{toast.text}</span>
      <button onClick={() => dismiss(toast.id)} className="ml-1 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="card animate-rise relative w-full max-w-sm p-6 shadow-xl">
        <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const AVATAR_COLORS = ['bg-indigo-100 text-indigo-800', 'bg-sky-100 text-sky-800', 'bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800', 'bg-violet-100 text-violet-800']

export function Avatar({ name, initials, size = 36 }: { name: string; initials: string; size?: number }) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${AVATAR_COLORS[h % AVATAR_COLORS.length]}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
