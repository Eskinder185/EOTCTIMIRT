import {
  CHURCH_ADDRESS,
  CHURCH_MAPS_URL,
  CHURCH_SHORT_NAME,
  ORGANIZER_SUPPORT,
  PRIEST_INFO,
  TEACHER_INFO,
  TELEGRAM_GROUP_NAME,
  TIMIRT_SCHEDULE_LABEL,
} from '../site/constants'
import { AnonymousFeedbackForm } from '../components/AnonymousFeedbackForm'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'

const organizerCards = [
  { name: 'Sinte' },
  { name: 'Tsebaot' },
  {
    name: ORGANIZER_SUPPORT.secondary.name,
    phoneDisplay: ORGANIZER_SUPPORT.secondary.phoneDisplay,
    phoneTel: ORGANIZER_SUPPORT.secondary.phoneTel,
  },
  {
    name: ORGANIZER_SUPPORT.primary.name,
    phoneDisplay: ORGANIZER_SUPPORT.primary.phoneDisplay,
    phoneTel: ORGANIZER_SUPPORT.primary.phoneTel,
  },
  { name: 'Mariamawit' },
] as const

export function AboutPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          About
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">About EOTC Timirt</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          A public overview of where this weekly Timirt belongs, who supports it, and how parish members can join the Telegram group through the organizers.
        </p>
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Church information</p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">{CHURCH_SHORT_NAME}</h2>
        <p className="mt-2 text-sm text-brand-800">{CHURCH_ADDRESS}</p>
        <p className="mt-1 text-sm text-brand-700">{TIMIRT_SCHEDULE_LABEL}</p>
        <a
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50"
          href={CHURCH_MAPS_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open church location
        </a>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">About the Timirt</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          This weekly Timirt exists to help members understand, grow in, guard, and share the Ethiopian Orthodox Tewahedo faith with clarity, support, and consistency.
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">With Gratitude</p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand-800">
          <p>
            We give thanks to <span className="font-semibold text-brand-900">{PRIEST_INFO.name}</span> for being more than willing to provide the church conference room and the teachers needed so that the youth and parish community can receive support and knowledge to understand, grow in, and share the faith.
          </p>
          <p>
            We also give thanks to <span className="font-semibold text-brand-900">{TEACHER_INFO.name}</span>, who gives his time freely to help us understand the faith, grow in it, and become people who can also serve the religion in our own way using the talents God has given us. His teaching helps us understand more clearly what Ethiopian Orthodox truly means.
          </p>
          <p>
            Both of them sacrifice their time with love so that the youth and the wider church community may understand the faith more deeply.
          </p>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Leadership and support</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase text-brand-700">Teacher</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{TEACHER_INFO.name}</p>
            <p className="mt-1 text-sm text-brand-700">{TEACHER_INFO.nameAmharic}</p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase text-brand-700">Priest</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{PRIEST_INFO.name}</p>
            <p className="mt-1 text-sm text-brand-700">{PRIEST_INFO.nameAmharic}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Organizers</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">Support for joining the Telegram group</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              Reach out to the organizers below if you would like to be added to the Timirt Telegram group.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organizerCards.map((organizer) => (
            <div key={organizer.name} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-sm font-semibold text-brand-900">{organizer.name}</p>
              {'phoneDisplay' in organizer && organizer.phoneDisplay ? (
                <a
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-600 underline-offset-2 hover:underline"
                  href={`tel:${organizer.phoneTel}`}
                >
                  {organizer.phoneDisplay}
                </a>
              ) : (
                <p className="mt-2 text-sm text-brand-700">Organizer support</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-brand-100 bg-brand-50/40 shadow-none">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Telegram</p>
        <p className="mt-2 text-sm font-medium text-brand-900">{TELEGRAM_GROUP_NAME}</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          If you would like to join the group, please reach out to one of the organizers and they will help you get connected.
        </p>
      </Card>

      <Card className="border-brand-100 bg-brand-50/40 shadow-none">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Community feedback</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Members can also share anonymous website feedback, teaching feedback, future topic ideas, and general helpful notes.
        </p>
      </Card>

      <AnonymousFeedbackForm />

      <RouterLinkButton to="/upcoming" variant="secondary" className="w-full sm:w-auto">
        Back to next week’s class
      </RouterLinkButton>
    </div>
  )
}