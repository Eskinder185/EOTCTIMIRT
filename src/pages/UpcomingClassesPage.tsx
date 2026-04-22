import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { listActiveUpcomingTimirit, type UpcomingTimirtListItem } from '../lib/supabaseData'
import { formatClassDate } from '../lib/formatDate'

export function UpcomingClassesPage() {
  const [items, setItems] = useState<UpcomingTimirtListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setItems(await listActiveUpcomingTimirit())
      } catch (error) {
        console.error('Failed to load upcoming classes list:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-brand-700">Loading upcoming classes...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Upcoming classes</p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Upcoming Timirt Schedule</h1>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-700">No upcoming class has been published yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {formatClassDate(item.scheduledDate)}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-brand-900">{item.topicPreview}</h2>
              <p className="mt-2 text-sm text-brand-700">{item.note}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
