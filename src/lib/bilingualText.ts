import type { UiLanguage } from '../contexts/LanguageContext'

export function trimToUndefined(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function pickLocalized(
  language: UiLanguage,
  english?: string | null,
  amharic?: string | null,
  legacy?: string | null,
): string {
  const en = trimToUndefined(english)
  const am = trimToUndefined(amharic)
  const leg = trimToUndefined(legacy)

  if (language === 'am') {
    return am ?? en ?? leg ?? ''
  }

  return en ?? am ?? leg ?? ''
}

export function hasAnyText(...values: Array<string | null | undefined>) {
  return values.some((value) => Boolean(trimToUndefined(value)))
}
