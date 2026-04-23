import { Card } from './ui/Card'
import { TEACHER_YOUTUBE_CHANNEL } from '../site/constants'

interface TeacherYoutubeChannelCardProps {
  /** Small uppercase label above the title (e.g. "Official teaching channel") */
  eyebrow?: string
  /** Optional override for the main heading */
  title?: string
  /** Optional override for supporting copy */
  description?: string
  /** CTA label for the external channel link */
  buttonLabel?: string
  className?: string
}

export function TeacherYoutubeChannelCard({
  eyebrow = 'Official teaching channel',
  title = TEACHER_YOUTUBE_CHANNEL.title,
  description = TEACHER_YOUTUBE_CHANNEL.description,
  buttonLabel = 'Open YouTube channel',
  className,
}: TeacherYoutubeChannelCardProps) {
  return (
    <Card className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
      <h2 className="mt-1 text-base font-semibold text-brand-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-800">{description}</p>
      <a
        href={TEACHER_YOUTUBE_CHANNEL.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-accent-600 hover:bg-brand-50 sm:w-auto"
      >
        {buttonLabel}
      </a>
    </Card>
  )
}
