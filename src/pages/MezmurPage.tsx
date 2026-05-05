import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MezmurActionCard } from '../components/MezmurActionCard'
import { Card } from '../components/ui/Card'
import { useUiLanguage } from '../contexts/LanguageContext'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type { Mezmur, WeeklyClass } from '../data/types'
import { displayBilingualLine } from '../lib/localizedText'
import { formatClassDate } from '../lib/formatDate'
import { useUiText } from '../lib/uiText'

export function MezmurPage() {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
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

  const placeholderMezmur = (slot: 1 | 2): Mezmur => ({
    title: isAm
      ? slot === 1
        ? 'መዝሙር 1 በቅርቡ ይገለጻል'
        : 'መዝሙር 2 በቅርቡ ይገለጻል'
      : slot === 1
        ? 'Mezmur 1 will be announced soon'
        : 'Mezmur 2 will be announced soon',
  })

  const upcomingMezmurs: [Mezmur, Mezmur] = useMemo(
    () => [
      upcoming?.mezmurs[0] ?? placeholderMezmur(1),
      upcoming?.mezmurs[1] ?? placeholderMezmur(2),
    ],
    [upcoming],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'መዝሙር' : 'Mezmurs'}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
          {isAm
            ? 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ መዝሙሮች'
            : 'Ethiopian Orthodox Tewahedo Mezmurs'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ሳምንታዊ ለክፍል ዝግጅት፣ ለማዳመጥ እና ለልምምድ የተዘጋጁ የመዝሙር ምርጫዎች።'
            : 'Weekly Mezmur selections for class preparation, listening, and practice.'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ለሚቀጥለው ክፍል እና ለባለፈው ሳምንት የተመረጡ መዝሙሮችን ይመልከቱ፤ ሲገኝ በዩቲዩብ ይመልከቱ፣ እንዲሁም አስተባባሪዎች ከሰጡት አገናኝ የላቀ ልምምድ ይጠቀሙ።'
            : 'View the mezmurs for the upcoming class and the previous week, open YouTube when available, and use Advanced practice when organizers share this week’s link.'}
        </p>
        <div className="mt-4">
          <Link
            to="/upcoming-mezmurs?mode=present"
            className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent-600 px-6 py-3 text-base font-bold text-white shadow-md shadow-accent-700/30 transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 sm:w-auto"
          >
            {t('presentationMode')}
          </Link>
          <p className="mt-2 text-sm text-brand-600">
            {isAm
              ? 'ለፕሮጀክተር ተስማሚ የሆኑ የመዝሙር ግጥሞች ከስላይድ መቆጣጠሪያዎች ጋር።'
              : 'Projector-friendly lyrics with slide controls.'}
          </p>
        </div>
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? 'የሚቀጥለው ክፍል' : 'Upcoming Class'}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">
          {isAm ? 'የሚቀጥሉ መዝሙሮች' : 'Upcoming Mezmurs'}
        </h2>
        <p className="mt-1 text-sm text-brand-700">
          {upcoming?.scheduledDate
            ? formatClassDate(upcoming.scheduledDate, language)
            : isAm
              ? 'የሚቀጥለው ትምህርት'
              : 'Upcoming Timirt'}
        </p>
        {upcoming &&
        displayBilingualLine(language, upcoming.topicPreviewEn, upcoming.topicPreviewAm, upcoming.topicPreview).trim() ? (
          <p className="mt-1 text-sm leading-relaxed text-brand-700">
            {displayBilingualLine(language, upcoming.topicPreviewEn, upcoming.topicPreviewAm, upcoming.topicPreview)}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          <MezmurActionCard
            slot={1}
            mezmur={upcomingMezmurs[0]}
            context="upcoming"
            advancedPracticeUrl={upcoming?.advancedPracticeUrl}
          />
          <MezmurActionCard slot={2} mezmur={upcomingMezmurs[1]} context="upcoming" hideAdvancedPractice />
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? 'የቅርብ ጊዜ ክፍል' : 'Recent Class'}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">
          {isAm ? 'ያለፈው ሳምንት መዝሙሮች' : 'Last Week’s Mezmurs'}
        </h2>
        {loading ? (
          <p className="mt-2 text-sm text-brand-700">{t('loading')}</p>
        ) : lastWeek ? (
          <div className="mt-2 space-y-3">
            <p className="text-sm text-brand-700">
              <span className="font-medium text-brand-900">{formatClassDate(lastWeek.date, language)}</span>
              <span className="text-brand-500"> · </span>
              {lastWeek.topic}
            </p>
            <MezmurActionCard slot={1} mezmur={lastWeek.mezmurs[0]} context="last-week" hideAdvancedPractice />
            <MezmurActionCard slot={2} mezmur={lastWeek.mezmurs[1]} context="last-week" hideAdvancedPractice />
          </div>
        ) : (
          <p className="mt-2 text-sm text-brand-700">
            {isAm ? 'የቅርብ ጊዜ የመዝሙር መረጃ እስካሁን አልተገኘም።' : 'No recent mezmur record is available yet.'}
          </p>
        )}
      </Card>
    </div>
  )
}
