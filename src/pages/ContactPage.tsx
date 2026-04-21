import {
  CHURCH_ADDRESS,
  CHURCH_FULL_NAME,
  CHURCH_MAPS_URL,
  ORGANIZER_SUPPORT,
  TELEGRAM_GROUP_NAME,
  TIMIRT_SCHEDULE_LABEL,
  PRIEST_INFO,
} from '../site/constants'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'

/**
 * Quiet support page — contact is visible but never shouty (per parish request).
 */
export function ContactPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Help & fellowship
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Contact / join support</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          Reach out for Telegram access, questions about
          Tuesday Timirit. All support is offered in love for our Ethiopian Orthodox
          Tewahedo parish family, under the guidance of {PRIEST_INFO.name}.
        </p>
      </div>

      <Card>
        <p className="text-sm font-semibold text-brand-900">Primary Timirit organizer</p>
        <p className="mt-2 text-sm text-brand-800">{ORGANIZER_SUPPORT.primary.name}</p>
        <p className="mt-1 text-sm text-brand-700">
          Telegram contact:{' '}
          <a
            className="inline-flex min-h-11 items-center font-semibold text-accent-600 underline-offset-2 hover:underline"
            href={`tel:${ORGANIZER_SUPPORT.primary.phoneTel}`}
          >
            {ORGANIZER_SUPPORT.primary.phoneDisplay}
          </a>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-brand-700">
          Please message during reasonable hours. This number is for Timirit logistics —
          spiritual counsel remains with your father of confession.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-brand-900">Secondary Timirit organizer</p>
        <p className="mt-2 text-sm text-brand-800">{ORGANIZER_SUPPORT.secondary.name}</p>
        <p className="mt-1 text-sm text-brand-700">
          Telegram contact:{' '}
          <a
            className="inline-flex min-h-11 items-center font-semibold text-accent-600 underline-offset-2 hover:underline"
            href={`tel:${ORGANIZER_SUPPORT.secondary.phoneTel}`}
          >
            {ORGANIZER_SUPPORT.secondary.phoneDisplay}
          </a>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-brand-700">
          Alternative contact for coordination and support questions.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-brand-900">Telegram group</p>
        <p className="mt-2 text-sm font-medium text-brand-900">{TELEGRAM_GROUP_NAME}</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Contact either organizer above to be added so the parish family chat stays protected.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-brand-900">Church address</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">{CHURCH_FULL_NAME}</p>
        <p className="mt-2 text-sm text-brand-900">{CHURCH_ADDRESS}</p>
        <p className="mt-1 text-sm text-brand-700">{TIMIRT_SCHEDULE_LABEL}</p>
        <a
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:border-brand-300"
          href={CHURCH_MAPS_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open directions in Google Maps
        </a>
      </Card>

      <RouterLinkButton to="/this-week" variant="secondary" className="w-full sm:w-auto">
        Back to this week’s Timirit
      </RouterLinkButton>
    </div>
  )
}
