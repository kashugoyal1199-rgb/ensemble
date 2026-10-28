import { ShiftCheckIn, Issue } from './types'
import { formatDate } from './utils'

export function generateDailyDigest(
  shift: ShiftCheckIn,
  issues: Issue[],
  date: string
): string {
  const lines: string[] = []

  lines.push(`TL digest — ${formatDate(date)} — ${shift.shift}`)
  lines.push('')

  // Completion status
  if (shift.noActionableFeedback) {
    lines.push('Completed / no issue:')
    lines.push('- No actionable feedback from this shift')
    lines.push('')
  }

  // New issues from this shift
  const shiftIssues = issues.filter(i => i.checkInId === shift.id)
  if (shiftIssues.length > 0) {
    lines.push('New issues:')
    shiftIssues.forEach(issue => {
      lines.push(`- ${issue.id} ${issue.title} — ${issue.impact} — ${issue.frequency} — ${issue.suggestedOwner || 'Unassigned'}`)
    })
    lines.push('')
  }

  // Urgent escalations
  const urgentIssues = shiftIssues.filter(i => i.urgency === 'immediate')
  if (urgentIssues.length > 0) {
    lines.push('Urgent escalations:')
    urgentIssues.forEach(issue => {
      lines.push(`- ${issue.id} ${issue.title} — ${issue.impact} — ${issue.containmentNote || 'See full issue'}`)
    })
    lines.push('')
  }

  // Workarounds and changes
  const withWorkarounds = shiftIssues.filter(i => i.workaround)
  if (withWorkarounds.length > 0 || shift.handoverNote) {
    lines.push('Workarounds or changes to brief tomorrow:')
    if (shift.handoverNote) {
      lines.push(`- ${shift.handoverNote}`)
    }
    withWorkarounds.forEach(issue => {
      lines.push(`- [${issue.id}] ${issue.workaround}`)
    })
    lines.push('')
  }

  // Open handovers
  const openIssues = shiftIssues.filter(i => !['resolved', 'wont_fix'].includes(i.status))
  if (openIssues.length > 0) {
    lines.push('Open handovers:')
    openIssues.forEach(issue => {
      lines.push(`- ${issue.id} — ${issue.title} — ${issue.currentOwner || 'Unassigned'} — ${issue.status}`)
    })
  }

  return lines.join('\n')
}
