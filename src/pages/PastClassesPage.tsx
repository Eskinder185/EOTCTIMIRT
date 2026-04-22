import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { listWeeks } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'

export function PastClassesPage() {
  const [weeks, setWeeks] = useState<WeeklyClass[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const loadWeeks = async () => {
      try {
        setWeeks(await listWeeks())
      } catch (error) {
        console.error('Failed to load past weeks:', error)
        setWeeks([])
      }
    }

    loadWeeks()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return weeks
    return weeks.filter(
      (w) =>
        w.topic.toLowerCase().includes(q) ||
        w.englishSummary.toLowerCase().includes(q) ||
        w.speaker.toLowerCase().includes(q),
    )
  }, [query, weeks])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Archive
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Past Timirit classes</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Browse recent classes in descending order and open each summary page to catch up
          with the teaching, mezmurs, and quick review.
        </p>
      </div>

      <label className="block text-sm font-semibold text-brand-900" htmlFor="search">
        Search by topic or teacher
      </label>
      <input
        id="search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Example: theosis, shepherd…"
        className="mt-1 w-full min-h-12 rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-brand-800">No sessions match that search yet.</p>
          </Card>
        ) : (
          filtered.map((week) => (
            <Card key={week.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-700">
                    {formatClassDate(week.date)}
                  </p>
                  <h2 className="text-lg font-semibold text-brand-900">{week.topic}</h2>
                  <p className="mt-1 text-sm text-brand-700">{week.speaker}</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-800">
                    {week.englishSummary.length > 160
                      ? `${week.englishSummary.slice(0, 160).trimEnd()}...`
                      : week.englishSummary}
                  </p>
                </div>
                <RouterLinkButton
                  to={`/class/${week.id}`}
                  variant="secondary"
                  className="w-full sm:w-auto sm:self-center"
                >
                  View Summary
                </RouterLinkButton>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
