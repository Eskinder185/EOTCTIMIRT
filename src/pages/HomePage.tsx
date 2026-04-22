import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import {
  CHURCH_FULL_NAME,
  TIMIRT_SCHEDULE_LABEL,
  TEACHER_INFO,
} from '../site/constants'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import { formatClassDate } from '../lib/formatDate'
import { useUiText } from '../lib/uiText'

function previewText(text: string, maxLength = 120) {
  const normalized = text.trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

export function HomePage() {
  const t = useUiText()
  const [recentClasses, setRecentClasses] = useState<WeeklyClass[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingTimirtPreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [weeks, upcomingPreview] = await Promise.all([listWeeks(), getUpcomingPreview()])
        setRecentClasses(weeks.slice(0, 3))
        setUpcoming(upcomingPreview)
      } catch (error) {
        console.error('Failed to load homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="bg-brand-100 h-4 w-32 rounded"></div>
            <div className="bg-brand-100 h-6 w-64 rounded"></div>
            <div className="bg-brand-100 h-4 w-48 rounded"></div>
          </div>
        </div>
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
              <div className="animate-pulse">
                <div className="bg-brand-100 h-12 w-full rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {CHURCH_FULL_NAME}
        </p>
        <h1 className="mt-1 text-xl font-bold text-brand-900">EOTC Timrit</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          A compact Ethiopian Orthodox Tewahedo Timirt hub for next Tuesday&apos;s class,
          recent summaries, weekly mezmurs, and parish support.
        </p>
        <div className="mt-3 flex flex-col gap-1 text-sm text-brand-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="flex flex-col">
              <span className="font-semibold">{t('nextClass')}</span>
              <span className="text-xs text-brand-700">
                {upcoming ? formatClassDate(upcoming.scheduledDate) : TIMIRT_SCHEDULE_LABEL}
              </span>
              <span className="text-brand-700">{TEACHER_INFO.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span>{TIMIRT_SCHEDULE_LABEL}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <RouterLinkButton to="/upcoming" className="h-14 text-sm font-semibold sm:text-base">
          📖 {t('nextClass')}
        </RouterLinkButton>
        <RouterLinkButton to="/past-timirit" variant="secondary" className="h-14 text-sm font-semibold sm:text-base">
          📚 {t('pastClasses')}
        </RouterLinkButton>
        <RouterLinkButton to="/mezmurs" variant="secondary" className="h-14 text-sm font-semibold sm:text-base">
          🎵 {t('upcomingMezmurs')}
        </RouterLinkButton>
        <RouterLinkButton to="/about" variant="secondary" className="h-14 text-sm font-semibold sm:text-base">
          ☦️ {t('about')}
        </RouterLinkButton>
        <a
          href="/orthodox-resources"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-base font-medium text-brand-900 shadow-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50"
        >
          ☦️ Orthodox Resources
        </a>
      </div>

      {upcoming ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {t('nextClass')}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-brand-900">{upcoming.topicPreview}</h2>
          <p className="mt-1 text-sm text-brand-700">{formatClassDate(upcoming.scheduledDate)}</p>
          <p className="mt-3 text-sm leading-relaxed text-brand-800">{upcoming.note}</p>
          <RouterLinkButton to="/upcoming" className="mt-4 w-full sm:w-auto">
            Prepare for Next Class
          </RouterLinkButton>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Past Classes
            </p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">Recent Timirit summaries</h2>
            <p className="mt-1 text-sm text-brand-700">
              Open a recent class to review the summary, mezmurs, and quick follow-up.
            </p>
          </div>
          <RouterLinkButton to="/past-timirit" variant="secondary" className="hidden sm:inline-flex">
            See all
          </RouterLinkButton>
        </div>
        <div className="mt-4 space-y-3">
          {recentClasses.map((week) => (
            <div key={week.id} className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
              <p className="text-xs font-semibold uppercase text-brand-700">
                {formatClassDate(week.date)}
              </p>
              <h3 className="mt-1 text-base font-semibold text-brand-900">{week.topic}</h3>
              <p className="mt-1 text-sm text-brand-700">{week.speaker}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-800">
                {previewText(week.englishSummary)}
              </p>
              <RouterLinkButton to={`/class/${week.id}`} variant="secondary" className="mt-3 w-full sm:w-auto">
                {t('viewSummary')}
              </RouterLinkButton>
            </div>
          ))}
        </div>
        <RouterLinkButton to="/past-timirit" variant="secondary" className="mt-4 w-full sm:hidden">
          See all past classes
        </RouterLinkButton>
      </Card>
    </div>
  )
}