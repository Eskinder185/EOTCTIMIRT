import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { CURRENT_TOPIC } from '../site/constants'

const organizerLinks = [
  { label: 'Organizer Login', href: '/admin/login' },
  { label: 'Weekly Classes', href: '/admin/weekly-classes' },
  { label: 'Upcoming Timirit', href: '/admin/upcoming' },
  { label: 'About', href: '/about' },
]

const organizerActions = [
  {
    title: 'Manage Weekly Class',
    detail: 'Open the class editor to update the topic, summaries, verses, and replay link.',
    href: '/admin/weekly-classes/new',
  },
  {
    title: 'Manage Mezmurs',
    detail: 'Prepare the two weekly mezmurs with transliteration, lyrics, and practice links.',
    href: '/admin/weekly-classes/new#mezmur-editor',
  },
  {
    title: 'Manage Questions',
    detail: 'Create multiple-choice, reflection, feedback, and attendance questions for the week.',
    href: '/admin/weekly-classes/new#questions-editor',
  },
  {
    title: 'Manage Upcoming Timirit',
    detail: 'Update the next Tuesday preview and the two upcoming mezmurs for the parish site.',
    href: '/admin/upcoming',
  },
]

export function OrganizerDashboardPage() {
  return (
    <div className="space-y-4">
      <nav className="rounded-2xl border border-brand-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {organizerLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-brand-900 shadow-sm transition-colors hover:bg-brand-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Organizer page
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          Organizer tools for weekly Timirit
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          A simple path for parish organizers to update {CURRENT_TOPIC.english} ({CURRENT_TOPIC.amharic}),
          prepare mezmurs, and publish the next Tuesday preview without coding.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {organizerActions.map((action) => (
          <Card key={action.title}>
            <h2 className="text-lg font-semibold text-brand-900">{action.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">{action.detail}</p>
            <Link
              to={action.href}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 shadow-sm transition-colors hover:bg-brand-50"
            >
              Open
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">How organizers should use this page</h2>
        <p className="text-sm text-brand-700">
          Use this page as a simple entry point into the private organizer tools. The public site remains separate,
          and Google Meet stays off the public pages.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-900">
          <li>Open the weekly class editor to update the current Tuesday teaching.</li>
          <li>Keep the two mezmurs ready with clear titles, transliteration, and lyrics.</li>
          <li>Prepare simple follow-up questions that help the parish review with peace and clarity.</li>
          <li>Update the upcoming Timirit preview only when the next topic is confirmed.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Private organizer area</h2>
        <p className="text-sm text-brand-700">
          The actual editing tools live in the protected admin area. Use the organizer login button above to continue.
        </p>
        <Link
          to="/admin/login"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 shadow-sm transition-colors hover:bg-brand-50"
        >
          Go to organizer login
        </Link>
      </Card>
    </div>
  )
}
