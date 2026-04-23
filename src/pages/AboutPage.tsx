import {
  CHURCH_ADDRESS,
  CHURCH_MAPS_URL,
  CHURCH_SHORT_NAME,
  PRIEST_INFO,
  TEACHER_INFO,
  TELEGRAM_GROUP_NAME,
  TIMIRT_SCHEDULE_LABEL,
} from '../site/constants'
import { AnonymousFeedbackForm } from '../components/AnonymousFeedbackForm'
import { TeacherYoutubeChannelCard } from '../components/TeacherYoutubeChannelCard'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { useUiText } from '../lib/uiText'

const organizerNames = ['Sinte', 'Tsebaot', 'Teddy', 'Eskinder Kassahun', 'Mariamawit'] as const

export function AboutPage() {
  const t = useUiText()

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('about')}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">About EOTC Timirt</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          A weekly Ethiopian Orthodox Tewahedo class hub for faithful teaching, clear preparation, and pastoral support.
        </p>
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/30 p-3 text-sm text-brand-800">
          <p className="font-semibold text-brand-900">{CHURCH_SHORT_NAME}</p>
          <p className="mt-1">{CHURCH_ADDRESS}</p>
          <p className="mt-1 text-brand-700">{TIMIRT_SCHEDULE_LABEL}</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50"
            href={CHURCH_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open church location
          </a>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-600 px-4 text-sm font-semibold text-white hover:opacity-95"
            href="#connect-support"
          >
            View support and feedback
          </a>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Mission</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          This Timirt helps members understand, grow in, guard, and share the Ethiopian Orthodox Tewahedo faith with clarity and pastoral care.
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">With Gratitude</p>
        <p className="mt-2 text-sm text-brand-800">
          We thank God for the clergy and teachers serving this Timirt with faithfulness and love.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Priest</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{PRIEST_INFO.name}</p>
            <p className="mt-1 text-sm text-brand-700">{PRIEST_INFO.nameAmharic}</p>
            <p className="mt-2 text-sm text-brand-800">
              Thank you for opening the church space and supporting this teaching ministry.
            </p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Teacher</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{TEACHER_INFO.name}</p>
            <p className="mt-1 text-sm text-brand-700">{TEACHER_INFO.nameAmharic}</p>
            <p className="mt-2 text-sm text-brand-800">
              Thank you for guiding parish members with clear and faithful teaching.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-brand-800">May God bless their service and the growth of the parish family.</p>
      </Card>

      <TeacherYoutubeChannelCard
        eyebrow="Teacher resources"
        title="Official teaching channel"
        buttonLabel="Open Bible study channel"
      />

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Organizer support</p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">Timirt organizing team</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organizerNames.map((name) => (
            <div key={name} className="rounded-xl border border-brand-100 bg-brand-50/30 p-3">
              <p className="mt-1 text-sm font-semibold text-brand-900">{name}</p>
            </div>
          ))}
        </div>
      </Card>

      <section id="connect-support" className="space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Telegram</p>
          <h2 className="mt-1 text-lg font-semibold text-brand-900">Join weekly class updates</h2>
          <p className="mt-2 text-sm font-medium text-brand-900">{TELEGRAM_GROUP_NAME}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            Ask an organizer to add you so you can receive weekly Timirt reminders and updates.
          </p>
        </Card>

        <section id="feedback">
          <AnonymousFeedbackForm />
        </section>
      </section>

      <RouterLinkButton to="/upcoming" variant="secondary" className="w-full sm:w-auto">
        {t('nextClass')}
      </RouterLinkButton>
    </div>
  )
}