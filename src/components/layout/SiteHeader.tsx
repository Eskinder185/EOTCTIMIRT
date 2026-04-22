import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useUiLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useUiText } from '../../lib/uiText'

const linkBase =
  'rounded-lg px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-100 whitespace-nowrap'

const organizerLinkBase =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-accent-600/30 bg-accent-600/10 px-3 py-2 text-sm font-semibold text-accent-600 shadow-sm transition hover:bg-accent-600/20'

export function SiteHeader() {
  const t = useUiText()
  const { language, setLanguage } = useUiLanguage()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const themeIcon = theme === 'day' ? '☀' : '☾'

  return (
    <header className="sticky top-0 z-20 border-b border-brand-200 bg-brand-50/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="min-w-0 shrink-0 rounded-lg px-1 py-1">
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-700">
            Mekane Selam St. Michael
          </p>
          <p className="truncate text-base font-bold text-brand-900 sm:text-lg">
            EOTC Timirt
          </p>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary">
          <NavLink className={linkBase} to="/upcoming">
            {t('nextClass')}
          </NavLink>
          <NavLink className={linkBase} to="/past-timirit">
            {t('pastClasses')}
          </NavLink>
          <NavLink className={linkBase} to="/mezmurs">
            {t('mezmurs')}
          </NavLink>
          <NavLink className={linkBase} to="/about">
            {t('about')}
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/80 px-2.5 text-xs font-semibold text-brand-800 shadow-sm transition hover:bg-brand-100"
            aria-label={`${t('theme')}: ${theme === 'day' ? t('day') : t('night')}`}
          >
            <span aria-hidden>{themeIcon}</span>
          </button>
          <div className="inline-flex min-h-9 items-center rounded-full bg-white/80 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2 py-1 text-[0.68rem] font-semibold transition ${
                language === 'en' ? 'bg-brand-900 text-brand-50' : 'text-brand-800'
              }`}
              aria-label="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`rounded-full px-2 py-1 text-[0.68rem] font-semibold transition ${
                language === 'am' ? 'bg-brand-900 text-brand-50' : 'text-brand-800'
              }`}
              aria-label="Amharic"
            >
              አማ
            </button>
          </div>
          <NavLink className="hidden lg:inline-flex min-h-10 items-center justify-center rounded-xl border border-accent-600/30 bg-accent-600/10 px-3 py-2 text-sm font-semibold text-accent-600 shadow-sm transition hover:bg-accent-600/20" to="/organizer">
            {t('organizers')}
          </NavLink>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-brand-200 bg-white/80 text-brand-900 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-brand-200 bg-white/95 px-4 py-3 lg:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2" aria-label="Mobile primary">
            <NavLink className={linkBase} to="/upcoming">
              {t('nextClass')}
            </NavLink>
            <NavLink className={linkBase} to="/past-timirit">
              {t('pastClasses')}
            </NavLink>
            <NavLink className={linkBase} to="/mezmurs">
              {t('mezmurs')}
            </NavLink>
            <NavLink className={linkBase} to="/about">
              {t('about')}
            </NavLink>
            <NavLink className={organizerLinkBase} to="/organizer">
              {t('organizers')}
            </NavLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
