import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { forms, notes } = await req.json()

  // TODO: In production, fetch actual data from:
  // 1. Google Forms API (forms.google.com/responses)
  // 2. Granola API or scrape the notes

  const summary = generateSummary(forms, notes)

  return NextResponse.json({ summary })
}

function generateSummary(
  forms: Array<{ id: string; url: string }>,
  notes: Array<{ id: string; url: string }>
): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let summary = `DAILY FEEDBACK SUMMARY\n`
  summary += `Date: ${today}\n`
  summary += `${'='.repeat(50)}\n\n`

  if (forms.length > 0) {
    summary += `GOOGLE FORMS RESPONSES\n`
    summary += `${'-'.repeat(50)}\n`
    forms.forEach((form, i) => {
      summary += `\n${i + 1}. Form: ${form.url}\n`
      summary += `   [Responses will be fetched from Google Forms API]\n`
    })
    summary += `\n`
  }

  if (notes.length > 0) {
    summary += `GRANOLA NOTES\n`
    summary += `${'-'.repeat(50)}\n`
    notes.forEach((note, i) => {
      summary += `\n${i + 1}. Notes: ${note.url}\n`
      summary += `   [Content will be fetched from Granola API]\n`
    })
    summary += `\n`
  }

  summary += `${'='.repeat(50)}\n`
  summary += `Generated: ${new Date().toLocaleTimeString()}\n`
  summary += `\nNext Steps:\n`
  summary += `- Review form responses\n`
  summary += `- Review Granola notes\n`
  summary += `- Identify action items\n`
  summary += `- Send to stakeholders\n`

  return summary
}
