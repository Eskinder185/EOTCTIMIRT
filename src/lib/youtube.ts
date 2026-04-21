/** Normalizes common YouTube links to an embed-friendly URL for iframes. */
export function toYouTubeEmbedUrl(url?: string): string | undefined {
  if (!url?.trim()) return undefined
  const trimmed = url.trim()
  if (trimmed.includes('youtube.com/embed/')) return trimmed
  const watch = trimmed.match(/[?&]v=([^&]+)/)
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`
  const short = trimmed.match(/youtu\.be\/([^?]+)/)
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`
  return undefined
}
