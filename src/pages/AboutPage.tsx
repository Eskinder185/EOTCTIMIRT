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
import { useUiText } from '../lib/uiText'

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
  const t = useUiText()

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('about')}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">About EOTC Timirt</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          A weekly Ethiopian Orthodox Tewahedo Timirt space for clear teaching, practical preparation,
          and faithful support for parish members.
        </p>
        <div className="mt-4 space-y-1 text-sm text-brand-800">
          <p className="font-semibold text-brand-900">{CHURCH_SHORT_NAME}</p>
          <p>{CHURCH_ADDRESS}</p>
          <p className="text-brand-700">{TIMIRT_SCHEDULE_LABEL}</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50"
            href={CHURCH_MAPS_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open church location
          </a>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-600 px-4 text-sm font-semibold text-white hover:opacity-95"
            href="#connect-support"
          >
            Reach organizers or join Telegram
          </a>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Mission</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          This Timirt exists to help members understand, grow in, guard, and share the Ethiopian
          Orthodox Tewahedo faith with clarity, consistency, and pastoral care.
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">With Gratitude</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          We thank God for the clergy and teachers who faithfully serve this Timirt for the youth
          and wider parish family.
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand-800">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">For our priest</p>
            <p className="mt-1">
              We give thanks to <span className="font-semibold text-brand-900">{PRIEST_INFO.name}</span> for
              opening the church space and supporting the teaching ministry so parish members can
              receive faithful guidance and grow in understanding.
            </p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">For our teacher</p>
            <p className="mt-1">
              We give thanks to <span className="font-semibold text-brand-900">{TEACHER_INFO.name}</span>, who
              gives his time with love so the parish can understand the faith more clearly and serve
              the Church with the gifts God has given.
            </p>
          </div>
          <p>
            May God bless their service as the parish continues to grow in Orthodox faith and life.
          </p>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Leadership</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-brand-50/25 p-3">
            <p className="text-xs font-semibold uppercase text-brand-700">Teacher</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{TEACHER_INFO.name}</p>
            <p className="mt-1 text-sm text-brand-700">{TEACHER_INFO.nameAmharic}</p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/25 p-3">
            <p className="text-xs font-semibold uppercase text-brand-700">Priest</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{PRIEST_INFO.name}</p>
            <p className="mt-1 text-sm text-brand-700">{PRIEST_INFO.nameAmharic}</p>
          </div>
        </div>
      </Card>

      <section id="connect-support" className="space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Connect with us</p>
          <h2 className="mt-1 text-lg font-semibold text-brand-900">Organizers, Telegram, and feedback</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            Reach out to organizers for Telegram access, and share anonymous feedback to support future Timirt preparation.
          </p>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('organizers')}</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {organizerCards.map((organizer) => (
                <div key={organizer.name} className="rounded-xl border border-brand-100 bg-brand-50/30 p-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-700">Organizer</p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">{organizer.name}</p>
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
          </div>
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Telegram</p>
            <p className="mt-1 text-sm font-medium text-brand-900">{TELEGRAM_GROUP_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              Ask an organizer to be added and connected to weekly Timirt communication.
            </p>
          </div>
        </Card>

        <AnonymousFeedbackForm />
      </section>

      <RouterLinkButton to="/upcoming" variant="secondary" className="w-full sm:w-auto">
        {t('nextClass')}
      </RouterLinkButton>
    </div>
  )
}