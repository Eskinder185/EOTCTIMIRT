import type { Mezmur } from '../data/types'
import { useUiLanguage } from '../contexts/LanguageContext'
import { normalizePracticeUrl } from '../lib/practiceLink'
import { useUiText } from '../lib/uiText'

export function MezmurCard({
  mezmur,
  index,
  advancedPracticeUrl,
}: {
  mezmur: Mezmur
  index: number
  advancedPracticeUrl?: string | null
}) {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const practiceHref = normalizePracticeUrl(advancedPracticeUrl)

  return (
    <article className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        {isAm ? `መዝሙር ${index}` : `Mezmur ${index}`}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-brand-900">{mezmur.title}</h3>
      {mezmur.transliteration ? (
        <p className="mt-1 text-sm italic text-brand-700">{mezmur.transliteration}</p>
      ) : null}
      {mezmur.lyrics ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-accent-600">
            {isAm ? 'ግጥም ይመልከቱ' : 'View lyrics'}
          </summary>
          <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-brand-900">
            {mezmur.lyrics}
          </p>
        </details>
      ) : (
        <p className="mt-3 text-sm text-brand-700">{isAm ? 'በቅርቡ ይገለጻል' : 'To be announced'}</p>
      )}
      <div className="mt-3 grid gap-2">
        {practiceHref ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 px-3 text-sm font-semibold text-accent-600 underline-offset-4 hover:underline"
            href={practiceHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('advancedPractice')}
          </a>
        ) : null}
        {mezmur.youtubeUrl ? (
          <a
            className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 px-3 text-sm font-semibold text-accent-600 underline-offset-4 hover:underline"
            href={mezmur.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isAm ? 'ዩቲዩብ ላይ ይክፈቱ' : 'Open reference on YouTube'}
          </a>
        ) : null}
      </div>
    </article>
  )
}
