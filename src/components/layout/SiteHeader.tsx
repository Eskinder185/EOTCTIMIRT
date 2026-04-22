import { Link, NavLink } from 'react-router-dom'

const linkBase =
  'rounded-lg px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100'

const organizerLinkBase =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-accent-600 shadow-sm hover:bg-brand-100'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-200 bg-brand-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-h-12 min-w-0 flex-col justify-center rounded-lg px-1 py-1">
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-700">
            Mekane Selam St. Michael
          </p>
          <p className="truncate text-base font-bold text-brand-900 sm:text-lg">
            EOTC Timirt
          </p>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            <NavLink className={linkBase} to="/upcoming">
              Next class
            </NavLink>
            <NavLink className={linkBase} to="/past-timirit">
              Past Timirit
            </NavLink>
            <NavLink className={linkBase} to="/mezmurs">
              Mezmurs
            </NavLink>
            <NavLink className={linkBase} to="/about">
              About
            </NavLink>
          </nav>
          <NavLink className={organizerLinkBase} to="/organizer">
            Organizers
          </NavLink>
        </div>
      </div>
    </header>
  )
}
