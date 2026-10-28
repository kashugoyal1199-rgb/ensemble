import { NextRequest, NextResponse } from 'next/server'
import { Issue } from '@/lib/types'
import storage from '@/lib/storage'
import { nanoid } from '@/lib/utils'

export async function GET() {
  return NextResponse.json(storage.getIssues())
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const issue: Issue = {
    id: `ISS-${Date.now()}`,
    status: 'new',
    reopened: false,
    ...body,
    reportedAt: new Date().toISOString(),
  }

  storage.createIssue(issue)

  // TODO: Send email notification to owner
  // TODO: Log to Google Forms integration webhook

  return NextResponse.json(issue, { status: 201 })
}
