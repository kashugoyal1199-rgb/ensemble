import { NextRequest, NextResponse } from 'next/server'
import { Issue } from '@/lib/types'
import storage from '@/lib/storage'
import { requireUser } from '@/lib/auth'
import { parseIssueInput, readJson } from '@/lib/validation'

export async function GET() {
  const auth = await requireUser({ admin: true })
  if ('error' in auth) return auth.error
  return NextResponse.json(storage.getIssues())
}

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  const parsed = parseIssueInput(await readJson(req))
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Validation failed', fields: parsed.errors }, { status: 400 })
  }
  const d = parsed.data

  const issue: Issue = {
    id: `ISS-${Date.now()}`,
    status: 'new',
    reopened: false,
    title: d.title!,
    description: d.description!,
    category: d.category!,
    impact: d.impact!,
    frequency: d.frequency!,
    urgency: d.urgency!,
    team: d.team!,
    reportedBy: auth.user.name,
    exampleTask: d.exampleTask,
    expectedBehaviour: d.expectedBehaviour,
    actualBehaviour: d.actualBehaviour,
    workaround: d.workaround,
    suggestedOwner: d.suggestedOwner,
    containmentNote: d.containmentNote,
    checkInId: d.checkInId,
    reportedAt: new Date().toISOString(),
  }

  storage.createIssue(issue)

  return NextResponse.json(issue, { status: 201 })
}
