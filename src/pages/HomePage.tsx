import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { TewahedoDailyPanel } from '../components/TewahedoDailyPanel'
import {
  CHURCH_FULL_NAME,
  TIMIRT_SCHEDULE_LABEL,
  PRIEST_INFO,
  TEACHER_INFO,
  CURRENT_TOPIC,
  ORGANIZER_SUPPORT,
} from '../site/constants'
import { getCurrentWeek } from '../data/weeksRepo'
import type { WeeklyClass } from '../data/types'

export function HomePage() {
  const [current, setCurrent] = useState<WeeklyClass | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentWeek = await getCurrentWeek()
        setCurrent(currentWeek)
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
          {[1, 2, 3, 4].map((i) => (
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
        <h1 className="mt-1 text-xl font-bold text-brand-900">
          EOTC Timrit
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          A focused weekly class hub for Tuesday Timirt, missed-class mercy, weekly mezmurs,
          follow-up questions, and parish support.
        </p>
        <div className="mt-3 flex flex-col gap-1 text-sm text-brand-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="flex flex-col">
              <span className="font-semibold">{current?.topic ?? CURRENT_TOPIC.english}</span>
              <span className="text-xs text-brand-700">{CURRENT_TOPIC.amharic}</span>
              <span className="text-brand-700">{current?.speaker ?? TEACHER_INFO.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span>{TIMIRT_SCHEDULE_LABEL}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <RouterLinkButton to="/this-week" className="h-16 text-lg font-semibold">
          📖 This Week's Timrit
        </RouterLinkButton>
        <RouterLinkButton to="/missed" variant="secondary" className="h-16 text-lg font-semibold">
          🎥 Missed This Week?
        </RouterLinkButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <RouterLinkButton to="/mezmurs" variant="secondary" className="h-14 text-base font-medium">
          🎵 Weekly Mezmurs
        </RouterLinkButton>
        <RouterLinkButton to="/past-classes" variant="secondary" className="h-14 text-base font-medium">
          📚 Past Classes
        </RouterLinkButton>
        <RouterLinkButton to="/contact" variant="secondary" className="h-14 text-base font-medium">
          💬 Contact & Help
        </RouterLinkButton>
        <a
          href="#orthodox-resources"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-base font-medium text-brand-900 shadow-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50"
        >
          ☦️ Orthodox Resources
        </a>
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Weekly focus
        </p>
        <div className="mt-3 grid gap-2 text-sm text-brand-800">
          <p>What is this week's lesson?</p>
          <p>What did I miss?</p>
          <p>What are this week's two mezmurs?</p>
          <p>What should I review before next Tuesday?</p>
          <p>What was unclear from the lesson?</p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-brand-600">
          If a weekly mezmur needs extra help, a few quiet reference links are available below.
        </p>
      </Card>

      <div id="orthodox-resources">
        <TewahedoDailyPanel />
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Organizer recap support
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          Organizers collect attendance signals, follow-up questions, and recap notes so the
          next Tuesday lesson can serve the parish with clarity and patience.
        </p>
      </Card>

      <Card>
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">☦️</span>
              <div>
                <p className="font-semibold text-brand-900">Church Leadership</p>
                <p className="text-sm text-brand-700">{PRIEST_INFO.name}</p>
              </div>
            </div>
            <span className="transition-transform group-open:rotate-180 text-brand-600">▼</span>
          </summary>
          <div className="mt-3 pt-3 border-t border-brand-100">
            <p className="text-sm leading-relaxed text-brand-800">
              This Timrit is hosted at {PRIEST_INFO.name}'s church with the mission of helping our youth
              come closer to God through the teachings of the Ethiopian Orthodox Tewahedo Church.
            </p>
          </div>
        </details>
      </Card>

      <Card>
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="font-semibold text-brand-900">Organizer Contact</p>
                <p className="text-sm text-brand-700">Questions or support</p>
              </div>
            </div>
            <span className="transition-transform group-open:rotate-180 text-brand-600">▼</span>
          </summary>
          <div className="mt-3 pt-3 border-t border-brand-100 space-y-3">
            <div className="text-sm text-brand-800">
              <p className="font-semibold text-brand-900">{ORGANIZER_SUPPORT.primary.name}</p>
              <p className="text-brand-700">Primary contact</p>
              <a className="font-semibold text-accent-600 hover:underline" href={`tel:${ORGANIZER_SUPPORT.primary.phoneTel}`}>
                {ORGANIZER_SUPPORT.primary.phoneDisplay}
              </a>
            </div>
            <div className="text-sm text-brand-800">
              <p className="font-semibold text-brand-900">{ORGANIZER_SUPPORT.secondary.name}</p>
              <p className="text-brand-700">Secondary contact</p>
              <a className="font-semibold text-accent-600 hover:underline" href={`tel:${ORGANIZER_SUPPORT.secondary.phoneTel}`}>
                {ORGANIZER_SUPPORT.secondary.phoneDisplay}
              </a>
            </div>
            <p className="text-xs text-brand-600">
              For logistics and practical questions. Spiritual guidance remains with your father of confession.
            </p>
          </div>
        </details>
      </Card>
    </div>
  )
}