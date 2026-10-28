import { ShiftCheckIn, Issue, IssueUpdate } from './types'

// Global in-memory database for MVP
class InMemoryDB {
  private shifts: ShiftCheckIn[] = []
  private issues: Issue[] = []
  private updates: IssueUpdate[] = []

  // Shift Check-ins
  createShift = (shift: ShiftCheckIn) => {
    this.shifts.push(shift)
    return shift
  }

  getShifts = () => [...this.shifts]

  getShiftById = (id: string) => this.shifts.find(s => s.id === id)

  // Issues
  createIssue = (issue: Issue) => {
    console.log('[DB] Creating issue:', issue.id, issue.title)
    this.issues.push(issue)
    console.log('[DB] Issues now:', this.issues.length)
    return issue
  }

  getIssues = () => {
    console.log('[DB] Getting issues:', this.issues.length)
    return [...this.issues]
  }

  getIssueById = (id: string) => this.issues.find(i => i.id === id)

  updateIssue = (id: string, updates: Partial<Issue>) => {
    const issue = this.issues.find(i => i.id === id)
    if (issue) {
      Object.assign(issue, updates)
    }
    return issue
  }

  getIssuesByTeam = (team: string) => this.issues.filter(i => i.team === team)

  getOpenIssues = () => this.issues.filter(i => !['resolved', 'wont_fix'].includes(i.status))

  getIssuesByStatus = (status: string) => this.issues.filter(i => i.status === status)

  // Issue Updates
  addUpdate = (update: IssueUpdate) => {
    this.updates.push(update)
    return update
  }

  getUpdatesByIssue = (issueId: string) => this.updates.filter(u => u.issueId === issueId)
}

// Single instance to persist across requests
let db: InMemoryDB | null = null

function getDB(): InMemoryDB {
  if (!db) {
    db = new InMemoryDB()
  }
  return db
}

export const storage = {
  createShift: (shift: ShiftCheckIn) => getDB().createShift(shift),
  getShifts: () => getDB().getShifts(),
  getShiftById: (id: string) => getDB().getShiftById(id),
  createIssue: (issue: Issue) => getDB().createIssue(issue),
  getIssues: () => getDB().getIssues(),
  getIssueById: (id: string) => getDB().getIssueById(id),
  updateIssue: (id: string, updates: Partial<Issue>) => getDB().updateIssue(id, updates),
  getIssuesByTeam: (team: string) => getDB().getIssuesByTeam(team),
  getOpenIssues: () => getDB().getOpenIssues(),
  getIssuesByStatus: (status: string) => getDB().getIssuesByStatus(status),
  addUpdate: (update: IssueUpdate) => getDB().addUpdate(update),
  getUpdatesByIssue: (issueId: string) => getDB().getUpdatesByIssue(issueId),
}

export default storage
