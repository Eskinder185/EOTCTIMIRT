import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { useUiLanguage } from '../contexts/LanguageContext'
import { StructuredLessonContent } from '../components/StructuredLessonContent'
import { listWeeks } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'
import { useUiText } from '../lib/uiText'
import { displayWeeklyClassSpeaker, displayWeeklyClassTopic } from '../lib/weeklyClassDisplay'

const PAGE_SIZE = 8

function summaryPreview(text: string, maxLength = 170) {
  const normalized = text.trim()
  if (normalized.length <= maxLength) {
    return normalized
  }
  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

export function PastClassesPage() {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const [weeks, setWeeks] = useState<WeeklyClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const loadWeeks = async () => {
      try {
        setLoading(true)
        setError(null)
        setWeeks(await listWeeks())
      } catch (error) {
        console.error('Failed to load past weeks:', error)
        setWeeks([])
        setError('Could not load the class archive right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadWeeks()
  }, [])

  const teacherOptions = useMemo(
    () =>
      Array.from(new Set(weeks.map((week) => week.speaker.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [weeks],
  )

  const clearFilters = () => {
    setQuery('')
    setTopicFilter('')
    setTeacherFilter('')
    setFromDate('')
    setToDate('')
    setVisibleCount(PAGE_SIZE)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const topicQ = topicFilter.trim().toLowerCase()

    return weeks.filter(
      (w) => {
        const inGeneralSearch =
          !q ||
          w.topic.toLowerCase().includes(q) ||
          w.englishSummary.toLowerCase().includes(q) ||
          w.amharicSummary.toLowerCase().includes(q) ||
          w.speaker.toLowerCase().includes(q) ||
          w.keyPoints.some((point) => point.toLowerCase().includes(q)) ||
          (w.mainPoints ?? []).some((point) =>
            `${point.en ?? ''} ${point.am ?? ''}`.toLowerCase().includes(q),
          )

        const inTopicSearch = !topicQ || w.topic.toLowerCase().includes(topicQ)
        const inTeacher = !teacherFilter || w.speaker === teacherFilter
        const inFromDate = !fromDate || w.date >= fromDate
        const inToDate = !toDate || w.date <= toDate

        return inGeneralSearch && inTopicSearch && inTeacher && inFromDate && inToDate
      },
    )
  }, [query, topicFilter, teacherFilter, fromDate, toDate, weeks])

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMore = visibleItems.length < filtered.length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, topicFilter, teacherFilter, fromDate, toDate])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? 'ማህደር' : 'Archive'}
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          {isAm ? 'ያለፉ የትምህርት ክፍሎች' : 'Past Timirt Classes'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ያለፉ የትምህርት ክፍሎችን እንደ ማህደር ወይም እንደ ቤተ መጻሕፍት ይመልከቱ። በርእስ፣ በመምህር፣ በርዕሰ ጉዳይ ወይም በማጠቃለያ ቁልፍ ቃላት ይፈልጉ፤ ከዚያም እያንዳንዱን ክፍል ከትምህርቱ፣ ከሚዲያ እና ከዋና ነጥቦቹ ጋር ለመከለስ ይክፈቱ።'
            : 'Browse previous Timirt classes like a library. Search by title, teacher, topic, or summary keywords, then open each class to review the teaching, media, and key points.'}
        </p>
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-brand-900" htmlFor="search">
            {isAm ? 'የፍለጋ ቁልፍ ቃላት' : 'Search keywords'}
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAm ? 'ርእስ፣ መምህር፣ ርዕሰ ጉዳይ፣ ማጠቃለያ...' : 'Title, teacher, topic, summary...'}
              className="mt-2 w-full min-h-12 rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-900" htmlFor="topic-filter">
            {isAm ? 'የርዕሰ ጉዳይ ማጣሪያ' : 'Topic filter'}
            <input
              id="topic-filter"
              type="search"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              placeholder={isAm ? 'ተዋሕዶ፣ ይቅርታ...' : 'Theosis, Forgiveness...'}
              className="mt-2 w-full min-h-12 rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-900" htmlFor="teacher-filter">
            {isAm ? 'መምህር' : 'Teacher'}
            <select
              id="teacher-filter"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="mt-2 w-full min-h-12 rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            >
              <option value="">{isAm ? 'ሁሉም መምህራን' : 'All teachers'}</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-brand-900" htmlFor="from-date">
            {isAm ? 'ከቀን' : 'From date'}
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder={isAm ? 'ወወ/ቀቀ/ዓዓዓዓ' : 'MM/DD/YYYY'}
              className="mt-2 w-full min-h-12 rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-900" htmlFor="to-date">
            {isAm ? 'እስከ ቀን' : 'To date'}
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder={isAm ? 'ወወ/ቀቀ/ዓዓዓዓ' : 'MM/DD/YYYY'}
              className="mt-2 w-full min-h-12 rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-700">
            {isAm
              ? `${filtered.length} ${filtered.length === 1 ? 'ክፍል' : 'ክፍሎች'} በማሳየት ላይ`
              : `Showing ${filtered.length} ${filtered.length === 1 ? 'class' : 'classes'}`}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            {isAm ? 'ፍለጋን እና ማጣሪያዎችን ያጽዱ' : 'Clear search and filters'}
          </button>
        </div>
      </section>

      {loading ? (
        <Card>
          <p className="text-sm text-brand-800">Loading class archive...</p>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {!loading && !error && filtered.length === 0 ? (
          <Card>
            <p className="text-sm font-semibold text-brand-900">No matching classes found</p>
            <p className="mt-1 text-sm text-brand-700">
              Try a broader keyword, choose a different teacher, or clear your date filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Clear search and show all classes
            </button>
          </Card>
        ) : (
          visibleItems.map((week) => (
            <Card key={week.id}>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-700">
                    {formatClassDate(week.date)}
                  </p>
                  <h2 className="text-lg font-semibold text-brand-900">
                    {displayWeeklyClassTopic(week, language)}
                  </h2>
                  <p className="mt-1 text-sm text-brand-700">{displayWeeklyClassSpeaker(week, language)}</p>
                  <StructuredLessonContent
                    className="mt-2"
                    sectionTitle={isAm ? 'የማስተማር ማጠቃለያ' : 'Teaching recap'}
                    summaryLabel={isAm ? 'አጭር ማጠቃለያ' : 'Short summary'}
                    mainPointsLabel={isAm ? 'ዋና ነጥቦች' : 'Main points'}
                    summary={{
                      en: summaryPreview(week.englishSummary),
                      am: summaryPreview(week.amharicSummary),
                    }}
                    mainPoints={
                      week.mainPoints && week.mainPoints.length > 0
                        ? week.mainPoints.map((point) => ({
                            en: point.en ? summaryPreview(point.en, 90) : undefined,
                            am: point.am ? summaryPreview(point.am, 90) : undefined,
                          }))
                        : week.keyPoints.slice(0, 2).map((point) => ({ en: summaryPreview(point, 90) }))
                    }
                    compact
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <RouterLinkButton
                    to={`/class/${week.id}`}
                    variant="secondary"
                    className="w-full"
                  >
                    {t('viewSummary')}
                  </RouterLinkButton>
                  {week.audioUrl ? (
                    <a
                      href={week.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-accent-600 hover:bg-brand-50"
                    >
                      Listen
                    </a>
                  ) : null}
                  {week.youtubeUrl ? (
                    <a
                      href={week.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-accent-600 hover:bg-brand-50"
                    >
                      Watch
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {!loading && !error && hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Load more classes
          </button>
        </div>
      ) : null}
    </div>
  )
}
