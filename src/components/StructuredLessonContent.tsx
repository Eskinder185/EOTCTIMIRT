import { useUiLanguage } from '../contexts/LanguageContext'
import type { TeachingMainPoint } from '../data/types'
import { getLocalizedText, hasLocalizedText } from '../lib/localizedText'

type BilingualText = {
  en?: string
  am?: string
}

interface StructuredLessonContentProps {
  summary?: BilingualText | null
  mainPoints?: TeachingMainPoint[] | null
  sectionTitle?: string
  summaryLabel?: string
  mainPointsLabel?: string
  compact?: boolean
  className?: string
}

export function StructuredLessonContent({
  summary,
  mainPoints,
  sectionTitle = 'Teaching overview',
  summaryLabel = 'Short summary',
  mainPointsLabel = 'Main points',
  compact = false,
  className,
}: StructuredLessonContentProps) {
  const { language } = useUiLanguage()
  const summaryText = getLocalizedText(summary, language).trim()
  const visibleMainPoints = (mainPoints ?? [])
    .filter((point) => hasLocalizedText(point))
    .map((point) => getLocalizedText(point, language).trim())
    .filter(Boolean)

  if (!summaryText && visibleMainPoints.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <h3 className={`font-semibold text-brand-900 ${compact ? 'text-sm' : 'text-base'}`}>{sectionTitle}</h3>
      {summaryText ? (
        <div className={compact ? 'mt-2' : 'mt-3'}>
          <p className={`font-medium text-brand-800 ${compact ? 'text-xs' : 'text-sm'}`}>{summaryLabel}</p>
          <p className={`mt-1 leading-relaxed text-brand-800 ${compact ? 'text-sm' : 'text-sm'}`}>{summaryText}</p>
        </div>
      ) : null}
      {visibleMainPoints.length > 0 ? (
        <div className={compact ? 'mt-3' : 'mt-4'}>
          <p className={`font-semibold text-brand-900 ${compact ? 'text-xs' : 'text-sm'}`}>{mainPointsLabel}</p>
          <ol className={`mt-2 space-y-2 ${compact ? 'text-sm' : 'text-sm'}`}>
            {visibleMainPoints.map((point, index) => (
              <li key={`${point}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2 text-brand-800">
                <span className="mr-2 font-semibold text-brand-900">{index + 1}.</span>
                {point}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
