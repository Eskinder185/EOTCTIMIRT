import { useEffect, useState } from 'react'
import { WeeklyKnowledgeCard } from '../components/WeeklyKnowledgeCard'
import { TeacherYoutubeChannelCard } from '../components/TeacherYoutubeChannelCard'
import { LessonAudioBlock } from '../components/LessonAudioBlock'
import { StructuredLessonContent } from '../components/StructuredLessonContent'
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
import type { WeeklyKnowledgeItem } from '../data/weeklyKnowledge'
import { formatClassDate } from '../lib/formatDate'
import { getActiveWeeklyKnowledge } from '../lib/supabaseData'
import { getGoogleDriveDownloadUrl, isGoogleDriveLink } from '../lib/googleDrive'
import { toYouTubeEmbedUrl } from '../lib/youtube'
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
  const [weeklyKnowledge, setWeeklyKnowledge] = useState<WeeklyKnowledgeItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [weeks, upcomingPreview, knowledge] = await Promise.all([
          listWeeks(),
          getUpcomingPreview(),
          getActiveWeeklyKnowledge(),
        ])
        setRecentClasses(weeks.slice(0, 3))
        setUpcoming(upcomingPreview)
        setWeeklyKnowledge(knowledge)
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

  const latestClass = recentClasses[0] ?? null
  const lessonPreviewAudio = upcoming?.lessonAudioUrl?.trim() ? upcoming.lessonAudioUrl : undefined
  const lessonPreviewVideo = toYouTubeEmbedUrl(upcoming?.lessonYoutubeUrl)
  const lessonPreviewAudioActionUrl = isGoogleDriveLink(lessonPreviewAudio)
    ? (getGoogleDriveDownloadUrl(lessonPreviewAudio) ?? lessonPreviewAudio)
    : lessonPreviewAudio

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {CHURCH_FULL_NAME}
        </p>
        <h1 className="mt-1 text-xl font-bold text-brand-900">EOTC Timirt</h1>
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
          href="/resources/The%20Faith%20And%20Order%20Of%20The%20Church.pdf"
          target="_blank"
          rel="noopener noreferrer"
          title="Opens the main Orthodox study PDF"
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
          <StructuredLessonContent
            className="mt-3"
            sectionTitle="Teaching preview"
            summary={{
              en: upcoming.classSummaryEn ?? upcoming.classSummary ?? upcoming.noteEn ?? upcoming.note,
              am: upcoming.classSummaryAm ?? upcoming.noteAm,
            }}
            mainPoints={upcoming.mainPoints}
            compact
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <RouterLinkButton to="/upcoming" className="w-full">
              Prepare for Next Class
            </RouterLinkButton>
            <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
              Practice Mezmurs
            </RouterLinkButton>
          </div>
        </Card>
      ) : null}

      {weeklyKnowledge ? <WeeklyKnowledgeCard item={weeklyKnowledge} /> : null}

      <TeacherYoutubeChannelCard eyebrow="Teacher teaching channel" />

      {upcoming && (lessonPreviewAudio || lessonPreviewVideo) ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Teacher lesson media</p>
          <h2 className="mt-1 text-base font-semibold text-brand-900">Preview before Tuesday</h2>
          {lessonPreviewAudio ? (
            <LessonAudioBlock
              audioUrl={lessonPreviewAudio}
              audioTitle={upcoming.lessonAudioTitle?.trim() || 'Listen to teaching'}
              sectionTitle="Lesson Audio"
              className="mt-3"
            />
          ) : null}
          {lessonPreviewVideo ? (
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-sm font-semibold text-brand-900">Watch lesson preview</p>
              <div className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-black">
                <iframe
                  src={lessonPreviewVideo}
                  title="Homepage lesson preview video"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            </div>
          ) : null}
          {upcoming.lessonNote ? (
            <p className="mt-2 text-sm text-brand-700">{upcoming.lessonNote}</p>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quick prepare</p>
        <h2 className="mt-1 text-base font-semibold text-brand-900">Three simple steps</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <RouterLinkButton to={latestClass ? `/class/${latestClass.id}` : '/past-timirit'} variant="secondary" className="w-full">
            Review summary
          </RouterLinkButton>
          <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
            Practice mezmurs
          </RouterLinkButton>
          {lessonPreviewAudioActionUrl ? (
            <a
              href={lessonPreviewAudioActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              {isGoogleDriveLink(lessonPreviewAudio) ? 'Download teaching audio' : 'Listen to teaching'}
            </a>
          ) : (
            <RouterLinkButton to="/upcoming" variant="secondary" className="w-full">
              Open next class
            </RouterLinkButton>
          )}
        </div>
      </Card>

      {latestClass ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Recent class highlight</p>
          <h2 className="mt-1 text-base font-semibold text-brand-900">{latestClass.topic}</h2>
          <p className="mt-1 text-sm text-brand-700">{formatClassDate(latestClass.date)} · {latestClass.speaker}</p>
          <StructuredLessonContent
            className="mt-2"
            sectionTitle="Teaching recap"
            summary={{ en: latestClass.englishSummary, am: latestClass.amharicSummary }}
            mainPoints={
              latestClass.mainPoints && latestClass.mainPoints.length > 0
                ? latestClass.mainPoints
                : latestClass.keyPoints.map((point) => ({ en: previewText(point, 120) }))
            }
            compact
          />
          <RouterLinkButton to={`/class/${latestClass.id}`} variant="secondary" className="mt-3 w-full sm:w-auto">
            Catch up from this class
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
              <StructuredLessonContent
                className="mt-2"
                sectionTitle="Teaching recap"
                summary={{ en: previewText(week.englishSummary), am: previewText(week.amharicSummary) }}
                mainPoints={
                  week.mainPoints && week.mainPoints.length > 0
                    ? week.mainPoints.map((point) => ({
                        en: point.en ? previewText(point.en, 90) : undefined,
                        am: point.am ? previewText(point.am, 90) : undefined,
                      }))
                    : week.keyPoints.slice(0, 2).map((point) => ({ en: previewText(point, 90) }))
                }
                compact
              />
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