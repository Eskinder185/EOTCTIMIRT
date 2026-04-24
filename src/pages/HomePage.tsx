import { useEffect, useState } from 'react'
import { WeeklyKnowledgeCard } from '../components/WeeklyKnowledgeCard'
import { TeacherYoutubeChannelCard } from '../components/TeacherYoutubeChannelCard'
import { LessonAudioBlock } from '../components/LessonAudioBlock'
import { StructuredLessonContent } from '../components/StructuredLessonContent'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { displayBilingualLine } from '../lib/localizedText'
import { useUiLanguage } from '../contexts/LanguageContext'
import {
  CHURCH_FULL_NAME,
  CHURCH_FULL_NAME_AM,
  TEACHER_INFO,
  TEACHER_YOUTUBE_CHANNEL,
  TIMIRT_SCHEDULE_LABEL,
  TIMIRT_SCHEDULE_LABEL_AM,
} from '../site/constants'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type { WeeklyKnowledgeItem } from '../data/weeklyKnowledge'
import { formatClassDate } from '../lib/formatDate'
import {
  displayWeeklyClassSpeaker,
  displayWeeklyClassTopic,
  recapCardFieldLabels,
} from '../lib/weeklyClassDisplay'
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
  const { language } = useUiLanguage()
  const isAm = language === 'am'
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

  const churchHeroLine = isAm ? CHURCH_FULL_NAME_AM : CHURCH_FULL_NAME
  const heroDescription = isAm
    ? 'ለሚቀጥለው የማክሰኞ ክፍል፣ ለቅርብ ጊዜ ማጠቃለያዎች፣ ለሳምንታዊ መዝሙሮች እና ለደብር ድጋፍ የተዘጋጀ ቀላል የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ትምህርት ማዕከል።'
    : 'A simple Ethiopian Orthodox Tewahedo Timirt hub for the next Tuesday class, recent summaries, weekly mezmurs, and parish support.'

  const scheduleLine = isAm ? TIMIRT_SCHEDULE_LABEL_AM : TIMIRT_SCHEDULE_LABEL
  const nextClassDateLabel = upcoming ? formatClassDate(upcoming.scheduledDate, language) : scheduleLine
  const recapLabels = recapCardFieldLabels(language)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{churchHeroLine}</p>
        <h1 className="mt-1 text-xl font-bold text-brand-900">EOTC Timirt</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">{heroDescription}</p>
        <div className="mt-3 flex flex-col gap-1 text-sm text-brand-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="flex flex-col">
              <span className="font-semibold">{t('nextClass')}</span>
              <span className="text-xs text-brand-700">{nextClassDateLabel}</span>
              <span className="text-brand-700">{isAm ? TEACHER_INFO.nameAmharic : TEACHER_INFO.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span>{scheduleLine}</span>
          </div>
        </div>
      </div>

      <p className="rounded-2xl border border-accent-600/25 bg-accent-600/10 px-4 py-3 text-sm font-medium leading-snug text-brand-900 shadow-sm sm:hidden">
        {t('mobileNavHint')}
      </p>

      <div className="grid grid-cols-2 gap-4">
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
          title={isAm ? 'ዋናው የኦርቶዶክስ ጥናት PDF ይከፈቱ' : 'Opens the main Orthodox study PDF'}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-base font-medium text-brand-900 shadow-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50"
        >
          ☦️ {isAm ? 'የኦርቶዶክስ ጥናት ሰነዶች' : 'Orthodox Resources'}
        </a>
      </div>

      {upcoming ? (
        <Card>
          <h2 className="mt-1 text-lg font-semibold text-brand-900">
            {displayBilingualLine(language, upcoming.topicPreviewEn, upcoming.topicPreviewAm, upcoming.topicPreview).trim() ||
              upcoming.topicPreview}
          </h2>
          <p className="mt-1 text-sm text-brand-700">{formatClassDate(upcoming.scheduledDate, language)}</p>
          <StructuredLessonContent
            className="mt-3"
            sectionTitle={isAm ? 'የትምህርት ቅድመ እይታ' : 'Teaching Preview'}
            summaryLabel={isAm ? 'አጭር ማጠቃለያ' : 'Short Summary'}
            summary={{
              en: upcoming.classSummaryEn ?? upcoming.classSummary ?? upcoming.noteEn ?? upcoming.note,
              am: upcoming.classSummaryAm ?? upcoming.noteAm,
            }}
            mainPoints={upcoming.mainPoints}
            compact
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <RouterLinkButton to="/upcoming" className="w-full">
              {isAm ? 'ለቀጣዩ ክፍል ዝግጁ ይሁኑ' : 'Prepare for Next Class'}
            </RouterLinkButton>
            <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
              {isAm ? 'መዝሙሮችን ይለማመዱ' : 'Practice Mezmurs'}
            </RouterLinkButton>
          </div>
        </Card>
      ) : null}

      {weeklyKnowledge ? <WeeklyKnowledgeCard item={weeklyKnowledge} /> : null}

      <TeacherYoutubeChannelCard
        eyebrow={isAm ? 'የመምህሩ ማስተማሪያ ቻናል' : 'Teacher Teaching Channel'}
        title={isAm ? TEACHER_YOUTUBE_CHANNEL.titleAm : TEACHER_YOUTUBE_CHANNEL.title}
        description={isAm ? TEACHER_YOUTUBE_CHANNEL.descriptionAm : TEACHER_YOUTUBE_CHANNEL.description}
        buttonLabel={t('openYouTube')}
      />

      {upcoming && (lessonPreviewAudio || lessonPreviewVideo) ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {isAm ? 'የትምህርት ሚዲያ' : 'Lesson Media'}
          </p>
          <h2 className="mt-1 text-base font-semibold text-brand-900">
            {isAm ? 'ከማክሰኞ በፊት ቅድመ እይታ' : 'Preview Before Tuesday'}
          </h2>
          {lessonPreviewAudio ? (
            <LessonAudioBlock
              audioUrl={lessonPreviewAudio}
              audioTitle={upcoming.lessonAudioTitle?.trim() || (isAm ? 'ትምህርቱን ያድምጡ' : 'Listen to teaching')}
              sectionTitle={isAm ? 'የትምህርት ድምፅ' : 'Lesson Audio'}
              className="mt-3"
            />
          ) : null}
          {lessonPreviewVideo ? (
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-sm font-semibold text-brand-900">
                {isAm ? 'ቅድመ እይታ ቪዲዮ' : 'Watch Lesson Preview'}
              </p>
              <div className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-black">
                <iframe
                  src={lessonPreviewVideo}
                  title={isAm ? 'የመነሻ ገጽ ትምህርት ቅድመ እይታ' : 'Homepage lesson preview video'}
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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? 'ፈጣን ዝግጅት' : 'Quick Preparation'}
        </p>
        <h2 className="mt-1 text-base font-semibold text-brand-900">
          {isAm ? 'ሶስት ቀላል እርምጃዎች' : 'Three Simple Steps'}
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <RouterLinkButton to={latestClass ? `/class/${latestClass.id}` : '/past-timirit'} variant="secondary" className="w-full">
            {isAm ? 'ማጠቃለያውን ይመልከቱ' : 'Review Summary'}
          </RouterLinkButton>
          <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
            {isAm ? 'መዝሙሮችን ይለማመዱ' : 'Practice Mezmurs'}
          </RouterLinkButton>
          {lessonPreviewAudioActionUrl ? (
            <a
              href={lessonPreviewAudioActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              {isGoogleDriveLink(lessonPreviewAudio)
                ? isAm
                  ? 'የትምህርት ድምፅ ያውርዱ'
                  : 'Download Teaching Audio'
                : isAm
                  ? 'ትምህርቱን ያድምጡ'
                  : 'Listen to Teaching'}
            </a>
          ) : (
            <RouterLinkButton to="/upcoming" variant="secondary" className="w-full">
              {isAm ? 'ቀጣዩን ክፍል ይክፈቱ' : 'Open Next Class'}
            </RouterLinkButton>
          )}
        </div>
      </Card>

      {latestClass ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {isAm ? 'የቅርብ ጊዜ ክፍል ድምቀት' : 'Recent Class Highlight'}
          </p>
          <div className="mt-2 space-y-1.5 text-sm text-brand-800">
            <p>
              <span className="font-semibold text-brand-900">{recapLabels.date}</span>{' '}
              <span className="text-brand-700">{formatClassDate(latestClass.date, language)}</span>
            </p>
            <p>
              <span className="font-semibold text-brand-900">{recapLabels.topic}</span>{' '}
              <span>{displayWeeklyClassTopic(latestClass, language)}</span>
            </p>
            <p>
              <span className="font-semibold text-brand-900">{recapLabels.teacher}</span>{' '}
              <span className="text-brand-700">{displayWeeklyClassSpeaker(latestClass, language)}</span>
            </p>
          </div>
          <StructuredLessonContent
            className="mt-2"
            sectionTitle={isAm ? 'የትምህርት ማጠቃለያ' : 'Teaching Recap'}
            summaryLabel={isAm ? 'አጭር ማጠቃለያ' : 'Short Summary'}
            summary={{ en: latestClass.englishSummary, am: latestClass.amharicSummary }}
            mainPoints={
              latestClass.mainPoints && latestClass.mainPoints.length > 0
                ? latestClass.mainPoints
                : latestClass.keyPoints.map((point) => ({ en: previewText(point, 120) }))
            }
            compact
          />
          <RouterLinkButton to={`/class/${latestClass.id}`} variant="secondary" className="mt-3 w-full sm:w-auto">
            {isAm ? 'ይህን ክፍል ይከታተሉ' : 'Catch Up on This Class'}
          </RouterLinkButton>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {isAm ? 'ያለፉ ክፍሎች' : 'Past Classes'}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">
              {isAm ? 'የቅርብ ጊዜ የትምህርት ማጠቃለያዎች' : 'Recent Timirt Summaries'}
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              {isAm
                ? 'ማጠቃለያውን፣ መዝሙሮችን እና ፈጣን የክትትል ጥያቄዎችን ለመመልከት አንድ የቅርብ ጊዜ ክፍል ይክፈቱ።'
                : 'Open a recent class to review the summary, mezmurs, and quick follow-up questions.'}
            </p>
          </div>
          <RouterLinkButton to="/past-timirit" variant="secondary" className="hidden sm:inline-flex">
            {isAm ? 'ሁሉንም' : 'See all'}
          </RouterLinkButton>
        </div>
        <div className="mt-4 space-y-3">
          {recentClasses.map((week) => (
            <div key={week.id} className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
              <div className="space-y-1.5 text-sm text-brand-800">
                <p>
                  <span className="font-semibold text-brand-900">{recapLabels.date}</span>{' '}
                  <span className="text-brand-700">{formatClassDate(week.date, language)}</span>
                </p>
                <p>
                  <span className="font-semibold text-brand-900">{recapLabels.topic}</span>{' '}
                  <span className="text-base font-semibold text-brand-900">{displayWeeklyClassTopic(week, language)}</span>
                </p>
                <p>
                  <span className="font-semibold text-brand-900">{recapLabels.teacher}</span>{' '}
                  <span className="text-brand-700">{displayWeeklyClassSpeaker(week, language)}</span>
                </p>
              </div>
              <StructuredLessonContent
                className="mt-2"
                sectionTitle={isAm ? 'የትምህርት ማጠቃለያ' : 'Teaching Recap'}
                summaryLabel={isAm ? 'አጭር ማጠቃለያ' : 'Short Summary'}
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
                {isAm ? 'ማጠቃለያውን ይመልከቱ' : 'Review Summary'}
              </RouterLinkButton>
            </div>
          ))}
        </div>
        <RouterLinkButton to="/past-timirit" variant="secondary" className="mt-4 w-full sm:hidden">
          {isAm ? 'ሁሉንም ያለፉ ክፍሎች' : 'See all past classes'}
        </RouterLinkButton>
      </Card>
    </div>
  )
}
