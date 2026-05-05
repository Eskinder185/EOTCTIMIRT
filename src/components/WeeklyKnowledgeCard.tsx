import type { WeeklyKnowledgeItem } from '../data/weeklyKnowledge'
import { useUiLanguage } from '../contexts/LanguageContext'
import { displayBilingualLine } from '../lib/localizedText'
import { Card } from './ui/Card'

interface WeeklyKnowledgeCardProps {
  item: WeeklyKnowledgeItem
}

export function WeeklyKnowledgeCard({ item }: WeeklyKnowledgeCardProps) {
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const isUsableHttpLink = (value?: string) => {
    if (!value?.trim()) return false
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const titleDisplay = displayBilingualLine(language, item.titleEn, item.titleAm, item.title).trim()
  const subtitleDisplay = displayBilingualLine(language, item.subtitleEn, item.subtitleAm, item.subtitle).trim()
  const contentDisplay = displayBilingualLine(language, item.contentEn, item.contentAm, item.content).trim()
  const extraNoteDisplay = displayBilingualLine(language, item.extraNoteEn, item.extraNoteAm, item.extraNote).trim()
  const buttonLabelDisplay = (item.buttonText ?? '').trim()

  const hasUsableImage = isUsableHttpLink(item.imageUrl)
  const hasButton = Boolean(buttonLabelDisplay && isUsableHttpLink(item.buttonLink))
  const isExternalButton = Boolean(item.buttonLink?.trim()?.startsWith('http'))

  const hasTextBlock = Boolean(titleDisplay || subtitleDisplay || contentDisplay || extraNoteDisplay)
  if (!hasTextBlock && !hasUsableImage && !hasButton) {
    return null
  }

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        {isAm ? 'የዚህ ሳምንት እውቀት' : "This Week's Knowledge"}
      </p>
      {titleDisplay ? <h2 className="mt-1 text-lg font-semibold text-brand-900">{titleDisplay}</h2> : null}
      {subtitleDisplay ? <p className="mt-1 text-sm text-brand-700">{subtitleDisplay}</p> : null}
      {contentDisplay ? <p className="mt-3 text-sm leading-relaxed text-brand-800">{contentDisplay}</p> : null}
      {extraNoteDisplay ? (
        <p className="mt-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-700">
          {extraNoteDisplay}
        </p>
      ) : null}
      {hasUsableImage ? (
        <img
          src={item.imageUrl}
          alt={titleDisplay || subtitleDisplay || "This week's knowledge"}
          className="mt-3 max-h-64 w-full rounded-xl border border-brand-100 object-cover"
          loading="lazy"
        />
      ) : null}
      {hasButton ? (
        <a
          href={item.buttonLink}
          target={isExternalButton ? '_blank' : undefined}
          rel={isExternalButton ? 'noopener noreferrer' : undefined}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-accent-600 hover:bg-brand-50"
        >
          {buttonLabelDisplay}
        </a>
      ) : isUsableHttpLink(item.buttonLink) ? (
        <a
          href={item.buttonLink}
          target={isExternalButton ? '_blank' : undefined}
          rel={isExternalButton ? 'noopener noreferrer' : undefined}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-accent-600 hover:bg-brand-50"
        >
          {isAm ? 'ተጨማሪ ይመልከቱ' : 'Learn more'}
        </a>
      ) : null}
    </Card>
  )
}
