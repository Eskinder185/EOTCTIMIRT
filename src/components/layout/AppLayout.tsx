import { Link, Outlet } from 'react-router-dom'
import {
  CHURCH_ADDRESS,
  CHURCH_FULL_NAME,
  ORGANIZER_SUPPORT,
} from '../../site/constants'
import { BottomNav } from './BottomNav'
import { SiteHeader } from './SiteHeader'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-brand-50 text-brand-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pb-24 sm:pt-6">
        <Outlet />
      </main>
      <footer className="border-t border-brand-200 bg-white/80 px-4 py-6 text-sm text-brand-700 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <p className="font-semibold text-brand-900">{CHURCH_FULL_NAME}</p>
            <p className="mt-1 leading-relaxed">{CHURCH_ADDRESS}</p>
            <div className="mt-2 text-xs leading-relaxed text-brand-600">
              <p className="font-semibold text-brand-700">Organizer contacts:</p>
              <p className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <span>{ORGANIZER_SUPPORT.primary.name} ·</span>
                <a
                  className="inline-flex min-h-11 items-center font-semibold text-accent-600 underline-offset-2 hover:underline"
                  href={`tel:${ORGANIZER_SUPPORT.primary.phoneTel}`}
                >
                  {ORGANIZER_SUPPORT.primary.phoneDisplay}
                </a>
              </p>
              <p className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <span>{ORGANIZER_SUPPORT.secondary.name} ·</span>
                <a
                  className="inline-flex min-h-11 items-center font-semibold text-accent-600 underline-offset-2 hover:underline"
                  href={`tel:${ORGANIZER_SUPPORT.secondary.phoneTel}`}
                >
                  {ORGANIZER_SUPPORT.secondary.phoneDisplay}
                </a>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <Link className="inline-flex min-h-11 items-center text-accent-600 underline-offset-4 hover:underline" to="/this-week">
              This week
            </Link>
            <Link className="inline-flex min-h-11 items-center text-accent-600 underline-offset-4 hover:underline" to="/classes">
              Past Timirit
            </Link>
            <Link className="inline-flex min-h-11 items-center text-accent-600 underline-offset-4 hover:underline" to="/missed">
              Missed class
            </Link>
            <Link className="inline-flex min-h-11 items-center text-accent-600 underline-offset-4 hover:underline" to="/contact">
              Contact
            </Link>
            <Link className="inline-flex min-h-11 items-center text-accent-600 underline-offset-4 hover:underline" to="/organizer">
              Organizer preview
            </Link>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  )
}
