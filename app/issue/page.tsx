'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function ReportIssuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'product',
    description: '',
    exampleTask: '',
    expectedBehaviour: '',
    actualBehaviour: '',
    impact: 'delayed',
    frequency: 'first_time',
    workaround: '',
    suggestedOwner: '',
    urgency: 'weekly_review',
    containmentNote: '',
    reportedBy: '',
    team: 'default',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const issue = await res.json()
        router.push(`/?success=true&issueId=${issue.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const showContainmentNote = formData.urgency === 'immediate'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Report a New Issue</h1>

      {showContainmentNote && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Immediate Issue Flagged</p>
            <p className="text-sm text-red-800 mt-1">
              Send this to the responsible Ops/Product owner now. The tracker does not replace urgent escalation.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Required Fields */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Required Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Task marked in progress after completion"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="product">Product</option>
                  <option value="experience">Experience</option>
                  <option value="process">Process</option>
                  <option value="training">Training</option>
                  <option value="qa">QA</option>
                  <option value="customer">Customer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What Happened? *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Describe the issue clearly"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Impact *</label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="blocked">Blocked task</option>
                  <option value="delayed">Delayed task</option>
                  <option value="extra_effort">Extra effort or repeated work</option>
                  <option value="customer_impact">Customer impact</option>
                  <option value="safety_risk">Safety, privacy, payment, or fraud risk</option>
                  <option value="workable">Confusing but workable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="first_time">First time</option>
                  <option value="same_faffer">Repeated by the same Faffer</option>
                  <option value="multiple_faffers">Affecting multiple Faffers</option>
                  <option value="recurring">Recurring across shifts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="immediate">Immediate (needs urgent escalation)</option>
                <option value="same_day">Same day</option>
                <option value="weekly_review">Weekly review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Containment Note for Immediate Issues */}
        {showContainmentNote && (
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Containment Details</h2>
            <textarea
              name="containmentNote"
              value={formData.containmentNote}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              placeholder="What is affected? How many people? What is the risk? What immediate action was taken?"
              required={showContainmentNote}
            />
          </div>
        )}

        {/* Optional Fields */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Additional Details (Optional)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Example Task ID or Link</label>
              <input
                type="text"
                name="exampleTask"
                value={formData.exampleTask}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Behaviour</label>
                <textarea
                  name="expectedBehaviour"
                  value={formData.expectedBehaviour}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actual Behaviour</label>
                <textarea
                  name="actualBehaviour"
                  value={formData.actualBehaviour}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Immediate Workaround</label>
              <textarea
                name="workaround"
                value={formData.workaround}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Owner</label>
              <select
                name="suggestedOwner"
                value={formData.suggestedOwner}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select owner...</option>
                <option value="product">Product</option>
                <option value="engineering">Engineering</option>
                <option value="ops">Ops</option>
                <option value="qa">QA</option>
                <option value="training">Training</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Report Issue'}
          </button>
        </div>
      </form>
    </div>
  )
}
