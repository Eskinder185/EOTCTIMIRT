import { useEffect, useState } from 'react'
import { EnglishRecapHint } from '../components/EnglishRecapHint'
import { FollowUpSection } from '../components/FollowUpSection'
import { SupportBanner } from '../components/SupportBanner'
import { TimiritConnectPanel } from '../components/TimiritConnectPanel'
import { VideoEmbed } from '../components/VideoEmbed'
import { Card } from '../components/ui/Card'
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { Button } from '../components/ui/Button'
import { getCurrentWeek } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'
import { CURRENT_TOPIC } from '../site/constants'

/**
 * Mobile-first gentle path for members who missed Timirit — no guilt, only mercy.
 */
export function MissedThisWeekPage() {
  const [week, setWeek] = useState<WeeklyClass | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWeek = async () => {
      try {
        setLoading(true)
        setWeek(await getCurrentWeek())
      } catch (error) {
        console.error('Failed to load current week for missed page:', error)
        setWeek(null)
      } finally {
        setLoading(false)
      }
    }

    loadWeek()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-brand-100 h-8 w-56 rounded"></div>
        <div className="animate-pulse bg-brand-100 h-24 w-full rounded"></div>
        <div className="animate-pulse bg-brand-100 h-40 w-full rounded"></div>
      </div>
    )
  }

  if (!week) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤗</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-brand-900">Missed this week?</h1>
            <p className="mt-1 text-sm text-brand-700">
              Christ's Church receives you with patience. No shame, only mercy.
            </p>
          </div>
        </div>
      </Card>

      {/* Current Week Info */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-700">This week's topic</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">{week.topic}</h2>
            {week.topic === CURRENT_TOPIC.english ? (
              <p className="mt-1 text-sm font-medium text-brand-800">{CURRENT_TOPIC.amharic}</p>
            ) : null}
            <p className="mt-1 text-sm text-brand-700">
              {formatClassDate(week.date)} · {week.speaker}
            </p>
          </div>
          <span className="text-3xl">📚</span>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3">
        <Button 
          type="button" 
          className="h-16 text-lg font-semibold"
          onClick={() => {
            const videoEl = document.getElementById('video-section')
            videoEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          🎥 Watch the Replay
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant="secondary"
            className="h-14 text-base font-medium"
            onClick={() => {
              const summaryEl = document.getElementById('summary-section')
              summaryEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            📝 Read Recap
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            className="h-14 text-base font-medium"
            onClick={() => {
              const followUpEl = document.getElementById('follow-up')
              followUpEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            ❓ Questions
          </Button>
        </div>
      </div>

      <SupportBanner />

      {/* Video Section */}
      <div id="video-section">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">🎥</span>
            <div>
              <h3 className="font-semibold text-brand-900">Replay the teaching</h3>
              <p className="text-sm text-brand-700">Listen while driving or at home</p>
            </div>
          </div>
          <VideoEmbed url={week.youtubeUrl} title={week.topic} />
        </Card>
      </div>

      {/* Summary Section */}
      <div id="summary-section">
        {/* English Summary - Always visible */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">📝</span>
            <div>
              <h3 className="font-semibold text-brand-900">Short English recap</h3>
              <p className="text-sm text-brand-700">Quick summary to catch up on {week.topic}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-brand-900">{week.englishSummary}</p>
        </Card>

        {/* Amharic Summary - Collapsible */}
        <CollapsibleSection title={`Amharic recap for ${week.topic}`} subtitle="Same notes as the classroom board">
          <p className="text-[1.05rem] leading-relaxed text-brand-900">{week.amharicSummary}</p>
        </CollapsibleSection>

        {/* Key Points - Collapsible */}
        <CollapsibleSection title="Key points to remember" defaultOpen>
          <ul className="list-disc space-y-2 pl-5 text-brand-900">
            {week.keyPoints.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
        </CollapsibleSection>
      </div>

      <EnglishRecapHint />

      <FollowUpSection key={week.id} week={week} />

      {/* Next Steps */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">✨</span>
          <div>
            <h3 className="font-semibold text-brand-900">Come next Tuesday</h3>
            <p className="text-sm text-brand-700">Your seat is always waiting</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-brand-800 mb-4">
          Missing one week never removes your place. Bring your questions, arrive early or
          late, and receive the blessing of learning together in our Ethiopian Orthodox family.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <RouterLinkButton to="/this-week" className="h-12 font-medium">
            📚 Full Timirit page
          </RouterLinkButton>
          <RouterLinkButton to="/mezmurs" variant="secondary" className="h-12 font-medium">
            🎵 Weekly mezmurs
          </RouterLinkButton>
        </div>
      </Card>

      <TimiritConnectPanel />
    </div>
  )
}