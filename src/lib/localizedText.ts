import type { UiLanguage } from '../contexts/LanguageContext'
import type { LocalizedText } from '../data/types'

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Empty bilingual fields for controlled form inputs. */
export function emptyLocalizedText(): LocalizedText {
  return { en: '', am: '' }
}

/**
 * Trim `en` / `am`; omit keys that are empty after trim.
 */
export function normalizeLocalizedText(value: Partial<LocalizedText> | null | undefined): LocalizedText {
  if (!value) {
    return {}
  }
  const en = value.en?.trim()
  const am = value.am?.trim()
  const out: LocalizedText = {}
  if (en) {
    out.en = en
  }
  if (am) {
    out.am = am
  }
  return out
}

/**
 * Preferred language first, then the other language if missing (same rules as site UI).
 */
export function getLocalizedText(value: LocalizedText | null | undefined, language: UiLanguage): string {
  const n = normalizeLocalizedText(value)
  if (language === 'am') {
    return n.am ?? n.en ?? ''
  }
  return n.en ?? n.am ?? ''
}

export function hasLocalizedText(value: LocalizedText | null | undefined): boolean {
  const n = normalizeLocalizedText(value)
  return Boolean(n.en || n.am)
}

/** True if any argument has non-whitespace text (for “at least one language” checks on separate fields). */
export function hasAnyTrimmedText(...values: Array<string | null | undefined>): boolean {
  return values.some((v) => Boolean(v?.trim()))
}

/**
 * Accepts `{ en, am }`, a legacy plain string, or empty input — for API/JSON/draft payloads.
 */
export function coerceLocalizedText(value: unknown): LocalizedText {
  if (typeof value === 'string') {
    const t = value.trim()
    return t ? { en: t } : {}
  }
  if (isPlainRecord(value)) {
    const en = value.en
    const am = value.am
    return normalizeLocalizedText({
      en: typeof en === 'string' ? en : undefined,
      am: typeof am === 'string' ? am : undefined,
    })
  }
  return {}
}

/** Single legacy DB column: prefer English, then Amharic. */
export function legacySingleLineFromLocalized(value: LocalizedText | null | undefined): string | null {
  const n = normalizeLocalizedText(value)
  const line = n.en ?? n.am
  return line ? line : null
}

/**
 * Drop empty choices; remap `correctIndex` to the new list. If the marked correct row was empty, use the first choice.
 */
export function compactLocalizedOptionsForSave(
  options: LocalizedText[],
  correctIndex: number,
): { options: LocalizedText[]; correctIndex: number } {
  const normalized = options.map((o) => normalizeLocalizedText(o))
  const keptEntries = normalized
    .map((opt, index) => ({ opt, index }))
    .filter((entry) => hasLocalizedText(entry.opt))
  const correctEntryIndex = keptEntries.findIndex((entry) => entry.index === correctIndex)
  const nextCorrect =
    correctEntryIndex >= 0 ? correctEntryIndex : keptEntries.length > 0 ? 0 : 0
  return {
    options: keptEntries.map((entry) => entry.opt),
    correctIndex: keptEntries.length > 0 ? Math.min(nextCorrect, keptEntries.length - 1) : 0,
  }
}
