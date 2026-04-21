import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { TewahedoDailyPanel } from '../components/TewahedoDailyPanel'
import { listWeeks } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'

export function MezmurPage() {
  const [weeks, setWeeks] = useState<WeeklyClass[]>([])

  useEffect(() => {
    const loadWeeks = async () => {
      try {
        setWeeks(await listWeeks())
      } catch (error) {
        console.error('Failed to load mezmur weeks:', error)
        setWeeks([])
      }
    }

    loadWeeks()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Weekly mezmur hub
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Weekly mezmurs</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          The two hymns prepared before each Tuesday Timirit. This page stays focused on the
          current weekly mezmurs, with a few optional support links below when extra practice is needed.
        </p>
      </div>

      <Card>
        <p className="text-sm font-semibold text-brand-900">How to use this page</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Review the two weekly mezmurs here first. If one hymn needs extra help, the card buttons
          and the small support section below can be used as references.
        </p>
      </Card>

      <div className="space-y-3">
        {weeks.map((week) => (
          <Card key={week.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-700">
                  {formatClassDate(week.date)}
                </p>
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
                {week.mezmurs[0].lyrics ? (
                  <p className="mt-2 max-h-16 overflow-hidden text-xs leading-relaxed text-brand-700">
                    {week.mezmurs[0].lyrics}
                  </p>
                ) : null}
              </div>
              <Link
                to={`/class/${week.id}#mezmur-heading`}
                className="text-sm font-semibold text-accent-600 underline-offset-4 hover:underline sm:self-center"
              >
                Open weekly Timirit
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <TewahedoDailyPanel />
    </div>
  )
}
