import { useEffect, useMemo, useState } from 'react'
import { WeeklyKnowledgeCard } from '../components/WeeklyKnowledgeCard'
import { TeacherYoutubeChannelCard } from '../components/TeacherYoutubeChannelCard'
import { LessonAudioBlock } from '../components/LessonAudioBlock'
import { StructuredLessonContent } from '../components/StructuredLessonContent'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { displayBilingualLine } from '../lib/localizedText'
import { getUpcomingPreview, listWeeks } from '../data/weeksRepo'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type { WeeklyClass } from '../data/types'
import type { WeeklyKnowledgeItem } from '../data/weeklyKnowledge'
import { formatClassDate } from '../lib/formatDate'
import { getActiveWeeklyKnowledge } from '../lib/supabaseData'
import { toYouTubeEmbedUrl } from '../lib/youtube'
import { useUiLanguage } from '../contexts/LanguageContext'
import { useUiText } from '../lib/uiText'

export function UpcomingClassPage() {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const [upcoming, setUpcoming] = useState<UpcomingTimirtPreview | null>(null)
  const [weeklyKnowledge, setWeeklyKnowledge] = useState<WeeklyKnowledgeItem | null>(null)
  const [lastClass, setLastClass] = useState<WeeklyClass | null>(null)
  const [loading, setLoading] = useState(true)
  const preparationLinks = useMemo(
    () =>
      isAm
        ? [
            {
              label: 'የመዝሙር ልምምድ ቤተ መጻሕፍትን ይክፈቱ',
              href: 'https://tewahedodaily.pages.dev/practice',
            },
            {
              label: 'የደብር የቀን መቁጠሪያን ይመልከቱ',
              href: 'https://tewahedodaily.pages.dev/calendar',
            },
            {
              label: 'የኦርቶዶክስ ጥናት ግብዓትን ያንብቡ',
              href: '/resources/The%20Faith%20And%20Order%20Of%20The%20Church.pdf',
              title: 'ዋናው የኦርቶዶክስ ጥናት PDF ይከፈቱ',
            },
            {
              label: 'የፕሮጀክተር ሁኔታን ያስጀምሩ',
              href: '/upcoming-mezmurs?mode=present',
            },
          ]
        : [
            {
              label: 'Open Mezmur Practice Library',
              href: 'https://tewahedodaily.pages.dev/practice',
            },
            {
              label: 'View Parish Calendar',
              href: 'https://tewahedodaily.pages.dev/calendar',
            },
            {
              label: 'Read Orthodox Study Resource',
              href: '/resources/The%20Faith%20And%20Order%20Of%20The%20Church.pdf',
              title: 'Opens the main Orthodox study PDF',
            },
            {
              label: 'Launch Projector Mode',
              href: '/upcoming-mezmurs?mode=present',
            },
          ],
    [isAm],
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
          <h1 className="mt-1 text-xl font-bold text-brand-900">
            {isAm ? 'የሚቀጥለው ትምህርት እዚህ ይታያል' : 'Upcoming Timirt will appear here'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            {isAm
              ? 'አደራጆች እስካሁን የሚቀጥለውን የማክሰኞ ቅድመ እይታ አላተሙም።'
              : 'Organizers have not yet published the next Tuesday preview.'}
          </p>
        </Card>
        <RouterLinkButton to="/past-timirit" variant="secondary" className="w-full sm:w-auto">
          {isAm ? 'ያለፉ ክፍሎችን ይመልከቱ' : 'Browse Past Classes'}
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

  const dateLabel = isAm ? 'ቀን:' : 'Date:'
  const introPreview = isAm
    ? 'የሚቀጥለው ሳምንት ትምህርት ትኩረቱን የሚያደርገው በነገረ ክርስቶስ ላይ ነው፤ ይህም በክርስቶስ እና በቤተ ክርስቲያን ሕይወት ውስጥ ባለው ስፍራው ላይ የሚያተኩር ትምህርት ነው።'
    : "Next week's Timirt will focus on Negre Kristos (ነገረ ክርስቶስ), a teaching centered on Christ and His place in the life of the Church."

  const previewNoteFromData = displayBilingualLine(
    language,
    upcoming.noteEn,
    upcoming.noteAm,
    upcoming.note,
  ).trim()
  const leadIntro = previewNoteFromData || introPreview

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('nextClass')}</p>
        <h1 className="mt-1 text-xl font-bold text-brand-900 sm:text-2xl">
          {displayBilingualLine(language, upcoming.topicPreviewEn, upcoming.topicPreviewAm, upcoming.topicPreview).trim() ||
            (isAm ? 'የሚቀጥለው ትምህርት' : 'Upcoming Timirt')}
        </h1>
        <p className="mt-2 text-sm text-brand-800">
          <span className="font-semibold text-brand-900">{dateLabel}</span>{' '}
          <span className="text-brand-700">{formatClassDate(upcoming.scheduledDate, language)}</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-brand-800">{leadIntro}</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {isAm ? 'የትምህርት ቅድመ እይታ' : 'Lesson Preview'}
          </p>
          <h2 className="mt-1 text-base font-semibold text-brand-900">
            {isAm ? 'የመምህሩ ትምህርት ሚዲያ' : 'Teacher Lesson Media'}
          </h2>
          <div className="mt-3 space-y-3">
            {hasPreviewAudio ? (
              <LessonAudioBlock
                audioUrl={upcoming.lessonAudioUrl}
                audioTitle={upcoming.lessonAudioTitle}
                audioNote={
                  isAm ? 'በሞባይል ላይ በጆሮ ማዳመጃ ለመስማት የተመቻቸ።' : 'Best for mobile listening with headphones.'
                }
                sectionTitle={isAm ? 'የትምህርት ድምፅ' : 'Lesson Audio'}
              />
            ) : null}
            {hasPreviewVideo ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                <p className="text-sm font-semibold text-brand-900">
                  {isAm ? 'ትምህርቱን ይመልከቱ' : 'Watch the Lesson'}
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-black">
                  <iframe
                    src={previewEmbedUrl}
                    title={isAm ? 'የሚቀጥል ትምህርት ቅድመ እይታ ቪዲዮ' : 'Upcoming lesson preview video'}
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
        eyebrow={isAm ? 'ከመምህሩ ቻናል' : "From the Teacher's Channel"}
        title={isAm ? 'የመምህሩ ማስተማሪያ ቻናል' : 'Teacher Teaching Channel'}
        description={
          isAm
            ? 'ከማክሰኞ በፊት ልብዎንና አእምሮዎን ለማዘጋጀት ከመምህሩ ኦፊሴላዊ ቻናል ጥልቅ የትምህርትና የመጽሐፍ ቅዱስ ጥናት ቪዲዮዎችን ይመልከቱ።'
            : "Browse deeper teaching and Bible study videos from the teacher's official channel to prepare your heart and mind before Tuesday."
        }
        buttonLabel={isAm ? 'የመምህሩን ቻናል ይጎብኙ' : 'Visit Teacher Channel'}
      />

      <Card>
        <h2 className="text-base font-semibold text-brand-900">
          {isAm ? 'የዝግጅት ዝርዝር' : 'Preparation Checklist'}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-brand-800">
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            {isAm ? '1. ከማክሰኞ በፊት ያለፈውን ማጠቃለያ ይመልከቱ።' : '1. Review the last summary before Tuesday.'}
          </li>
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            {isAm ? '2. እየተጓዙ ወይም እያረፉ ሳሉ የትምህርቱን ድምጽ ያዳምጡ።' : '2. Listen to the lesson audio while commuting or resting.'}
          </li>
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            {isAm ? '3. ሁለቱን የሚቀጥሉ መዝሙሮች ከቤተሰብዎ ጋር ይለማመዱ።' : '3. Practice the two upcoming mezmurs with your family.'}
          </li>
          <li className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            {isAm
              ? '4. አውዱን እና ቁልፍ ቃላትን ለመረዳት የኦርቶዶክስ ግብዓቶችን ይመልከቱ።'
              : '4. Review Orthodox resources for context and key terms.'}
          </li>
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <RouterLinkButton
            to={lastClass ? `/class/${lastClass.id}` : '/past-timirit'}
            variant="secondary"
            className="w-full"
          >
            {isAm
              ? lastClass
                ? 'ያለፈውን ማጠቃለያ ይመልከቱ'
                : 'ያለፉ ማጠቃለያዎችን ይመልከቱ'
              : lastClass
                ? 'Review Last Summary'
                : 'Browse Past Summaries'}
          </RouterLinkButton>
          <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
            {isAm ? 'የሚቀጥሉ መዝሙሮችን ይለማመዱ' : 'Practice Upcoming Mezmurs'}
          </RouterLinkButton>
          <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full">
            {isAm ? 'የሚቀጥሉ መዝሙሮችን ይክፈቱ' : 'Open Upcoming Mezmurs'}
          </RouterLinkButton>
        </div>
      </Card>

      {visibleMezmurs.length > 0 ? (
      <Card>
        <h2 className="text-base font-semibold text-brand-900">{t('upcomingMezmurs')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {visibleMezmurs.map((mezmur, index) => (
            <article key={`${mezmur.title}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-xs font-semibold uppercase text-brand-700">
                {isAm ? `መዝሙር ${index + 1}` : `Mezmur ${index + 1}`}
              </p>
              <h3 className="mt-1 text-base font-semibold text-brand-900">
                {displayBilingualLine(language, mezmur.titleEn, mezmur.titleAm, mezmur.title).trim() ||
                  (isAm ? 'በቅርቡ ይፋ ይደረጋል' : 'To be announced')}
              </h3>
              {mezmur.transliteration ? (
                <p className="mt-1 text-sm italic text-brand-700">{mezmur.transliteration}</p>
              ) : null}
              <p className="mt-3 text-sm text-brand-700">
                {mezmur.lyrics
                  ? isAm
                    ? 'ለክፍል ዝግጅት ግጥም ዝግጁ ነው።'
                    : 'Lyrics available for class preparation.'
                  : isAm
                    ? 'በቅርቡ ይፋ ይደረጋል'
                    : 'To be announced'}
              </p>
            </article>
          ))}
        </div>
      </Card>
      ) : null}

      {upcoming.keyVerse ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {isAm ? 'የዚህ ሳምንት ቁልፍ ጥቅስ' : 'Key Verse for This Week'}
          </p>
          <p className="mt-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-3 text-sm font-medium leading-relaxed text-brand-900">
            {upcoming.keyVerse}
          </p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-base font-semibold text-brand-900">
          {isAm ? 'ተዛማጅ አገናኞች' : 'Related Links'}
        </h2>
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
          <h2 className="text-base font-semibold text-brand-900">
            {isAm ? 'ከአደራጆች ማስታወሻ' : 'Note from Organizers'}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-800">
            {upcoming.organizerNote}
          </p>
        </Card>
      ) : null}
    </div>
  )
}