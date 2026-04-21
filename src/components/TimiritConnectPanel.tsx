import { TELEGRAM_GROUP_NAME } from '../site/constants'
import { TELEGRAM_GROUP_INVITE_URL } from '../site/telegram'
import { Button } from './ui/Button'

/** Parish-only communication: Telegram community (Google Meet removed from public site). */
export function TimiritConnectPanel() {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-brand-900">Parish Telegram group</p>
      <p className="mt-1 text-sm font-medium text-brand-800">{TELEGRAM_GROUP_NAME}</p>
      <p className="mt-2 text-sm leading-relaxed text-brand-700">
        Reminders, PDFs, and caring check-ins for our Ethiopian Orthodox Tewahedo Timirit
        family. Ask the organizer for a secure invite if you are new.
      </p>
      {TELEGRAM_GROUP_INVITE_URL ? (
        <a className="mt-3 block" href={TELEGRAM_GROUP_INVITE_URL} target="_blank" rel="noreferrer">
          <Button type="button" variant="secondary" className="w-full">
            Open Telegram invite
          </Button>
        </a>
      ) : (
        <Button type="button" variant="secondary" className="mt-3 w-full" disabled>
          Telegram invite (add URL in code)
        </Button>
      )}
    </div>
  )
}
