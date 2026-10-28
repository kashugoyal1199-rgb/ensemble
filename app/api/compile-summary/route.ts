import { NextRequest, NextResponse } from 'next/server'
import { readJson, validateUrl } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  const errors: Record<string, string> = {}
  const list = (key: 'forms' | 'notes') => {
    const raw = typeof body === 'object' && body ? (body as Record<string, unknown>)[key] : undefined
    if (raw === undefined) return []
    if (!Array.isArray(raw) || raw.length > 50) {
      errors[key] = 'Must be a list of at most 50 items'
      return []
    }
    const out: Array<{ id: string; url: string }> = []
    for (const item of raw) {
      const id = typeof item?.id === 'string' ? item.id.slice(0, 100) : ''
      const url = validateUrl(typeof item?.url === 'string' ? item.url : '')
      if (!id || !url.ok) {
        errors[key] = 'Each item needs an id and a valid https link'
        break
      }
      out.push({ id, url: url.value })
    }
    return out
  }
  const forms = list('forms')
  const notes = list('notes')
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Validation failed', fields: errors }, { status: 400 })
  }

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
