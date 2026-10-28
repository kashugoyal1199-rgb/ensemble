export type IssueStatus = 'new' | 'acknowledged' | 'in_progress' | 'workaround_shared' | 'resolved' | 'wont_fix'
export type IssueCategory = 'product' | 'experience' | 'process' | 'training' | 'qa' | 'customer' | 'other'
export type ImpactLevel = 'blocked' | 'delayed' | 'extra_effort' | 'customer_impact' | 'safety_risk' | 'workable'
export type Frequency = 'first_time' | 'same_faffer' | 'multiple_faffers' | 'recurring'
export type Urgency = 'immediate' | 'same_day' | 'weekly_review'

export interface ShiftCheckIn {
  id: string
  date: string
  shift: string
  tlName: string
  team: string
  scheduledCount: number
  presentCount: number
  capacityNote?: string
  processChangesShared: boolean
  bugsShared: boolean
  previousIssuesReviewed: boolean
  feedbackRoundCompleted: boolean
  noActionableFeedback: boolean
  handoverNote?: string
  submittedAt: string
}

export interface Issue {
  id: string
  checkInId?: string
  title: string
  category: IssueCategory
  description: string
  exampleTask?: string
  expectedBehaviour?: string
  actualBehaviour?: string
  impact: ImpactLevel
  frequency: Frequency
  workaround?: string
  suggestedOwner?: string
  urgency: Urgency
  containmentNote?: string
  currentOwner?: string
  status: IssueStatus
  resolution?: string
  reportedAt: string
  reportedBy: string
  team: string
  acknowledgedAt?: string
  closedAt?: string
  reopened: boolean
}

export interface IssueUpdate {
  id: string
  issueId: string
  author: string
  updateType: 'acknowledged' | 'assigned' | 'status_changed' | 'resolution_added' | 'comment'
  body: string
  createdAt: string
}
