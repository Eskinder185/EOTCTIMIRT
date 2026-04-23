/**
 * Normalize optional HTTP(S) URLs for Supabase.
 * Treats placeholders and pasted non-URLs as absent so we never write garbage into URL columns.
 */

function looksLikePlaceholderUrl(trimmed: string): boolean {
  if (/^https?:\/\/\.{2,}\s*$/i.test(trimmed)) {
    return true
  }
  if (/^https?:\/\/\s*$/i.test(trimmed)) {
    return true
  }
  try {
    const u = new URL(trimmed)
    const host = u.hostname.toLowerCase()
    if (host === '...' || /^\.\.+$/.test(host)) {
      return true
    }
    if (host === 'example.com' || host === 'www.example.com') {
      return true
    }
  } catch {
    return true
  }
  return false
}

/**
 * Returns a normalized https/http URL string, or null if empty / placeholder / invalid.
 * Rejects multiline input (e.g. lyrics pasted into a URL field).
 */
export function sanitizeOptionalHttpUrl(raw: string | undefined | null): string | null {
  const t = (raw ?? '').trim()
  if (!t) {
    return null
  }
  if (/[\r\n]/.test(t)) {
    return null
  }
  if (looksLikePlaceholderUrl(t)) {
    return null
  }
  try {
    const u = new URL(t)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null
    }
    return u.href
  } catch {
    return null
  }
}

/** True when the user typed something that is not empty but is not a usable http(s) URL. */
export function isNonEmptyInvalidHttpUrl(raw: string | undefined | null): boolean {
  const t = (raw ?? '').trim()
  if (!t) {
    return false
  }
  return sanitizeOptionalHttpUrl(raw) === null
}
