import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useUiLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useUiText } from '../../lib/uiText'

function navLinkClassName(isActive: boolean, align: 'center' | 'stretch' = 'center') {
  const alignClass = align === 'stretch' ? 'w-full min-h-12 justify-start px-4' : 'min-h-11 justify-center px-3'
  const base = `inline-flex items-center rounded-xl py-2.5 text-sm font-semibold transition whitespace-nowrap ${alignClass}`
  if (isActive) {
    return `${base} bg-brand-100 text-brand-900 shadow-sm ring-2 ring-accent-600/35 ring-offset-2 ring-offset-brand-50`
  }
  return `${base} text-brand-800 hover:bg-brand-100/80 active:bg-brand-200/50`
}

const organizerLinkClassName = (isActive: boolean) =>
  [
    'inline-flex min-h-12 w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition sm:min-h-10 sm:w-auto sm:px-3 sm:py-2',
    isActive
      ? 'border-accent-600/50 bg-accent-600/20 text-brand-900 shadow-sm ring-1 ring-accent-600/30'
      : 'border-accent-600/35 bg-accent-600/10 text-accent-600 hover:bg-accent-600/20',
  ].join(' ')

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
    <header className="sticky top-0 z-40 border-b border-brand-200 bg-brand-50/95 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-brand-50/90 [data-theme='night']:shadow-[0_1px_0_0_rgba(148,163,184,0.12)]">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <Link
          to="/"
          className="min-w-0 shrink-0 rounded-xl px-2 py-1.5 ring-brand-200 transition hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
        >
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-700">
            Mekane Selam St. Michael
          </p>
          <p className="truncate text-base font-bold text-brand-900 sm:text-lg">EOTC Timirt</p>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary">
          <NavLink className={({ isActive }) => navLinkClassName(isActive)} to="/upcoming">
            {t('nextClass')}
          </NavLink>
          <NavLink className={({ isActive }) => navLinkClassName(isActive)} to="/past-timirit">
            {t('pastClasses')}
          </NavLink>
          <NavLink className={({ isActive }) => navLinkClassName(isActive)} to="/mezmurs">
            {t('mezmurs')}
          </NavLink>
          <NavLink className={({ isActive }) => navLinkClassName(isActive)} to="/about">
            {t('about')}
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand-200 bg-white/90 text-base font-semibold text-brand-900 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 active:scale-95"
            aria-label={`${t('theme')}: ${theme === 'day' ? t('day') : t('night')}`}
          >
            <span aria-hidden className="leading-none">
              {themeIcon}
            </span>
          </button>
          <div className="inline-flex min-h-11 items-center rounded-full border border-brand-200 bg-white/90 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2.5 py-1.5 text-[0.7rem] font-semibold transition ${
                language === 'en' ? 'bg-brand-900 text-brand-50 shadow-sm' : 'text-brand-800 hover:bg-brand-100/80'
              }`}
              aria-label="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`rounded-full px-2.5 py-1.5 text-[0.7rem] font-semibold transition ${
                language === 'am' ? 'bg-brand-900 text-brand-50 shadow-sm' : 'text-brand-800 hover:bg-brand-100/80'
              }`}
              aria-label="Amharic"
            >
              አማ
            </button>
          </div>
          <NavLink
            className={({ isActive }) =>
              `hidden min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition lg:inline-flex ${
                isActive
                  ? 'border-accent-600/50 bg-accent-600/20 text-brand-900 ring-1 ring-accent-600/30'
                  : 'border-accent-600/35 bg-accent-600/10 text-accent-600 hover:bg-accent-600/20'
              }`
            }
            to="/organizer"
          >
            {t('organizers')}
          </NavLink>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-brand-300 bg-white/95 px-3 text-sm font-bold text-brand-900 shadow-sm transition hover:border-accent-600/40 hover:bg-brand-50 active:scale-[0.98] lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="text-lg leading-none" aria-hidden>
              {mobileMenuOpen ? '✕' : '☰'}
            </span>
            <span className="max-[380px]:sr-only">{mobileMenuOpen ? (language === 'am' ? 'ዝጋ' : 'Close') : t('menu')}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-brand-200 bg-white/98 px-3 py-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] backdrop-blur-md lg:hidden">
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-700">
            {language === 'am' ? 'ዋና መንገዶች' : 'Main pages'}
          </p>
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1.5" aria-label="Mobile primary">
            <NavLink className={({ isActive }) => navLinkClassName(isActive, 'stretch')} to="/upcoming">
              {t('nextClass')}
            </NavLink>
            <NavLink className={({ isActive }) => navLinkClassName(isActive, 'stretch')} to="/past-timirit">
              {t('pastClasses')}
            </NavLink>
            <NavLink className={({ isActive }) => navLinkClassName(isActive, 'stretch')} to="/mezmurs">
              {t('mezmurs')}
            </NavLink>
            <NavLink className={({ isActive }) => navLinkClassName(isActive, 'stretch')} to="/about">
              {t('about')}
            </NavLink>
            <NavLink className={({ isActive }) => organizerLinkClassName(isActive)} to="/organizer">
              {t('organizers')}
            </NavLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
