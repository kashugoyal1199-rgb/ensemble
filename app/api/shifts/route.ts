import { NextRequest, NextResponse } from 'next/server'
import { ShiftCheckIn } from '@/lib/types'
import storage from '@/lib/storage'
import { nanoid } from '@/lib/utils'

export async function GET() {
  return NextResponse.json(storage.getShifts())
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const shift: ShiftCheckIn = {
    id: nanoid(),
    ...body,
    submittedAt: new Date().toISOString(),
  }

  storage.createShift(shift)
  return NextResponse.json(shift, { status: 201 })
}
