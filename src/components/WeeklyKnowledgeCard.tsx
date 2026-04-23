import type { WeeklyKnowledgeItem } from '../data/weeklyKnowledge'
import { Card } from './ui/Card'

interface WeeklyKnowledgeCardProps {
  item: WeeklyKnowledgeItem
}

export function WeeklyKnowledgeCard({ item }: WeeklyKnowledgeCardProps) {
  const isUsableHttpLink = (value?: string) => {
    if (!value?.trim()) return false
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }
  const hasButton = Boolean(item.buttonText?.trim() && isUsableHttpLink(item.buttonLink))
  const isExternalButton = Boolean(item.buttonLink?.trim()?.startsWith('http'))
  const hasUsableImage = isUsableHttpLink(item.imageUrl)

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        This Week&apos;s Knowledge · {item.contentType}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-brand-900">{item.title}</h2>
      {item.subtitle ? (
        <p className="mt-1 text-sm text-brand-700">{item.subtitle}</p>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-brand-800">{item.content}</p>
      {item.extraNote ? (
        <p className="mt-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-700">
          {item.extraNote}
        </p>
      ) : null}
      {hasUsableImage ? (
        <img
          src={item.imageUrl}
          alt={item.title}
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
          {item.buttonText}
        </a>
      ) : null}
    </Card>
  )
}
