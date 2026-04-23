const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

function parseYouTubeUrl(url?: string) {
  if (!url?.trim()) return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/**
 * Normalizes supported YouTube video links to an embed-friendly URL for iframes.
 * Intentionally ignores channel/profile URLs such as `/@channel`.
 */
export function toYouTubeEmbedUrl(url?: string): string | undefined {
  const parsed = parseYouTubeUrl(url)
  if (!parsed) return undefined
  if (!YOUTUBE_HOSTS.has(parsed.hostname)) return undefined

  const path = parsed.pathname

  // Already embed format
  const embedMatch = path.match(/^\/embed\/([^/?]+)/)
  if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`

  // watch?v=...
  if (path === '/watch') {
    const videoId = parsed.searchParams.get('v')
    if (videoId) return `https://www.youtube.com/embed/${videoId}`
  }

  // youtu.be/<id>
  if (parsed.hostname.includes('youtu.be')) {
    const shortId = path.replace('/', '').split('/')[0]
    if (shortId) return `https://www.youtube.com/embed/${shortId}`
  }

  // /shorts/<id> and /live/<id>
  const shortsOrLiveMatch = path.match(/^\/(?:shorts|live)\/([^/?]+)/)
  if (shortsOrLiveMatch?.[1]) return `https://www.youtube.com/embed/${shortsOrLiveMatch[1]}`

  return undefined
}
