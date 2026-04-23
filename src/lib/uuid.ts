const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Returns a canonical UUID string, or undefined if missing / invalid (e.g. empty string from drafts). */
export function parseOptionalUuid(id: string | undefined | null): string | undefined {
  const t = id?.trim()
  if (!t) {
    return undefined
  }
  return UUID_RE.test(t) ? t : undefined
}
