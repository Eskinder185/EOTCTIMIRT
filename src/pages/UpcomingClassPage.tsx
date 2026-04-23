import { useEffect, useMemo, useState } from 'react'
import { WeeklyKnowledgeCard } from '../components/WeeklyKnowledgeCard'
import { TeacherYoutubeChannelCard } from '../components/TeacherYoutubeChannelCard'
import { LessonAudioBlock } from '../components/LessonAudioBlock'
import { StructuredLessonContent } from '../components/StructuredLessonContent'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type { WeeklyClass } from '../data/types'
import type { WeeklyKnowledgeItem } from '../data/weeklyKnowledge'
import { formatClassDate } from '../lib/formatDate'
import { getActiveWeeklyKnowledge } from '../lib/supabaseData'
import { toYouTubeEmbedUrl } from '../lib/youtube'
import { useUiText } from '../lib/uiText'

export function UpcomingClassPage() {
  const t = useUiText()
  const [upcoming, setUpcoming] = useState<UpcomingTimirtPreview | null>(null)
  const [weeklyKnowledge, setWeeklyKnowledge] = useState<WeeklyKnowledgeItem | null>(null)
  const [lastClass, setLastClass] = useState<WeeklyClass | null>(null)
  const [loading, setLoading] = useState(true)
  const preparationLinks = useMemo(
    () => [
      {
        label: 'Open Mezmur practice library',
        href: 'https://tewahedodaily.pages.dev/practice',
      },
      {
        label: 'View parish calendar',
        href: 'https://tewahedodaily.pages.dev/calendar',
      },
      {
        label: 'Read Orthodox study resource',
        href: '/resources/The%20Faith%20And%20Order%20Of%20The%20Church.pdf',
        title: 'Opens the main Orthodox study PDF',
      },
      {
        label: 'Launch Projector Mode',
        href: '/upcoming-mezmurs?mode=present',
      },
    ],
    [],
  )

  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        setLoading(true)
        const [preview, knowledge, weeks] = await Promise.all([
          getUpcomingPreview(),
          getActiveWeeklyKnowledge(),
          listWeeks(),
        ])
        setUpcoming(preview)
        setWeeklyKnowledge(knowledge)
        setLastClass(weeks[0] ?? null)
      } catch (error) {
        console.error('Failed to load upcoming class:', error)
        setUpcoming(null)
      } finally {
        setLoading(false)
      }
    }

    loadUpcoming()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <div className="bg-brand-100 h-5 w-36 rounded"></div>
          <div className="mt-3 bg-brand-100 h-7 w-72 rounded"></div>
          <div className="mt-3 bg-brand-100 h-4 w-48 rounded"></div>
        </div>
      </div>
    )
  }

  if (!upcoming) {
    return (
      <div className="space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {t('nextClass')}
          </p>
          <h1 className="mt-1 text-xl font-bold text-brand-900">Upcoming Timirit will appear here</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            Organizers have not yet published the next Tuesday preview.
          </p>
        </Card>
        <RouterLinkButton to="/past-timirit" variant="secondary" className="w-full sm:w-auto">
          Browse Past Classes
        </RouterLinkButton>
      </div>
    )
  }

  const isUsableHttpLink = (value?: string) => {
    if (!value?.trim()) return false
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }
  const previewEmbedUrl = isUsableHttpLink(upcoming.lessonYoutubeUrl)
    ? toYouTubeEmbedUrl(upcoming.lessonYoutubeUrl)
    : undefined
  const hasPreviewAudio = isUsableHttpLink(upcoming.lessonAudioUrl)
  const hasPreviewVideo = Boolean(previewEmbedUrl)
  const visibleMezmurs = upcoming.mezmurs.filter(
    (mezmur) =>
      Boolean(
        mezmur.title?.trim() ||
          mezmur.titleEn?.trim() ||
          mezmur.titleAm?.trim() ||
          mezmur.transliteration?.trim() ||
          mezmur.lyrics?.trim() ||
          (mezmur.youtubeUrl && isUsableHttpLink(mezmur.youtubeUrl)),
      ),
  )

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('nextClass')}</p>
        <h1 className="mt-1 text-xl font-bold text-brand-900 sm:text-2xl">
          {upcoming.topicPreview?.trim() || 'Upcoming Timirit'}
        </h1>
        <p className="mt-1 text-sm text-brand-700">{formatClassDate(upcoming.scheduledDate)}</p>
        {upcoming.note?.trim() ? (
          <p className="mt-3 text-sm leading-relaxed text-brand-800">{upcoming.note}</p>
        ) : null}
        <StructuredLessonContent
          className="mt-3"
          summary={{
            en: upcoming.classSummaryEn ?? upcoming.classSummary ?? upcoming.lessonNote,
            am: upcoming.classSummaryAm,
          }}
          mainPoints={upcoming.mainPoints}
        />
      </Card>

      {weeklyKnowledge ? <WeeklyKnowledgeCard item={weeklyKnowledge} /> : null}

      {hasPreviewAudio || hasPreviewVideo ? (
        <Card>
          <h2 className="text-base font-semibold text-brand-900">Teacher lesson media</h2>
          <div className="mt-3 space-y-3">
            {hasPreviewAudio ? (
              <LessonAudioBlock
                audioUrl={upcoming.lessonAudioUrl}
                audioTitle={upcoming.lessonAudioTitle}
                audioNote="Best for mobile listening with headphones."
                sectionTitle="Lesson Audio"
              />
            ) : null}
            {hasPreviewVideo ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                <p className="text-sm font-semibold text-brand-900">Watch the Lesson</p>
                <div className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-black">
                  <iframe
                    src={previewEmbedUrl}
                    title="Upcoming lesson preview video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <TeacherYoutubeChannelCard
        eyebrow="From the teacher's channel"
        title="Teacher teaching channel"
        description="Browse deeper teaching and Bible study videos from the teacher's official channel to prepare your heart and mind before Tuesday."
        buttonLabel="Visit teacher channel"
      />

      <Card>
        <h2 className="text-base font-semibold text-brand-900">Preparation checklist</h2>
        <ul className="mt-3 space-y-2 text-sm text-brand-800">
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            1. Review last summary before Tuesday.
          </li>
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            2. Listen to the lesson audio while commuting or resting.
          </li>
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            3. Practice the two upcoming mezmurs with your family.
          </li>
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            4. Check Orthodox resources for context and key terms.
          </li>
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <RouterLinkButton
            to={lastClass ? `/class/${lastClass.id}` : '/past-timirit'}
            variant="secondary"
            className="w-full"
          >
            {lastClass ? 'Review last summary' : 'Browse past summaries'}
          </RouterLinkButton>
          <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
            Practice upcoming mezmurs
          </RouterLinkButton>
        </div>
      </Card>

      {visibleMezmurs.length > 0 ? (
      <Card>
        <h2 className="text-base font-semibold text-brand-900">{t('upcomingMezmurs')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {visibleMezmurs.map((mezmur, index) => (
            <article key={`${mezmur.title}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-xs font-semibold uppercase text-brand-700">Mezmur {index + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-brand-900">{mezmur.title || 'To be announced'}</h3>
              {mezmur.transliteration ? (
                <p className="mt-1 text-sm italic text-brand-700">{mezmur.transliteration}</p>
              ) : null}
              <p className="mt-3 text-sm text-brand-700">
                {mezmur.lyrics ? 'Lyrics available for class preparation.' : 'To be announced'}
              </p>
            </article>
          ))}
        </div>
        <a
          href="/mezmurs"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Open upcoming mezmurs
        </a>
      </Card>
      ) : null}

      {upcoming.keyVerse ? (
        <Card>
          <h2 className="text-base font-semibold text-brand-900">Key verse for this week</h2>
          <p className="mt-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-3 text-sm font-medium leading-relaxed text-brand-900">
            {upcoming.keyVerse}
          </p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-base font-semibold text-brand-900">Related links</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {preparationLinks.map((link) => {
            const isPresentationLink = link.href.includes('mode=present')
            return (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith('http') || link.href.endsWith('.pdf') ? '_blank' : undefined}
                rel={link.href.startsWith('http') || link.href.endsWith('.pdf') ? 'noreferrer' : undefined}
                title={link.title}
                className={
                  isPresentationLink
                    ? 'inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent-600 px-5 py-3 text-base font-bold text-white shadow-md shadow-accent-700/30 transition hover:-translate-y-0.5 hover:opacity-95 sm:col-span-2'
                    : 'inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50'
                }
              >
                {link.label}
              </a>
            )
          })}
        </div>
      </Card>

      {upcoming.organizerNote?.trim() ? (
        <Card>
          <h2 className="text-base font-semibold text-brand-900">Note from organizers</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-800">
            {upcoming.organizerNote}
          </p>
        </Card>
      ) : null}
    </div>
  )
}