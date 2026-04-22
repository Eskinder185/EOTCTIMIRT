import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrganizerAnalytics, getAttendanceSummary, getRecapSuggestions } from '../lib/supabaseData'
import { Button } from '../components/ui/Button'
import type { OrganizerSnapshot, AttendanceSlice, RecapSuggestion } from '../data/types'

export function AdminResponsesDashboard() {
  const [analytics, setAnalytics] = useState<OrganizerSnapshot[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceSlice[]>([])
  const [recapSuggestions, setRecapSuggestions] = useState<RecapSuggestion[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (selectedWeek) {
      loadWeekSpecificData(selectedWeek)
    }
  }, [selectedWeek])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const analyticsData = await getOrganizerAnalytics()
      setAnalytics(analyticsData)
      
      // Auto-select the most recent week
      if (analyticsData.length > 0) {
        setSelectedWeek(analyticsData[0].weekId)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load response data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadWeekSpecificData = async (weekId: string) => {
    try {
      const [attendance, suggestions] = await Promise.all([
        getAttendanceSummary(weekId),
        getRecapSuggestions(weekId)
      ])
      setAttendanceData(attendance)
      setRecapSuggestions(suggestions)
    } catch (err) {
      console.error('Failed to load week-specific data:', err)
    }
  }

  const selectedWeekData = analytics.find(a => a.weekId === selectedWeek)

  const totalAttendanceIntentions = attendanceData.reduce((sum, item) => sum + item.value, 0)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading response analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Error</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadDashboardData}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Participant Responses Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor engagement, analyze feedback, and plan future sessions based on participant responses.
        </p>
      </div>

      {/* Week Selection */}
      {analytics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Week to Analyze
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {analytics.map((week) => (
                  <option key={week.weekId} value={week.weekId}>
                    {week.weekLabel} - {week.totalResponses} responses
                  </option>
                ))}
              </select>
            </div>
            
            {selectedWeek && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Selected Week</div>
                <div className="text-lg font-semibold text-gray-900">{selectedWeekData?.weekLabel}</div>
                <div className="text-sm text-gray-600">{selectedWeekData?.totalResponses} total responses</div>
              </div>
            )}
          </div>
        </div>
      )}

      {analytics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No response data yet
          </h3>
          <p className="text-gray-600 mb-4">
            Responses will appear here once participants start submitting answers to your weekly questions.
          </p>
          <Link to="/admin/weekly-classes">
            <Button>Create Your First Class</Button>
          </Link>
        </div>
      ) : selectedWeekData && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">📊</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedWeekData.totalResponses}
                  </div>
                  <div className="text-sm text-gray-600">Total Responses</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">✅</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedWeekData.reviewedOrWatched}
                  </div>
                  <div className="text-sm text-gray-600">Reviewed/Watched</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">❌</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedWeekData.missRatePercent}%
                  </div>
                  <div className="text-sm text-gray-600">Highest Miss Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">👥</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalAttendanceIntentions}
                  </div>
                  <div className="text-sm text-gray-600">Attendance Responses</div>
                </div>
              </div>
            </div>
          </div>

          {/* Most Missed Question */}
          {selectedWeekData.mostMissedQuestionId && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="text-red-500 text-xl mr-3">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-900 mb-2">
                    Most Challenging Question
                  </h3>
                  <p className="text-red-800 mb-2">
                    <strong>"{selectedWeekData.mostMissedQuestionLabel}"</strong> had a {selectedWeekData.missRatePercent}% miss rate.
                  </p>
                  <p className="text-red-700 text-sm">
                    Consider reviewing this topic in your next session or providing additional explanation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Breakdown */}
          {attendanceData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Attendance Intentions for Next Session
              </h3>
              <div className="space-y-3">
                {attendanceData.map((item) => {
                  const percentage = totalAttendanceIntentions > 0 
                    ? Math.round((item.value / totalAttendanceIntentions) * 100) 
                    : 0
                  
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{item.value}</span>
                        <span className="text-gray-500 text-sm ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Unclear Topics */}
          {selectedWeekData.topUnclearTopics.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-amber-900 mb-4">
                Topics Needing Clarification
              </h3>
              <div className="space-y-2">
                {selectedWeekData.topUnclearTopics.map((topic, index) => (
                  <div key={index} className="flex items-start space-x-2 text-amber-800">
                    <span className="text-amber-600">•</span>
                    <span>"{topic}"</span>
                  </div>
                ))}
              </div>
              <p className="text-amber-700 text-sm mt-3">
                These topics were mentioned in participant feedback as needing more explanation.
              </p>
            </div>
          )}

          {/* Language Difficulty */}
          {selectedWeekData.languageDifficultyAvg > 3.0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="text-blue-500 text-xl mr-3">🌐</div>
                <div>
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    Language Support Needed
                  </h3>
                  <p className="text-blue-800 mb-2">
                    Average language difficulty rating: <strong>{selectedWeekData.languageDifficultyAvg.toFixed(1)}/5</strong>
                  </p>
                  <p className="text-blue-700 text-sm">
                    Consider providing bilingual explanations or translation support during the session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recap Suggestions */}
          {recapSuggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                📋 Recap Suggestions for Next Session
              </h3>
              <div className="space-y-4">
                {recapSuggestions.map((suggestion, index) => (
                  <div key={index} className="border-l-4 border-amber-400 pl-4 py-2">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {suggestion.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {suggestion.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Weeks Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              All Weeks Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Highest Miss Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language Difficulty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.map((week) => (
                    <tr key={week.weekId} className={selectedWeek === week.weekId ? 'bg-amber-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {week.weekLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {week.totalResponses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {week.reviewedOrWatched}/{week.totalResponses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {week.missRatePercent}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {week.languageDifficultyAvg.toFixed(1)}/5
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}