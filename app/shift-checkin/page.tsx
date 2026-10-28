'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ShiftCheckinPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    tlName: '',
    team: 'default',
    scheduledCount: 0,
    presentCount: 0,
    capacityNote: '',
    processChangesShared: false,
    bugsShared: false,
    previousIssuesReviewed: false,
    feedbackRoundCompleted: false,
    noActionableFeedback: false,
    handoverNote: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      setStep(2)
      return
    }

    if (step === 2 && !formData.noActionableFeedback) {
      setStep(3)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/?success=true')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shift Check-in</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Step 1: Shift Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 1: Shift Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  name="tlName"
                  value={formData.tlName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="default">Default Team</option>
                  <option value="ops">Ops</option>
                  <option value="tech">Tech</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Faffers</label>
                <input
                  type="number"
                  name="scheduledCount"
                  value={formData.scheduledCount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Present Faffers</label>
                <input
                  type="number"
                  name="presentCount"
                  value={formData.presentCount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity Note (optional)</label>
              <textarea
                name="capacityNote"
                value={formData.capacityNote}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Step 2: Huddle Confirmation */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 2: Huddle Confirmation</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="processChangesShared"
                  checked={formData.processChangesShared}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-700">Process changes communicated</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="bugsShared"
                  checked={formData.bugsShared}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-700">Known bugs and workarounds communicated</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="previousIssuesReviewed"
                  checked={formData.previousIssuesReviewed}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-700">Previous unresolved issues reviewed</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="feedbackRoundCompleted"
                  checked={formData.feedbackRoundCompleted}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-700">Every Faffer had opportunity to report friction</span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="font-medium text-blue-900 mb-3">Did anything need to be recorded today?</p>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="noActionableFeedback"
                    checked={formData.noActionableFeedback}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-3 text-gray-700">No actionable feedback</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Handover */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 3: Handover</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What should the next shift know?</label>
              <textarea
                name="handoverNote"
                value={formData.handoverNote}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 pt-6 border-t">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded hover:bg-gray-300"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {step === 3 ? (loading ? 'Submitting...' : 'Submit Check-in') : 'Next'}
          </button>
        </div>
      </form>
    </div>
  )
}
