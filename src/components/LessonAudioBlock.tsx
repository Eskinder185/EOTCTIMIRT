import { getGoogleDriveDownloadUrl, isGoogleDriveLink } from '../lib/googleDrive'

type LessonAudioBlockProps = {
  audioUrl?: string
  audioTitle?: string
  audioNote?: string
  sectionTitle?: string
  className?: string
}

export function LessonAudioBlock({
  audioUrl,
  audioTitle,
  audioNote,
  sectionTitle = 'Lesson Audio',
  className = '',
}: LessonAudioBlockProps) {
  if (!audioUrl?.trim()) return null

  const isGoogleDriveAudio = isGoogleDriveLink(audioUrl)
  const downloadUrl = getGoogleDriveDownloadUrl(audioUrl) ?? audioUrl

  if (isGoogleDriveAudio) {
    return (
      <div className={`rounded-xl border border-brand-100 bg-brand-50/40 p-3 ${className}`}>
        <p className="text-base font-semibold text-brand-900">{sectionTitle}</p>
        {audioTitle?.trim() ? <p className="mt-1 text-sm font-semibold text-brand-900">{audioTitle}</p> : null}
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          This audio is provided through Google Drive. For the best experience, open or download it and listen in your preferred audio app.
        </p>
        {audioNote?.trim() ? <p className="mt-2 text-sm leading-relaxed text-brand-700">{audioNote}</p> : null}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-600 px-4 text-sm font-semibold text-white hover:opacity-95"
          >
            Download Audio
          </a>
          <a
            href={audioUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Open in Google Drive
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-brand-100 bg-brand-50/40 p-3 ${className}`}>
      <p className="text-base font-semibold text-brand-900">{sectionTitle}</p>
      <p className="mt-1 text-sm font-semibold text-brand-900">
        {audioTitle?.trim() || 'Listen to the Lesson'}
      </p>
      {audioNote?.trim() ? <p className="mt-2 text-sm leading-relaxed text-brand-700">{audioNote}</p> : null}
      <audio controls preload="none" className="mt-2 w-full">
        <source src={audioUrl} />
        Your browser does not support audio playback.
      </audio>
    </div>
  )
}
