import { NextRequest, NextResponse } from 'next/server'
import { Issue } from '@/lib/types'
import storage from '@/lib/storage'
import { parseIssueInput, readJson } from '@/lib/validation'

export async function GET() {
  return NextResponse.json(storage.getIssues())
}

export async function POST(req: NextRequest) {
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
    reportedBy: d.reportedBy!,
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
