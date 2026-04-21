import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { TimirtWeekPageContent } from '../components/timirt/TimirtWeekPageContent'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { getWeekById } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'

export function ClassPage() {
  const { id } = useParams()
  const [week, setWeek] = useState<WeeklyClass | undefined | null>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setWeek(null)
      setLoading(false)
      return
    }

    const loadWeek = async () => {
      try {
        setLoading(true)
        const weekData = await getWeekById(id)
        setWeek(weekData || null)
      } catch (error) {
        console.error('Failed to load week:', error)
        setWeek(null)
      } finally {
        setLoading(false)
      }
    }

    loadWeek()
  }, [id])

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
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-brand-900">Timirit not found</h1>
        <p className="text-sm leading-relaxed text-brand-700">
          That week is not yet published in the parish archive.
        </p>
        <RouterLinkButton to="/classes" variant="secondary">
          Browse past Timirit sessions
        </RouterLinkButton>
      </div>
    )
  }

  return <TimirtWeekPageContent week={week} />
}
