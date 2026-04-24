import { NavLink } from 'react-router-dom'
import { useUiText } from '../../lib/uiText'

export function BottomNav() {
  const t = useUiText()

  const tabClass =
    'flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.65rem] font-bold uppercase leading-tight tracking-wide sm:min-h-14 sm:gap-1 sm:px-2 sm:text-[0.7rem]'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-200 bg-white/95 px-1.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_40px_rgba(42,34,28,0.12)] backdrop-blur-md supports-backdrop-filter:bg-white/90 [data-theme='night']:shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:hidden"
      aria-label="Mobile quick navigation"
    >
      <div className="mx-auto flex max-w-3xl gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${tabClass} ${
              isActive
                ? 'bg-brand-100 text-brand-900 ring-2 ring-inset ring-accent-600/35 shadow-sm'
                : 'text-brand-800 hover:bg-brand-100/70 active:bg-brand-200/50'
            }`
          }
          end
        >
          <span className="text-lg leading-none text-brand-800" aria-hidden>
            ⌂
          </span>
          <span className="text-center">{t('home')}</span>
        </NavLink>
        <NavLink
          to="/upcoming"
          className={({ isActive }) =>
            `${tabClass} ${
              isActive
                ? 'bg-brand-100 text-brand-900 ring-2 ring-inset ring-accent-600/35 shadow-sm'
                : 'text-brand-800 hover:bg-brand-100/70 active:bg-brand-200/50'
            }`
          }
        >
          <span className="text-lg leading-none text-accent-600" aria-hidden>
            ▶
          </span>
          <span className="text-center">{t('nextClass')}</span>
        </NavLink>
        <NavLink
          to="/past-timirit"
          className={({ isActive }) =>
            `${tabClass} ${
              isActive
                ? 'bg-brand-100 text-brand-900 ring-2 ring-inset ring-accent-600/35 shadow-sm'
                : 'text-brand-800 hover:bg-brand-100/70 active:bg-brand-200/50'
            }`
          }
        >
          <span className="text-lg leading-none text-accent-600" aria-hidden>
            📚
          </span>
          <span className="text-center">{t('pastClasses')}</span>
        </NavLink>
        <NavLink
          to="/mezmurs"
          className={({ isActive }) =>
            `${tabClass} ${
              isActive
                ? 'bg-brand-100 text-brand-900 ring-2 ring-inset ring-accent-600/35 shadow-sm'
                : 'text-brand-800 hover:bg-brand-100/70 active:bg-brand-200/50'
            }`
          }
        >
          <span className="text-lg leading-none text-accent-600" aria-hidden>
            ♪
          </span>
          <span className="text-center">{t('mezmurs')}</span>
        </NavLink>
      </div>
    </nav>
  )
}
