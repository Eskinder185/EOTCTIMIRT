import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteWeeklyClass, getCachedWeeklyClasses, getWeeklyClasses } from '../lib/supabaseData'
import { formatUnknownError } from '../lib/formatError'
import { Button } from '../components/ui/Button'
import type { WeeklyClass } from '../data/types'

export function AdminWeeklyClasses() {
  const [classes, setClasses] = useState<WeeklyClass[]>(() => getCachedWeeklyClasses() ?? [])
  const [loading, setLoading] = useState(classes.length === 0)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      if (classes.length === 0) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      setError(null)
      const data = await getWeeklyClasses()
      setClasses(data)
    } catch (err) {
      console.error('Failed to load classes:', err)
      setError(`Failed to load weekly classes. ${formatUnknownError(err)}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeleteClass = async (weeklyClass: WeeklyClass) => {
    const confirmed = window.confirm(
      `Delete class "${weeklyClass.topic}" (${formatDate(weeklyClass.date)})?\n\nThis will permanently remove the class, mezmurs, questions, and related responses.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingClassId(weeklyClass.id)
      setError(null)
      await deleteWeeklyClass(weeklyClass.id)
      setClasses((current) => current.filter((item) => item.id !== weeklyClass.id))
    } catch (err) {
      console.error('Failed to delete weekly class:', err)
      setError(`Failed to delete class. ${formatUnknownError(err)}`)
    } finally {
      setDeletingClassId(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading weekly classes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Error</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadClasses}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Classes</h1>
          <p className="text-gray-600 mt-1">
            Manage Timirit weekly session content
          </p>
          {refreshing ? <p className="text-xs text-gray-500 mt-1">Refreshing...</p> : null}
        </div>
        <Link to="/admin/weekly-classes/new">
          <Button>➕ Create New Class</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
          <div className="text-sm text-gray-600">Total Classes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">
            {classes.filter(c => c.youtubeUrl).length}
          </div>
          <div className="text-sm text-gray-600">With Videos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">
            {classes.reduce((sum, c) => sum + c.questions.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Questions</div>
        </div>
      </div>

      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No weekly classes yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first weekly Timirit session to get started.
          </p>
          <Link to="/admin/weekly-classes/new">
            <Button>Create First Class</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Classes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {classes.map((weeklyClass) => (
              <div key={weeklyClass.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-500">
                        {formatDate(weeklyClass.date)}
                      </div>
                      <div className="text-sm text-gray-400">•</div>
                      <div className="text-sm text-gray-600">
                        {weeklyClass.speaker}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-1 mb-2">
                      {weeklyClass.topic}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {weeklyClass.questions.length} questions
                      </span>
                      <span>•</span>
                      <span>
                        {weeklyClass.mezmurs.length} mezmurs
                      </span>
                      {weeklyClass.youtubeUrl && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">📹 Video</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link to={`/admin/weekly-classes/${weeklyClass.id}`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                    <Link 
                      to={`/class/${weeklyClass.id}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary">Preview</Button>
                    </Link>
                    <Button
                      variant="secondary"
                      onClick={() => handleDeleteClass(weeklyClass)}
                      disabled={deletingClassId === weeklyClass.id}
                    >
                      {deletingClassId === weeklyClass.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}