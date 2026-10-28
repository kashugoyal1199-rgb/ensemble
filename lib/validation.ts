export const LIMITS = {
  nameMin: 2,
  nameMax: 50,
  emailMax: 254,
  responseMax: 5000,
  noteMax: 5000,
  titleMax: 120,
  descriptionMax: 5000,
  urlMax: 2048,
  apiKeyMin: 20,
  apiKeyMax: 200,
  sheetIdMin: 20,
  sheetIdMax: 100,
} as const

export type FieldResult = { ok: true; value: string } | { ok: false; error: string }

const ok = (value: string): FieldResult => ({ ok: true, value })
const fail = (error: string): FieldResult => ({ ok: false, error })

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/
const NAME_RE = /^[\p{L}][\p{L}\p{M}'’.\- ]*$/u

export function validateName(input: string): FieldResult {
  const v = input.trim().replace(/\s+/g, ' ')
  if (!v) return fail('Enter your name')
  if (v.length < LIMITS.nameMin) return fail(`Name must be at least ${LIMITS.nameMin} characters`)
  if (v.length > LIMITS.nameMax) return fail(`Name must be ${LIMITS.nameMax} characters or fewer`)
  if (!NAME_RE.test(v)) return fail('Name can only contain letters, spaces, hyphens and apostrophes')
  return ok(v)
}

export function validateEmail(input: string): FieldResult {
  const v = input.trim().toLowerCase()
  if (!v) return fail('Enter your work email')
  if (v.length > LIMITS.emailMax) return fail('Email is too long')
  if (v.includes('..')) return fail('Email cannot contain consecutive dots')
  if (!EMAIL_RE.test(v)) return fail('Enter a valid email, e.g. name@company.com')
  return ok(v)
}

/** Required free-text, e.g. a team lead's response. */
export function validateResponse(input: string): FieldResult {
  const v = input.trim()
  if (!v) return fail('Response cannot be empty')
  if (v.length > LIMITS.responseMax) return fail(`Response must be ${LIMITS.responseMax} characters or fewer`)
  return ok(v)
}

/** Optional free-text, e.g. admin notes. Empty is allowed. */
export function validateNote(input: string, label = 'Note'): FieldResult {
  const v = input.trim()
  if (v.length > LIMITS.noteMax) return fail(`${label} must be ${LIMITS.noteMax} characters or fewer`)
  return ok(v)
}

export function validateUrl(input: string, opts: { hostIncludes?: string[] } = {}): FieldResult {
  const v = input.trim()
  if (!v) return fail('Enter a link')
  if (v.length > LIMITS.urlMax) return fail('Link is too long')
  let url: URL
  try {
    url = new URL(v)
  } catch {
    return fail('Enter a full link starting with https://')
  }
  if (url.protocol !== 'https:') return fail('Link must start with https://')
  if (opts.hostIncludes && !opts.hostIncludes.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
    return fail(`Link must be on ${opts.hostIncludes.join(' or ')}`)
  }
  return ok(url.toString())
}

export function validateFeedbackFormUrl(input: string): FieldResult {
  return validateUrl(input, { hostIncludes: ['google.com', 'forms.gle'] })
}

export function validateApiKey(input: string): FieldResult {
  const v = input.trim()
  if (!v) return fail('Enter an API key')
  if (v.length < LIMITS.apiKeyMin || v.length > LIMITS.apiKeyMax) return fail('API key looks the wrong length')
  if (!/^[A-Za-z0-9_-]+$/.test(v)) return fail('API key can only contain letters, numbers, - and _')
  return ok(v)
}

export function validateSheetId(input: string): FieldResult {
  let v = input.trim()
  // Accept a pasted sheet URL and pull the ID out of it.
  const m = v.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/)
  if (m) v = m[1]
  if (!v) return fail('Enter a sheet ID')
  if (v.length < LIMITS.sheetIdMin || v.length > LIMITS.sheetIdMax) return fail('Sheet ID looks the wrong length')
  if (!/^[A-Za-z0-9_-]+$/.test(v)) return fail('Sheet ID can only contain letters, numbers, - and _')
  return ok(v)
}

// ---- API payload validation -------------------------------------------------

import type { Frequency, ImpactLevel, IssueCategory, Urgency } from './types'

const CATEGORIES: IssueCategory[] = ['product', 'experience', 'process', 'training', 'qa', 'customer', 'other']
const IMPACTS: ImpactLevel[] = ['blocked', 'delayed', 'extra_effort', 'customer_impact', 'safety_risk', 'workable']
const FREQUENCIES: Frequency[] = ['first_time', 'same_faffer', 'multiple_faffers', 'recurring']
const URGENCIES: Urgency[] = ['immediate', 'same_day', 'weekly_review']
const STATUSES = ['new', 'acknowledged', 'in_progress', 'workaround_shared', 'resolved', 'wont_fix'] as const

type Obj = Record<string, unknown>
type Errors = Record<string, string>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

