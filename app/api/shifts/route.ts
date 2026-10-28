import { NextRequest, NextResponse } from 'next/server'
import { ShiftCheckIn } from '@/lib/types'
import storage from '@/lib/storage'
import { nanoid } from '@/lib/utils'
import { parseShiftInput, readJson } from '@/lib/validation'

export async function GET() {
  return NextResponse.json(storage.getShifts())
}

export async function POST(req: NextRequest) {
  const parsed = parseShiftInput(await readJson(req))
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Validation failed', fields: parsed.errors }, { status: 400 })
  }
  const d = parsed.data

  const shift: ShiftCheckIn = {
    id: nanoid(),
    date: d.date!,
    shift: d.shift!,
    tlName: d.tlName!,
    team: d.team!,
    scheduledCount: d.scheduledCount!,
    presentCount: d.presentCount!,
    capacityNote: d.capacityNote,
    handoverNote: d.handoverNote,
    processChangesShared: d.processChangesShared!,
    bugsShared: d.bugsShared!,
    previousIssuesReviewed: d.previousIssuesReviewed!,
    feedbackRoundCompleted: d.feedbackRoundCompleted!,
    noActionableFeedback: d.noActionableFeedback!,
    submittedAt: new Date().toISOString(),
  }

  storage.createShift(shift)
  return NextResponse.json(shift, { status: 201 })
}
