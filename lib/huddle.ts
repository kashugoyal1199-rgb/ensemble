export type Role = 'admin' | 'subordinate'

export interface TLResponse {
  id: string
  tlName: string
  tlEmail: string
  response: string
  timestamp: string
}

export interface QuestionData {
  questionId: number
  adminFaffResponse: string
  adminDiscussionTopic: string
  tlResponses: TLResponse[]
}

export interface Session {
  role: Role
  name: string
  email: string
}

export interface Question {
  id: number
  title: string
  description: string
}

export const dailyQuestions: Question[] = [
  { id: 1, title: 'How is everyone doing?', description: 'Ask how everyone is doing and whether anything is affecting their ability to start the shift.' },
  { id: 2, title: 'Share updates', description: 'Share new instructions, tool changes, important client updates, and previous-day learnings.' },
  { id: 3, title: 'Example discussion', description: 'Discuss one real or anonymised example of a good interaction or a mistake.' },
  { id: 4, title: 'Escalations', description: 'Discuss the most frequent escalations and a solution.' },
  { id: 5, title: 'Issue status updates', description: 'Update on the status: resolved, in progress, or deprioritized.' },
  { id: 6, title: 'Bug reports', description: 'Remind them to bug report every day without fail.' },
]

export const mondayQuestions: Question[] = [
  { id: 101, title: 'Shoutout for exceptional performance', description: 'Recognize team members who are doing exceptionally well.' },
  { id: 102, title: 'How is everything going?', description: "Share how you're doing overall. What's going well and what are you enjoying?" },
  { id: 103, title: 'Feedback form completion', description: 'Who has filled out the feedback form? Any blockers or concerns?' },
  { id: 104, title: 'Team challenges and solutions', description: "What are we struggling to solve as a team? Let's brainstorm together." },
]

export const emptyData = (qs: Question[]): QuestionData[] =>
  qs.map(q => ({ questionId: q.id, adminFaffResponse: '', adminDiscussionTopic: '', tlResponses: [] }))

export const KEYS = {
  daily: 'huddle_dailyQuestionData',
  monday: 'huddle_mondayQuestionData',
  session: 'huddle_session',
  feedbackLink: 'huddle_feedbackFormLink',
  apiKey: 'huddle_apiKey',
  sheetId: 'huddle_sheetId',
} as const

/** localStorage read that never throws and never returns malformed data. */
export function readStorage<T>(key: string, guard: (v: unknown) => v is T): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const isStr = (v: unknown): v is string => typeof v === 'string'

export function isQuestionDataList(v: unknown): v is QuestionData[] {
  return (
    Array.isArray(v) &&
    v.every(
      q =>
        q &&
        typeof q.questionId === 'number' &&
        isStr(q.adminFaffResponse) &&
        isStr(q.adminDiscussionTopic) &&
        Array.isArray(q.tlResponses) &&
        q.tlResponses.every(
          (r: any) => r && isStr(r.tlName) && isStr(r.tlEmail) && isStr(r.response) && isStr(r.timestamp)
        )
    )
  )
}

export function isSession(v: unknown): v is Session {
  const s = v as Session
  return !!s && (s.role === 'admin' || s.role === 'subordinate') && isStr(s.name) && isStr(s.email)
}

/** Merge stored data into the known question list so new questions never go missing. */
export function hydrate(qs: Question[], stored: QuestionData[] | null): QuestionData[] {
  const base = emptyData(qs)
  if (!stored) return base
  return base.map(b => {
    const s = stored.find(x => x.questionId === b.questionId)
    if (!s) return b
    return { ...s, tlResponses: s.tlResponses.map((r, i) => ({ ...r, id: (r as any).id ?? `${b.questionId}-${i}-${r.timestamp}` })) }
  })
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

/** Decode a Google ID token payload (UTF-8 safe). Signature is not verified client-side. */
export function decodeJwtPayload(token: string): { name?: string; email?: string; email_verified?: boolean } | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