function str(body: Obj, key: string, errors: Errors, o: { required?: boolean; max: number; min?: number }): string | undefined {
  const raw = body[key]
  if (raw === undefined || raw === null || raw === '') {
    if (o.required) errors[key] = 'Required'
    return undefined
  }
  if (typeof raw !== 'string') {
    errors[key] = 'Must be text'
    return undefined
  }
  const v = raw.trim()
  if (o.required && !v) errors[key] = 'Required'
  else if (o.min && v.length < o.min) errors[key] = `Must be at least ${o.min} characters`
  else if (v.length > o.max) errors[key] = `Must be ${o.max} characters or fewer`
  return v
}

function oneOf<T extends string>(body: Obj, key: string, allowed: readonly T[], errors: Errors): T | undefined {
  const v = body[key]
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    errors[key] = `Must be one of: ${allowed.join(', ')}`
    return undefined
  }
  return v as T
}

function count(body: Obj, key: string, errors: Errors): number | undefined {
  const v = body[key]
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 1000) {
    errors[key] = 'Must be a whole number between 0 and 1000'
    return undefined
  }
  return v
}

function bool(body: Obj, key: string, errors: Errors): boolean | undefined {
  const v = body[key]
  if (typeof v !== 'boolean') {
    errors[key] = 'Must be true or false'
    return undefined
  }
  return v
}

export type Parsed<T> = { ok: true; data: T } | { ok: false; errors: Errors }

export function parseIssueInput(body: unknown) {
  const errors: Errors = {}
  if (!isObj(body)) return { ok: false, errors: { _: 'Body must be a JSON object' } } as const
  const data = {
    title: str(body, 'title', errors, { required: true, min: 3, max: LIMITS.titleMax }),
    description: str(body, 'description', errors, { required: true, min: 10, max: LIMITS.descriptionMax }),
    category: oneOf(body, 'category', CATEGORIES, errors),
    impact: oneOf(body, 'impact', IMPACTS, errors),
    frequency: oneOf(body, 'frequency', FREQUENCIES, errors),
    urgency: oneOf(body, 'urgency', URGENCIES, errors),
    team: str(body, 'team', errors, { required: true, max: 80 }),
    reportedBy: str(body, 'reportedBy', errors, { required: true, max: LIMITS.nameMax }),
    exampleTask: str(body, 'exampleTask', errors, { max: 500 }),
    expectedBehaviour: str(body, 'expectedBehaviour', errors, { max: 1000 }),
    actualBehaviour: str(body, 'actualBehaviour', errors, { max: 1000 }),
    workaround: str(body, 'workaround', errors, { max: 1000 }),
    suggestedOwner: str(body, 'suggestedOwner', errors, { max: 80 }),
    containmentNote: str(body, 'containmentNote', errors, { max: 1000 }),
    checkInId: str(body, 'checkInId', errors, { max: 100 }),
  }
  if (data.urgency === 'immediate' && !data.containmentNote) {
    errors.containmentNote = 'Required when urgency is immediate'
  }
  if (Object.keys(errors).length) return { ok: false, errors } as const
  return { ok: true, data } as const
}

export function parseIssuePatch(body: unknown) {
  const errors: Errors = {}
  if (!isObj(body)) return { ok: false, errors: { _: 'Body must be a JSON object' } } as const
  const patch: Obj = {}
  if ('status' in body) {
    const s = oneOf(body, 'status', STATUSES, errors)
    if (s) patch.status = s
  }
  for (const [key, max] of [['resolution', 2000], ['currentOwner', 80], ['containmentNote', 1000]] as const) {
    if (key in body) {
      const v = str(body, key, errors, { max })
      if (v !== undefined) patch[key] = v
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors } as const
  if (!Object.keys(patch).length) return { ok: false, errors: { _: 'No valid fields to update' } } as const
  return { ok: true, data: patch } as const
}

export function parseShiftInput(body: unknown) {
  const errors: Errors = {}
  if (!isObj(body)) return { ok: false, errors: { _: 'Body must be a JSON object' } } as const
  const data = {
    date: str(body, 'date', errors, { required: true, max: 10 }),
    shift: str(body, 'shift', errors, { required: true, max: 40 }),
    tlName: str(body, 'tlName', errors, { required: true, min: 2, max: LIMITS.nameMax }),
    team: str(body, 'team', errors, { required: true, max: 80 }),
    scheduledCount: count(body, 'scheduledCount', errors),
    presentCount: count(body, 'presentCount', errors),
    capacityNote: str(body, 'capacityNote', errors, { max: 1000 }),
    handoverNote: str(body, 'handoverNote', errors, { max: 2000 }),
    processChangesShared: bool(body, 'processChangesShared', errors),
    bugsShared: bool(body, 'bugsShared', errors),
    previousIssuesReviewed: bool(body, 'previousIssuesReviewed', errors),
    feedbackRoundCompleted: bool(body, 'feedbackRoundCompleted', errors),
    noActionableFeedback: bool(body, 'noActionableFeedback', errors),
  }
  if (data.date && (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(Date.parse(data.date)))) {
    errors.date = 'Must be a date in YYYY-MM-DD format'
  }
  if (data.scheduledCount !== undefined && data.presentCount !== undefined && data.presentCount > data.scheduledCount) {
    errors.presentCount = 'Present count cannot exceed scheduled count'
  }
  if (Object.keys(errors).length) return { ok: false, errors } as const
  return { ok: true, data } as const
}

/** Safe JSON body read: returns undefined on malformed JSON instead of throwing. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}
