import { useEffect, useState } from 'react'
import { TimirtWeekPageContent } from '../components/timirt/TimirtWeekPageContent'
import { getCurrentWeek } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'

/** Canonical entry for “this Tuesday” — stable URL to share in Telegram. */
export function ThisWeekPage() {
  const [week, setWeek] = useState<WeeklyClass | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWeek = async () => {
      try {
        setLoading(true)
        setWeek(await getCurrentWeek())
      } catch (error) {
        console.error('Failed to load current week:', error)
        setWeek(null)
      } finally {
        setLoading(false)
      }
    }

    loadWeek()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-brand-100 h-8 w-64 rounded"></div>
        <div className="animate-pulse bg-brand-100 h-4 w-96 rounded"></div>
        <div className="animate-pulse bg-brand-100 h-32 w-full rounded"></div>
      </div>
    )
  }

  if (!week) {
    return null
  }

  return <TimirtWeekPageContent week={week} />
}
