import { toYouTubeEmbedUrl } from '../lib/youtube'

export function VideoEmbed({ url, title }: { url?: string; title: string }) {
  const embed = toYouTubeEmbedUrl(url)
  if (!embed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-brand-100/60 px-4 text-center">
        <p className="text-sm font-semibold text-brand-900">Recording coming soon</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-700">
          When your YouTube link is ready, add it to the weekly data — the player will
          appear here automatically.
        </p>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-200 shadow-sm">
      <iframe
        title={`${title} recording`}
        src={`${embed}?rel=0`}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
