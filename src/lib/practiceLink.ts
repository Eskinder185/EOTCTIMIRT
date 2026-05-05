/** Normalize organizer-supplied practice links for safe external navigation. */
export function normalizePracticeUrl(raw: string | undefined | null): string | null {
  const v = raw?.trim()
  if (!v) return null
  try {
    const href = /^https?:\/\//i.test(v) ? v : `https://${v}`
    const u = new URL(href)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}
