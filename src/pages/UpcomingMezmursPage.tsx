import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getUpcomingPreview } from '../data/weeksRepo'
import type { Mezmur } from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import { useUiLanguage } from '../contexts/LanguageContext'
import { displayBilingualLine } from '../lib/localizedText'
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

function elementSupportsFullscreen(el: HTMLElement | null): boolean {
  if (!el) return false
  const e = el as FullscreenCapableElement
  return typeof e.requestFullscreen === 'function' || typeof e.webkitRequestFullscreen === 'function'
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
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const [searchParams, setSearchParams] = useSearchParams()
  const isPresentationMode = searchParams.get('mode') === 'present'
  const [preview, setPreview] = useState<UpcomingTimirtPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
  const [supportsElementFullscreen, setSupportsElementFullscreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const presentationContainerRef = useRef<HTMLDivElement | null>(null)
  const swipeStartX = useRef<number | null>(null)

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

  /** Touch phones/tablets: dedicated dark presentation chrome without requiring native fullscreen or landscape. */
  const immersiveTouchPresentation = isPresentationMode && isCoarsePointer
  const lockBodyScroll = immersiveTouchPresentation && !isFullscreen

  useLayoutEffect(() => {
    if (!isPresentationMode) {
      setSupportsElementFullscreen(false)
      return
    }
    const id = requestAnimationFrame(() => {
      const el = presentationContainerRef.current
      setSupportsElementFullscreen(elementSupportsFullscreen(el))
    })
    return () => cancelAnimationFrame(id)
  }, [isPresentationMode, loading])

  useEffect(() => {
    if (!lockBodyScroll) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [lockBodyScroll])

  useEffect(() => {
    if (immersiveTouchPresentation) {
      setFullscreenError(null)
    }
  }, [immersiveTouchPresentation])

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
    const softFail = () => isCoarsePointer

    if (!targetElement) {
      if (!softFail()) {
        setFullscreenError('Fullscreen target is not available on this device.')
      }
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
        if (!softFail()) {
          setFullscreenError('Fullscreen exit is not supported in this browser.')
        }
        return
      }

      if (!elementSupportsFullscreen(targetElement)) {
        if (!softFail()) {
          setFullscreenError('Fullscreen is not available in this browser.')
        }
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
      if (!softFail()) {
        setFullscreenError('Fullscreen is not available in this browser.')
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
      if (!softFail()) {
        setFullscreenError('Unable to switch fullscreen mode. Check browser permissions and try again.')
      }
    }
  }

  const onLyricsTouchStart = (event: React.TouchEvent) => {
    if (!isPresentationMode) return
    swipeStartX.current = event.touches[0]?.clientX ?? null
  }

  const onLyricsTouchEnd = (event: React.TouchEvent) => {
    if (!isPresentationMode || swipeStartX.current == null) return
    const endX = event.changedTouches[0]?.clientX
    if (endX == null) {
      swipeStartX.current = null
      return
    }
    const dx = endX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(dx) < 56) return
    if (dx < 0) {
      setActiveSlide((current) => Math.min(current + 1, mezmurs.length - 1))
    } else {
      setActiveSlide((current) => Math.max(current - 1, 0))
    }
  }

  const activeMezmur = mezmurs[activeSlide]
  const dateLabel = preview?.scheduledDate
    ? formatClassDate(preview.scheduledDate, language)
    : language === 'am'
      ? 'የሚቀጥለው ትምህርት'
      : 'Upcoming Timirt'

  return (
    <div
      ref={presentationContainerRef}
      className={`min-h-dvh bg-brand-50 text-brand-900 print:bg-white ${
        immersiveTouchPresentation ? 'bg-brand-950 text-white' : ''
      } ${isPresentationMode ? 'fullscreen:bg-brand-950 fullscreen:text-white' : ''}`}
    >
      <main
        className={`mx-auto w-full ${
          isPresentationMode
            ? immersiveTouchPresentation
              ? 'fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] min-h-0 w-screen flex-col overflow-hidden bg-brand-950 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] text-white'
              : 'max-w-none px-3 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6 fullscreen:h-dvh fullscreen:px-6 fullscreen:py-4'
            : 'max-w-480 px-4 py-4 sm:px-8 sm:py-8'
        }`}
      >
        <section
          className={`${
            isPresentationMode
              ? immersiveTouchPresentation
                ? 'shrink-0 rounded-none border-0 bg-transparent p-0 shadow-none'
                : 'rounded-2xl border border-brand-200/80 bg-white/95 p-4 shadow-sm sm:p-6'
              : 'rounded-3xl border border-brand-200/90 bg-white/90 p-5 shadow-sm sm:p-8 lg:p-10'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                  immersiveTouchPresentation ? 'text-brand-200' : 'text-brand-700'
                }`}
              >
                {CHURCH_SHORT_NAME}
              </p>
              <h1
                className={`mt-2 font-bold ${
                  immersiveTouchPresentation ? 'text-2xl text-white sm:text-3xl' : 'text-3xl text-brand-900 sm:text-5xl'
                }`}
              >
                Upcoming Mezmurs
              </h1>
              <p className={`mt-1 text-sm sm:text-base ${immersiveTouchPresentation ? 'text-brand-100' : 'text-brand-700 sm:text-xl'}`}>
                {preview
                  ? displayBilingualLine(language, preview.topicPreviewEn, preview.topicPreviewAm, preview.topicPreview).trim() ||
                    dateLabel
                  : dateLabel}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center print:hidden">
              <button
                type="button"
                onClick={togglePresentationMode}
                className={`inline-flex items-center justify-center rounded-2xl bg-accent-600 font-bold text-white shadow-md shadow-accent-700/30 transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 ${
                  immersiveTouchPresentation ? 'min-h-12 px-4 py-3 text-base' : 'min-h-14 px-6 py-3 text-base'
                }`}
              >
                {isPresentationMode ? (isAm ? 'ፕሬዘንቴሽን ዝጋ' : 'Exit presentation') : isAm ? 'የፕሮጀክተር ሁኔታ ጀምር' : 'Launch Projector Mode'}
              </button>
              {isPresentationMode && (!isCoarsePointer || supportsElementFullscreen) ? (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold ${
                    immersiveTouchPresentation
                      ? 'min-h-12 border-brand-200/50 bg-brand-900/70 text-white hover:bg-brand-800'
                      : 'min-h-12 border-brand-200 bg-white text-brand-900 hover:bg-brand-50'
                  }`}
                >
                  {isFullscreen
                    ? isAm
                      ? 'ሙሉ ማያ ገጽ ዝጋ'
                      : 'Exit fullscreen'
                    : isAm
                      ? 'ሙሉ ማያ ገጽ (አማራጭ)'
                      : 'Enter fullscreen'}
                </button>
              ) : null}
              {!isPresentationMode ? (
                <Link
                  to="/mezmurs"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  {isAm ? 'ወደ መዝሙር ገጽ ተመለስ' : 'Back to mezmur page'}
                </Link>
              ) : null}
            </div>
          </div>
          {immersiveTouchPresentation && !isLandscape ? (
            <p className="mt-2 text-xs leading-relaxed text-brand-300">
              {isAm
                ? 'ጠቋሚ፦ ለሰፊ የግጥም እይታ ስልክዎን ወደ አግድማዊ አቀማመጥ ማዞር ይችላሉ። በግጥም ላይ ወደ ግራ ወይም ወደ ቀኝ ይጎትቱ — ቀዳሚ / ቀጣይ መዝሙር።'
                : 'Tip: rotate your phone for a wider lyrics view. Swipe left or right on the lyrics to go to the next or previous mezmur.'}
            </p>
          ) : null}
          {immersiveTouchPresentation && isLandscape ? (
            <p className="mt-2 text-xs text-brand-300">
              {isAm ? 'በግጥም ላይ ወደ ግራ ወይም ወደ ቀኝ ይጎትቱ — ቀዳሚ / ቀጣይ መዝሙር።' : 'Swipe left or right on the lyrics for previous / next mezmur.'}
            </p>
          ) : null}
          {isPresentationMode && fullscreenError ? (
            <p className={`mt-3 text-sm font-medium ${immersiveTouchPresentation ? 'text-rose-300' : 'text-rose-700'}`}>
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
                ? immersiveTouchPresentation
                  ? 'mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none'
                  : 'rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8 fullscreen:mt-3 fullscreen:flex fullscreen:h-[calc(100dvh-10rem)] fullscreen:flex-col fullscreen:overflow-auto fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-transparent fullscreen:p-0 fullscreen:shadow-none'
                : 'rounded-3xl border border-brand-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10'
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${immersiveTouchPresentation ? 'text-brand-300' : 'text-brand-700'}`}>
              Mezmur {activeSlide + 1} of 2
            </p>
            <h2
              className={`mt-3 font-bold leading-tight ${
                isPresentationMode
                  ? immersiveTouchPresentation
                    ? 'text-3xl text-white sm:text-5xl'
                    : 'text-brand-900 text-4xl sm:text-6xl lg:text-7xl fullscreen:text-white'
                  : 'text-brand-900 text-3xl sm:text-5xl lg:text-6xl'
              }`}
            >
              {displayBilingualLine(language, activeMezmur.titleEn, activeMezmur.titleAm, activeMezmur.title).trim() ||
                `Mezmur ${activeSlide + 1} (TBD)`}
            </h2>

            {activeMezmur.transliteration ? (
              <p
                className={`mt-4 italic ${
                  isPresentationMode
                    ? immersiveTouchPresentation
                      ? 'text-lg text-brand-100 sm:text-2xl'
                      : 'text-2xl text-brand-700 sm:text-3xl fullscreen:text-brand-100'
                    : 'text-xl text-brand-700 sm:text-3xl'
                }`}
              >
                {activeMezmur.transliteration}
              </p>
            ) : null}

            <div
              aria-label={immersiveTouchPresentation ? (isAm ? 'የመዝሙር ግጥም፣ ለቀዳሚ/ቀጣይ ይጎትቱ' : 'Mezmur lyrics; swipe for previous or next') : undefined}
              onTouchStart={onLyricsTouchStart}
              onTouchEnd={onLyricsTouchEnd}
              className={`mt-6 ${
                isPresentationMode
                  ? immersiveTouchPresentation
                    ? 'mt-4 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain rounded-none border-0 bg-transparent p-0'
                    : 'rounded-2xl border border-brand-100 bg-brand-50/80 p-5 sm:p-8 fullscreen:flex-1 fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-transparent fullscreen:p-0'
                  : 'rounded-2xl border border-brand-100 bg-brand-50/70 p-5 sm:p-8'
              }`}
            >
              <p
                className={`whitespace-pre-wrap ${
                  isPresentationMode
                    ? immersiveTouchPresentation
                      ? 'text-3xl leading-snug text-white sm:text-4xl sm:leading-snug'
                      : 'text-2xl leading-relaxed text-brand-900 sm:text-4xl sm:leading-snug lg:text-5xl fullscreen:text-white'
                    : 'text-lg leading-relaxed text-brand-900 sm:text-2xl sm:leading-loose'
                }`}
              >
                {activeMezmur.lyrics?.trim() || LYRICS_PLACEHOLDER}
              </p>
            </div>

            <div
              className={`mt-4 flex flex-wrap gap-2 print:hidden ${
                immersiveTouchPresentation ? 'border-t border-brand-700/70 pt-3' : 'fullscreen:mt-6'
              }`}
            >
              {activeMezmur.audioUrl ? (
                <a
                  href={activeMezmur.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold ${
                    immersiveTouchPresentation
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
                    immersiveTouchPresentation
                      ? 'border border-brand-200/40 bg-brand-900/70 text-white hover:bg-brand-800'
                      : 'border border-brand-200 bg-white text-brand-900 hover:bg-brand-50'
                  }`}
                >
                  Open YouTube
                </a>
              ) : null}
            </div>

            <div
              className={`mt-5 flex shrink-0 items-stretch justify-between gap-3 print:hidden sm:items-center ${
                immersiveTouchPresentation ? '' : 'fullscreen:mt-8'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveSlide((current) => Math.max(current - 1, 0))}
                disabled={activeSlide === 0}
                className={`inline-flex flex-1 items-center justify-center rounded-xl font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                  immersiveTouchPresentation
                    ? 'min-h-14 border border-brand-200/40 bg-brand-900/70 px-4 py-3 text-base text-white enabled:active:bg-brand-800 enabled:hover:bg-brand-800'
                    : 'min-h-10 border border-brand-200 bg-white px-4 py-2 text-sm text-brand-900 enabled:hover:bg-brand-50'
                }`}
              >
                {isAm ? 'ቀዳሚ መዝሙር' : 'Previous'}
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((current) => Math.min(current + 1, mezmurs.length - 1))}
                disabled={activeSlide === mezmurs.length - 1}
                className={`inline-flex flex-1 items-center justify-center rounded-xl font-semibold text-white enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                  immersiveTouchPresentation ? 'min-h-14 bg-accent-500 px-4 py-3 text-base enabled:active:bg-accent-600' : 'min-h-10 bg-accent-600 px-4 py-2 text-sm'
                }`}
              >
                {isAm ? 'ቀጣይ መዝሙር' : 'Next'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
