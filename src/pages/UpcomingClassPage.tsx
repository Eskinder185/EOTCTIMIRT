import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { getUpcomingPreview } from '../data/weeksRepo'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import { formatClassDate } from '../lib/formatDate'
import { useUiText } from '../lib/uiText'

export function UpcomingClassPage() {
  const t = useUiText()
  const [upcoming, setUpcoming] = useState<UpcomingTimirtPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const preparationLinks = useMemo(
    () => [
      { label: t('mezmurPractice'), href: 'https://tewahedodaily.pages.dev/practice' },
      { label: t('calendar'), href: 'https://tewahedodaily.pages.dev/calendar' },
      {
        label: 'Orthodox Resources',
        href: '/resources/The%20Faith%20And%20Order%20Of%20The%20Church.pdf',
        title: 'Opens the main Orthodox study PDF',
      },
    ],
    [t],
  )

  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        setLoading(true)
        setUpcoming(await getUpcomingPreview())
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

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('nextClass')}</p>
        <h1 className="mt-1 text-xl font-bold text-brand-900 sm:text-2xl">{upcoming.topicPreview}</h1>
        <p className="mt-1 text-sm text-brand-700">{formatClassDate(upcoming.scheduledDate)}</p>
        <p className="mt-3 text-sm leading-relaxed text-brand-800">{upcoming.note}</p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-brand-900">What the next class is about</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          This preview gives the parish a simple way to see the next Timirit topic, review the note from the organizers,
          and prepare with peace before next Tuesday.
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-brand-900">{t('upcomingMezmurs')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {upcoming.mezmurs.map((mezmur, index) => (
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
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-brand-900">Preparation resources</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {preparationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') || link.href.endsWith('.pdf') ? '_blank' : undefined}
              rel={link.href.startsWith('http') || link.href.endsWith('.pdf') ? 'noreferrer' : undefined}
              title={link.title}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50"
            >
              {link.label}
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-brand-900">Guidance</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-800">
          <li>Review the last class summary before next Tuesday.</li>
          <li>Prepare the mezmurs ahead of time if possible.</li>
          <li>Read the preview note so the topic is familiar.</li>
          <li>Come ready for the next Tuesday Timirit with prayer and attention.</li>
        </ul>
      </Card>
    </div>
  )
}