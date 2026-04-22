import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { TewahedoDailyPanel } from '../components/TewahedoDailyPanel'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type { WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'

export function MezmurPage() {
  const [weeks, setWeeks] = useState<WeeklyClass[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingTimirtPreview | null>(null)

  useEffect(() => {
    const loadWeeks = async () => {
      try {
        const [weeklyClasses, upcomingPreview] = await Promise.all([
          listWeeks(),
          getUpcomingPreview(),
        ])
        setWeeks(weeklyClasses.slice(0, 6))
        setUpcoming(upcomingPreview)
      } catch (error) {
        console.error('Failed to load mezmur weeks:', error)
        setWeeks([])
        setUpcoming(null)
      }
    }

    loadWeeks()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Mezmur archive
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Recent weekly mezmurs</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          A light archive of the mezmurs connected to each Timirit class. For deeper practice,
          calendar, and other Orthodox references, continue to Tewahedo Daily.
        </p>
      </div>

      <Card>
        <p className="text-sm font-semibold text-brand-900">How to use this page</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Use this page as a simple index of recent weekly mezmurs and open the related class
          page for the full summary and catch-up context.
        </p>
      </Card>

      {upcoming ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Next class</p>
          <h2 className="mt-1 text-lg font-semibold text-brand-900">Upcoming mezmur titles</h2>
          <div className="mt-3 space-y-3">
            {upcoming.mezmurs.map((mezmur, index) => (
              <div key={`${mezmur.title}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                <p className="text-xs font-semibold uppercase text-brand-700">Mezmur {index + 1}</p>
                <p className="mt-1 text-base font-semibold text-brand-900">{mezmur.title || 'To be announced'}</p>
                <p className="mt-1 text-sm italic text-brand-700">
                  {mezmur.transliteration || 'To be announced'}
                </p>
              </div>
            ))}
          </div>
          <Link
            to="/upcoming"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent-600 underline-offset-4 hover:underline"
          >
            Open next class preparation
          </Link>
        </Card>
      ) : null}

      <div className="space-y-3">
        {weeks.map((week) => (
          <Card key={week.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-700">
                  {formatClassDate(week.date)}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-900">{week.topic}</p>
                <p className="mt-1 text-sm text-brand-800">
                  <span className="font-semibold text-brand-900">Mezmur 1:</span>{' '}
                  {week.mezmurs[0].title}
                </p>
                {week.mezmurs[0].transliteration ? (
                  <p className="text-xs italic text-brand-600">{week.mezmurs[0].transliteration}</p>
                ) : null}
                <p className="mt-2 text-sm text-brand-800">
                  <span className="font-semibold text-brand-900">Mezmur 2:</span>{' '}
                  {week.mezmurs[1].title}
                </p>
                {week.mezmurs[1].transliteration ? (
                  <p className="text-xs italic text-brand-600">{week.mezmurs[1].transliteration}</p>
                ) : null}
              </div>
              <Link
                to={`/class/${week.id}#mezmur-heading`}
                className="text-sm font-semibold text-accent-600 underline-offset-4 hover:underline sm:self-center"
              >
                Open class summary
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <TewahedoDailyPanel />
    </div>
  )
}
