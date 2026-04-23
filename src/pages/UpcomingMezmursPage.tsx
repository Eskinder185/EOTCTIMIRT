import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getUpcomingPreview } from '../data/weeksRepo'
import type { Mezmur } from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import { formatClassDate } from '../lib/formatDate'
import { CHURCH_SHORT_NAME } from '../site/constants'

const LYRICS_PLACEHOLDER = 'Lyrics will be added soon'

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FullscreenCapableDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
}

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
  const [searchParams, setSearchParams] = useSearchParams()
  const isPresentationMode = searchParams.get('mode') === 'present'
  const [preview, setPreview] = useState<UpcomingTimirtPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
  const [isLandscape, setIsLandscape] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const presentationContainerRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    const orientationQuery = window.matchMedia('(orientation: landscape)')
    const coarseQuery = window.matchMedia('(pointer: coarse)')

    const syncViewportSignals = () => {
      setIsLandscape(orientationQuery.matches)
      setIsCoarsePointer(coarseQuery.matches)
    }

    syncViewportSignals()
    orientationQuery.addEventListener('change', syncViewportSignals)
    coarseQuery.addEventListener('change', syncViewportSignals)
    window.addEventListener('resize', syncViewportSignals)

    return () => {
      orientationQuery.removeEventListener('change', syncViewportSignals)
      coarseQuery.removeEventListener('change', syncViewportSignals)
      window.removeEventListener('resize', syncViewportSignals)
    }
  }, [])

  const shouldUseImmersiveFallback = isPresentationMode && !isFullscreen && isLandscape && isCoarsePointer

  useEffect(() => {
    if (!shouldUseImmersiveFallback) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [shouldUseImmersiveFallback])

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

  useEffect(() => {
    const fullscreenDocument = document as FullscreenCapableDocument
    const syncFullscreenState = () => {
      const activeElement = document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null
      setIsFullscreen(Boolean(activeElement))
    }

    syncFullscreenState()
    document.addEventListener('fullscreenchange', syncFullscreenState)
    document.addEventListener('webkitfullscreenchange', syncFullscreenState as EventListener)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState as EventListener)
    }
  }, [])

  useEffect(() => {
    if (isPresentationMode) {
      return
    }

    const fullscreenDocument = document as FullscreenCapableDocument
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {})
      return
    }
    if (fullscreenDocument.webkitFullscreenElement) {
      try {
        void fullscreenDocument.webkitExitFullscreen?.()
      } catch {
        // Ignore exit errors when browser does not allow scripted exit.
      }
    }
  }, [isPresentationMode])

  const togglePresentationMode = () => {
    const next = new URLSearchParams(searchParams)
    if (isPresentationMode) {
      next.delete('mode')
    } else {
      next.set('mode', 'present')
    }
    setSearchParams(next, { replace: true })
  }

  const toggleFullscreen = async () => {
    setFullscreenError(null)
    const fullscreenDocument = document as FullscreenCapableDocument
    const targetElement = presentationContainerRef.current as FullscreenCapableElement | null

    if (!targetElement) {
      setFullscreenError('Fullscreen target is not available on this device.')
      return
    }

    try {
      const activeElement = document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null
      if (activeElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
          return
        }
        if (fullscreenDocument.webkitExitFullscreen) {
          await fullscreenDocument.webkitExitFullscreen()
          return
        }
        setFullscreenError('Fullscreen exit is not supported in this browser.')
        return
      }

      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen()
        return
      }
      if (targetElement.webkitRequestFullscreen) {
        await targetElement.webkitRequestFullscreen()
        return
      }
      setFullscreenError('Fullscreen is not available in this browser.')
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
      setFullscreenError('Unable to switch fullscreen mode. Check browser permissions and try again.')
    }
  }

  const activeMezmur = mezmurs[activeSlide]
  const dateLabel = preview?.scheduledDate ? formatClassDate(preview.scheduledDate) : 'Upcoming Timirit'

  return (
    <div
      ref={presentationContainerRef}
      className={`min-h-dvh bg-brand-50 text-brand-900 print:bg-white ${
        isPresentationMode ? 'fullscreen:bg-brand-950 fullscreen:text-white' : ''
      }`}
    >
      <main
        className={`mx-auto w-full ${
          isPresentationMode
            ? shouldUseImmersiveFallback
              ? 'fixed inset-0 z-80 h-dvh min-h-screen w-screen overflow-y-auto bg-brand-950 px-3 py-2 text-white'
              : 'max-w-none px-3 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6 fullscreen:h-dvh fullscreen:px-6 fullscreen:py-4'
            : 'max-w-480 px-4 py-4 sm:px-8 sm:py-8'
        }`}
      >
        <section
          className={`${
            isPresentationMode
              ? shouldUseImmersiveFallback
                ? 'rounded-none border-0 bg-transparent p-0 shadow-none'
                : 'rounded-2xl border border-brand-200/80 bg-white/95 p-4 shadow-sm sm:p-6'
              : 'rounded-3xl border border-brand-200/90 bg-white/90 p-5 shadow-sm sm:p-8 lg:p-10'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                  shouldUseImmersiveFallback ? 'text-brand-200' : 'text-brand-700'
                }`}
              >
                {CHURCH_SHORT_NAME}
              </p>
              <h1
                className={`mt-2 font-bold ${
                  shouldUseImmersiveFallback ? 'text-2xl text-white sm:text-3xl' : 'text-3xl text-brand-900 sm:text-5xl'
                }`}
              >
                Upcoming Mezmurs
              </h1>
              <p className={`mt-1 text-sm sm:text-base ${shouldUseImmersiveFallback ? 'text-brand-100' : 'text-brand-700 sm:text-xl'}`}>
                {preview?.topicPreview || dateLabel}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center print:hidden">
              <button
                type="button"
                onClick={togglePresentationMode}
                className={`inline-flex items-center justify-center rounded-2xl bg-accent-600 font-bold text-white shadow-md shadow-accent-700/30 transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 ${
                  shouldUseImmersiveFallback ? 'min-h-11 px-4 py-2 text-sm' : 'min-h-14 px-6 py-3 text-base'
                }`}
              >
                {isPresentationMode ? 'Exit Presentation' : 'Launch Projector Mode'}
              </button>
              {isPresentationMode ? (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold ${
                    shouldUseImmersiveFallback
                      ? 'min-h-10 border-brand-200/50 bg-brand-900/70 text-white hover:bg-brand-800'
                      : 'min-h-12 border-brand-200 bg-white text-brand-900 hover:bg-brand-50'
                  }`}
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </button>
              ) : (
                <Link
                  to="/mezmurs"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Back to mezmur page
                </Link>
              )}
            </div>
          </div>
          {isPresentationMode && !isFullscreen && isCoarsePointer ? (
            <p className={`mt-2 text-xs ${shouldUseImmersiveFallback ? 'text-brand-300' : 'text-brand-600'}`}>
              Rotate to landscape for immersive mobile presentation view.
            </p>
          ) : null}
          {isPresentationMode && fullscreenError ? (
            <p className={`mt-3 text-sm font-medium ${shouldUseImmersiveFallback ? 'text-rose-300' : 'text-rose-700'}`}>
              {fullscreenError}
            </p>
          ) : null}
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
          <section
            className={`mt-5 ${
              isPresentationMode
                ? shouldUseImmersiveFallback
                  ? 'mt-2 flex h-[calc(100dvh-5.75rem)] flex-col overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none'
                  : 'rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8 fullscreen:mt-3 fullscreen:flex fullscreen:h-[calc(100dvh-10rem)] fullscreen:flex-col fullscreen:overflow-auto fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-transparent fullscreen:p-0 fullscreen:shadow-none'
                : 'rounded-3xl border border-brand-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10'
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${shouldUseImmersiveFallback ? 'text-brand-300' : 'text-brand-700'}`}>
              Mezmur {activeSlide + 1} of 2
            </p>
            <h2
              className={`mt-3 font-bold leading-tight text-brand-900 ${
                isPresentationMode
                  ? shouldUseImmersiveFallback
                    ? 'text-3xl text-white sm:text-5xl'
                    : 'text-4xl sm:text-6xl lg:text-7xl fullscreen:text-white'
                  : 'text-3xl sm:text-5xl lg:text-6xl'
              }`}
            >
              {activeMezmur.title || `Mezmur ${activeSlide + 1} (TBD)`}
            </h2>

            {activeMezmur.transliteration ? (
              <p
                className={`mt-4 italic ${
                  isPresentationMode
                    ? shouldUseImmersiveFallback
                      ? 'text-lg text-brand-100 sm:text-2xl'
                      : 'text-2xl text-brand-700 sm:text-3xl fullscreen:text-brand-100'
                    : 'text-xl text-brand-700 sm:text-3xl'
                }`}
              >
                {activeMezmur.transliteration}
              </p>
            ) : null}

            <div
              className={`mt-6 ${
                isPresentationMode
                  ? shouldUseImmersiveFallback
                    ? 'mt-4 flex-1 overflow-y-auto rounded-none border-0 bg-transparent p-0'
                    : 'rounded-2xl border border-brand-100 bg-brand-50/80 p-5 sm:p-8 fullscreen:flex-1 fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-transparent fullscreen:p-0'
                  : 'rounded-2xl border border-brand-100 bg-brand-50/70 p-5 sm:p-8'
              }`}
            >
              <p
                className={`whitespace-pre-wrap ${
                  isPresentationMode
                    ? shouldUseImmersiveFallback
                      ? 'text-2xl leading-snug text-white sm:text-4xl'
                      : 'text-2xl leading-relaxed text-brand-900 sm:text-4xl sm:leading-snug lg:text-5xl fullscreen:text-white'
                    : 'text-lg leading-relaxed text-brand-900 sm:text-2xl sm:leading-loose'
                }`}
              >
                {activeMezmur.lyrics?.trim() || LYRICS_PLACEHOLDER}
              </p>
            </div>

            <div
              className={`mt-4 flex flex-wrap gap-2 print:hidden ${
                shouldUseImmersiveFallback ? 'border-t border-brand-700/70 pt-3' : 'fullscreen:mt-6'
              }`}
            >
              {activeMezmur.audioUrl ? (
                <a
                  href={activeMezmur.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold ${
                    shouldUseImmersiveFallback
                      ? 'border border-brand-200/40 bg-brand-900/70 text-white hover:bg-brand-800'
                      : 'border border-brand-200 bg-white text-brand-900 hover:bg-brand-50'
                  }`}
                >
                  Listen Audio
                </a>
              ) : null}
              {activeMezmur.youtubeUrl ? (
                <a
                  href={activeMezmur.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold ${
                    shouldUseImmersiveFallback
                      ? 'border border-brand-200/40 bg-brand-900/70 text-white hover:bg-brand-800'
                      : 'border border-brand-200 bg-white text-brand-900 hover:bg-brand-50'
                  }`}
                >
                  Open YouTube
                </a>
              ) : null}
            </div>

            <div className={`mt-5 flex items-center justify-between gap-3 print:hidden ${shouldUseImmersiveFallback ? '' : 'fullscreen:mt-8'}`}>
              <button
                type="button"
                onClick={() => setActiveSlide((current) => Math.max(current - 1, 0))}
                disabled={activeSlide === 0}
                className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                  shouldUseImmersiveFallback
                    ? 'border border-brand-200/40 bg-brand-900/70 text-white enabled:hover:bg-brand-800'
                    : 'border border-brand-200 bg-white text-brand-900 enabled:hover:bg-brand-50'
                }`}
              >
                Previous Mezmur
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((current) => Math.min(current + 1, mezmurs.length - 1))}
                disabled={activeSlide === mezmurs.length - 1}
                className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold text-white enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  shouldUseImmersiveFallback ? 'bg-accent-500' : 'bg-accent-600'
                }`}
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
