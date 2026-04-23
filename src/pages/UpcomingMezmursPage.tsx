import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getUpcomingPreview } from '../data/weeksRepo'
import type { Mezmur } from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import { formatClassDate } from '../lib/formatDate'
import { useUiText } from '../lib/uiText'
import { CHURCH_SHORT_NAME } from '../site/constants'

const LYRICS_PLACEHOLDER = 'Lyrics will be added soon'

function withRequiredMezmurs(preview: UpcomingTimirtPreview | null): [Mezmur, Mezmur] {
  if (!preview) {
    return [
      { title: 'Mezmur 1 will be announced soon' },
      { title: 'Mezmur 2 will be announced soon' },
    ]
  }

  return [
    preview.mezmurs[0] ?? { title: 'Mezmur 1 will be announced soon' },
    preview.mezmurs[1] ?? { title: 'Mezmur 2 will be announced soon' },
  ]
}

export function UpcomingMezmursPage() {
  const t = useUiText()
  const [searchParams, setSearchParams] = useSearchParams()
  const isPresentationMode = searchParams.get('mode') === 'present'
  const [preview, setPreview] = useState<UpcomingTimirtPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        setLoading(true)
        const upcoming = await getUpcomingPreview()
        setPreview(upcoming)
      } catch (error) {
        console.error('Failed to load upcoming mezmurs:', error)
        setPreview(null)
      } finally {
        setLoading(false)
      }
    }

    loadUpcoming()
  }, [])

  const mezmurs = useMemo(() => withRequiredMezmurs(preview), [preview])

  useEffect(() => {
    if (!isPresentationMode) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setActiveSlide((current) => Math.min(current + 1, mezmurs.length - 1))
      }
      if (event.key === 'ArrowLeft') {
        setActiveSlide((current) => Math.max(current - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPresentationMode, mezmurs.length])

  const togglePresentationMode = () => {
    const next = new URLSearchParams(searchParams)
    if (isPresentationMode) {
      next.delete('mode')
    } else {
      next.set('mode', 'present')
    }
    setSearchParams(next, { replace: true })
  }

  const requestFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      return
    }

    await document.exitFullscreen()
  }

  const activeMezmur = mezmurs[activeSlide]
  const dateLabel = preview?.scheduledDate ? formatClassDate(preview.scheduledDate) : 'Upcoming Timirit'

  return (
    <div className="min-h-dvh bg-brand-50 text-brand-900 print:bg-white">
      <main className="mx-auto w-full max-w-480 px-4 py-4 sm:px-8 sm:py-8">
        <section className="rounded-3xl border border-brand-200/90 bg-white/90 p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                {CHURCH_SHORT_NAME}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-brand-900 sm:text-5xl">Upcoming Mezmurs</h1>
              <p className="mt-2 text-base text-brand-700 sm:text-xl">{preview?.topicPreview || dateLabel}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={togglePresentationMode}
                className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-100"
              >
                {isPresentationMode ? 'Exit Display Mode' : t('presentationMode')}
              </button>
              {isPresentationMode ? (
                <button
                  type="button"
                  onClick={requestFullscreen}
                  className="inline-flex min-h-11 items-center rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Fullscreen
                </button>
              ) : (
                <Link
                  to="/mezmurs"
                  className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Back to mezmur page
                </Link>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-5 rounded-3xl border border-brand-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="animate-pulse space-y-4">
              <div className="h-7 w-56 rounded bg-brand-100" />
              <div className="h-14 w-full rounded bg-brand-100" />
              <div className="h-44 w-full rounded bg-brand-100" />
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-3xl border border-brand-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Mezmur {activeSlide + 1} of 2
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
              {activeMezmur.title || `Mezmur ${activeSlide + 1} (TBD)`}
            </h2>

            {activeMezmur.transliteration ? (
              <p className="mt-4 text-xl italic text-brand-700 sm:text-3xl">{activeMezmur.transliteration}</p>
            ) : null}

            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-5 sm:p-8">
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-brand-900 sm:text-2xl sm:leading-loose">
                {activeMezmur.lyrics?.trim() || LYRICS_PLACEHOLDER}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              {activeMezmur.audioUrl ? (
                <a
                  href={activeMezmur.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
                >
                  Listen Audio
                </a>
              ) : null}
              {activeMezmur.youtubeUrl ? (
                <a
                  href={activeMezmur.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
                >
                  Open YouTube
                </a>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setActiveSlide((current) => Math.max(current - 1, 0))}
                disabled={activeSlide === 0}
                className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 enabled:hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous Mezmur
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((current) => Math.min(current + 1, mezmurs.length - 1))}
                disabled={activeSlide === mezmurs.length - 1}
                className="inline-flex min-h-11 items-center rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Mezmur
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
