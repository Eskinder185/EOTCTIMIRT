import { useUiLanguage } from '../contexts/LanguageContext'
import type { Mezmur } from '../data/types'
import { pickLocalized } from '../lib/bilingualText'
import { normalizePracticeUrl } from '../lib/practiceLink'
import { useUiText } from '../lib/uiText'

export type MezmurActionCardContext = 'upcoming' | 'last-week'

function externalLinkProps(href: string) {
  return href.startsWith('http')
    ? { target: '_blank' as const, rel: 'noopener noreferrer' as const }
    : {}
}

export function MezmurActionCard({
  slot,
  mezmur,
  context,
  advancedPracticeUrl,
  hideAdvancedPractice,
}: {
  slot: 1 | 2
  mezmur: Pick<Mezmur, 'title' | 'titleEn' | 'titleAm' | 'transliteration' | 'youtubeUrl'>
  context?: MezmurActionCardContext
  advancedPracticeUrl?: string | null
  /** When true, omit the advanced-practice row (e.g. second mezmur shares the week’s single link on mezmur 1). */
  hideAdvancedPractice?: boolean
}) {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const titleDisplay = pickLocalized(language, mezmur.titleEn, mezmur.titleAm, mezmur.title)
  const youtube = mezmur.youtubeUrl?.trim()
  const hasYoutube = Boolean(youtube)
  const practiceHref = normalizePracticeUrl(advancedPracticeUrl)

  return (
    <article className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? `መዝሙር ${slot}` : `Mezmur ${slot}`}
        </p>
        {context ? (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">
            {context === 'upcoming' ? t('contextUpcoming') : t('contextLastWeek')}
          </span>
        ) : null}
      </div>
      <h3 className="mt-1.5 text-base font-semibold leading-snug text-brand-900 sm:text-lg">
        {titleDisplay.trim() || (isAm ? `መዝሙር ${slot} (በቅርቡ)` : `Mezmur ${slot} (TBD)`)}
      </h3>
      {mezmur.transliteration?.trim() ? (
        <p className="mt-1.5 rounded-lg border border-brand-100 bg-white px-2 py-1.5 text-sm italic leading-relaxed text-brand-700">
          {mezmur.transliteration}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {hasYoutube ? (
          <a
            href={youtube}
            {...externalLinkProps(youtube!)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95 sm:min-w-40 sm:flex-none"
          >
            {t('watchOnYouTube')}
          </a>
        ) : (
          <p className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-dashed border-brand-200 bg-white/60 px-3 text-center text-xs text-brand-600 sm:min-w-40 sm:flex-none">
            {t('youtubeComingSoon')}
          </p>
        )}
        {hideAdvancedPractice ? null : practiceHref ? (
          <a
            href={practiceHref}
            {...externalLinkProps(practiceHref)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-center text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50 sm:min-w-40 sm:flex-none"
          >
            {t('advancedPractice')}
          </a>
        ) : (
          <p className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-dashed border-brand-200 bg-white/60 px-3 text-center text-xs text-brand-600 sm:min-w-40 sm:flex-none">
            {isAm ? 'የላቀ ልምምድ አገናኝ በቅርቡ' : 'Advanced practice link not set yet'}
          </p>
        )}
      </div>
    </article>
  )
}
