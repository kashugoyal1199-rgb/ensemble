import { NextRequest, NextResponse } from 'next/server'
import storage from '@/lib/storage'

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
  const body = await req.json()
  const issue = storage.updateIssue(params.id, body)

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  return NextResponse.json(issue)
}
