import { NextRequest, NextResponse } from 'next/server'
import storage from '@/lib/storage'
import { parseIssuePatch, readJson } from '@/lib/validation'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const issue = storage.getIssueById(params.id)

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  const updates = storage.getUpdatesByIssue(params.id)
  return NextResponse.json({ issue, updates })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsed = parseIssuePatch(await readJson(req))
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Validation failed', fields: parsed.errors }, { status: 400 })
  }
  const issue = storage.updateIssue(params.id, parsed.data)

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  return NextResponse.json(issue)
}
