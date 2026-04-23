const GOOGLE_DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com'])

function safeParseUrl(value?: string) {
  if (!value?.trim()) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function isGoogleDriveLink(value?: string): boolean {
  const parsed = safeParseUrl(value)
  if (!parsed) return false
  return GOOGLE_DRIVE_HOSTS.has(parsed.hostname)
}

export function getGoogleDriveFileId(value?: string): string | null {
  const parsed = safeParseUrl(value)
  if (!parsed || !isGoogleDriveLink(value)) return null

  const idFromQuery = parsed.searchParams.get('id')
  if (idFromQuery) return idFromQuery

  const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/)
  if (fileMatch?.[1]) return fileMatch[1]

  const ucPathMatch = parsed.pathname.match(/\/uc$/)
  if (ucPathMatch) {
    const ucId = parsed.searchParams.get('id')
    if (ucId) return ucId
  }

  return null
}

export function getGoogleDriveDownloadUrl(value?: string): string | null {
  const fileId = getGoogleDriveFileId(value)
  if (!fileId) return null
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}
