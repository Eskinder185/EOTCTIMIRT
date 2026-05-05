import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { EnglishRecapHint } from '../EnglishRecapHint'
import { FollowUpSection } from '../FollowUpSection'
import { MezmurCard } from '../MezmurCard'
import { SupportBanner } from '../SupportBanner'
import { TimiritConnectPanel } from '../TimiritConnectPanel'
import { VideoEmbed } from '../VideoEmbed'
import { StructuredLessonContent } from '../StructuredLessonContent'
import { Button } from '../ui/Button'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import type { WeeklyClass } from '../../data/types'
import { formatClassDate } from '../../lib/formatDate'
import { CURRENT_TOPIC } from '../../site/constants'

/**
 * Full Timirit lesson view shared by `/this-week` and `/class/:id`.
 * Mobile-first design with key actions at the top.
 * Wording stays within Ethiopian Orthodox Tewahedo parish life (Liturgy, Fathers, fasts).
 */
export function TimirtWeekPageContent({ week }: { week: WeeklyClass }) {
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, week.id])

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Weekly Timirit
        </p>
        <h1 className="text-xl font-bold text-brand-900 sm:text-2xl">{week.topic}</h1>
        {week.topic === CURRENT_TOPIC.english ? (
          <p className="mt-1 text-sm font-medium text-brand-800">{CURRENT_TOPIC.amharic}</p>
        ) : null}
        <p className="mt-1 text-sm text-brand-700">
          {formatClassDate(week.date)} · {week.speaker}
        </p>
      </div>

      {/* Quick Actions - Mobile-First */}
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            className="h-12 text-sm font-medium"
            onClick={() => {
              const videoEl = document.getElementById('video-section')
              videoEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            🎥 Watch Replay
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            className="h-12 text-sm font-medium"
            onClick={() => {
              const summaryEl = document.getElementById('summary-section')
              summaryEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            📝 Read Summary
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant="secondary"
            className="h-12 text-sm font-medium"
            onClick={() => {
              const mezmurEl = document.getElementById('mezmur-section')
              mezmurEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            🎵 See Mezmurs
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            className="h-12 text-sm font-medium"
            onClick={() => {
              const followUpEl = document.getElementById('follow-up')
              followUpEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            ❓ Follow-up
          </Button>
        </div>
      </div>

      <SupportBanner />

      <div id="video-section">
        <VideoEmbed url={week.youtubeUrl} title={week.topic} />
      </div>

      <div id="summary-section">
        <CollapsibleSection title="Teaching overview" subtitle="Short summary and the main points from this Timirit" defaultOpen>
          <StructuredLessonContent
            summary={{ en: week.englishSummary, am: week.amharicSummary }}
            mainPoints={
              week.mainPoints && week.mainPoints.length > 0
                ? week.mainPoints
                : week.keyPoints.map((point) => ({ en: point }))
            }
          />
        </CollapsibleSection>

        {week.verses?.length ? (
          <CollapsibleSection title="Gospel & Epistle references" subtitle="Read slowly at home with a blessing from your father of confession if needed">
            <ul className="list-disc space-y-2 pl-5 text-brand-900">
              {week.verses.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </CollapsibleSection>
        ) : null}
      </div>

      <section id="mezmur-section" className="space-y-3" aria-labelledby="mezmur-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="mezmur-heading" className="text-lg font-semibold text-brand-900">
              Mezmurs before the lesson
            </h2>
            <p className="text-sm text-brand-700">
              Two hymns from our Ethiopian Orthodox tradition, usually sung before the
              teaching.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <MezmurCard mezmur={week.mezmurs[0]} index={1} advancedPracticeUrl={week.mezmurs[0]?.advancedPracticeUrl} />
          <MezmurCard mezmur={week.mezmurs[1]} index={2} advancedPracticeUrl={week.mezmurs[1]?.advancedPracticeUrl} />
        </div>
      </section>

      <EnglishRecapHint />

      <FollowUpSection key={week.id} week={week} />

      <TimiritConnectPanel />
    </div>
  )
}
