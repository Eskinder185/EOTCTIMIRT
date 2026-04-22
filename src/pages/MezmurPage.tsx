import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type { WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'
import { useUiText } from '../lib/uiText'

export function MezmurPage() {
  const t = useUiText()
  const [weeks, setWeeks] = useState<WeeklyClass[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingTimirtPreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWeeks = async () => {
      try {
        setLoading(true)
        const [weeklyClasses, upcomingPreview] = await Promise.all([
          listWeeks(),
          getUpcomingPreview(),
        ])
        setWeeks(weeklyClasses)
        setUpcoming(upcomingPreview)
      } catch (error) {
        console.error('Failed to load mezmur weeks:', error)
        setWeeks([])
        setUpcoming(null)
      } finally {
        setLoading(false)
      }
    }

    loadWeeks()
  }, [])

  const lastWeek = useMemo(() => {
    if (!weeks.length) {
      return null
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
      weeks.find((week) => {
        const classDate = new Date(week.date)
        return !Number.isNaN(classDate.getTime()) && classDate < today
      }) ?? weeks[0]
    )
  }, [weeks])

  const upcomingMezmurs = useMemo(
    () => [
      upcoming?.mezmurs[0] ?? { title: 'Mezmur 1 will be announced soon' },
      upcoming?.mezmurs[1] ?? { title: 'Mezmur 2 will be announced soon' },
    ],
    [upcoming],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Ethiopian Orthodox Tewahedo Mezmurs
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">Weekly Mezmurs</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Prepare for the coming Timirt with the upcoming mezmur titles, then quickly review the
          most recent class mezmurs.
        </p>
        <Link
          to="/upcoming-mezmurs?mode=present"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-600 px-4 py-2 text-base font-semibold text-white shadow-sm hover:opacity-95"
        >
          {t('presentationMode')}
        </Link>
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Upcoming class</p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">Upcoming two mezmurs</h2>
        <p className="mt-1 text-sm text-brand-700">
          {upcoming?.scheduledDate ? formatClassDate(upcoming.scheduledDate) : 'Upcoming Timirt'}
        </p>
        {upcoming?.topicPreview ? (
          <p className="mt-1 text-sm leading-relaxed text-brand-700">{upcoming.topicPreview}</p>
        ) : null}
        <div className="mt-3 space-y-3">
          {upcomingMezmurs.map((mezmur, index) => (
            <div key={`${mezmur.title}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-xs font-semibold uppercase text-brand-700">Mezmur {index + 1}</p>
              <p className="mt-1 text-base font-semibold text-brand-900">{mezmur.title || 'To be announced'}</p>
              {mezmur.transliteration ? (
                <p className="mt-1 text-sm italic text-brand-700">{mezmur.transliteration}</p>
              ) : null}
              <a
                href={mezmur.youtubeUrl || 'https://tewahedodaily.pages.dev/practice'}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
              >
                {mezmur.youtubeUrl ? t('openYouTube') : t('openPractice')}
              </a>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Last week</p>
        <h2 className="mt-1 text-base font-semibold text-brand-900">Most recent class mezmurs</h2>
        {loading ? (
          <p className="mt-2 text-sm text-brand-700">{t('loading')}</p>
        ) : lastWeek ? (
          <div className="mt-2 space-y-2 text-sm">
            <p className="text-brand-700">
              {formatClassDate(lastWeek.date)} - {lastWeek.topic}
            </p>
            <p className="text-brand-900">
              <span className="font-semibold">Mezmur 1:</span> {lastWeek.mezmurs[0].title}
            </p>
            <p className="text-brand-900">
              <span className="font-semibold">Mezmur 2:</span> {lastWeek.mezmurs[1].title}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-brand-700">No recent mezmur record is available yet.</p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Preparation links</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <a
            href="https://tewahedodaily.pages.dev/practice"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            {t('mezmurPractice')}
          </a>
          <a
            href="https://tewahedodaily.pages.dev/calendar"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            {t('calendar')}
          </a>
          <a
            href="https://tewahedodaily.pages.dev/prayers"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            {t('prayer')}
          </a>
        </div>
      </Card>
    </div>
  )
}
