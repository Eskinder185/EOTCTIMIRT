import { NavLink } from 'react-router-dom'

const tabClass =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[0.7rem] font-semibold uppercase tracking-wide text-brand-800 sm:text-xs'

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(42,34,28,0.08)] sm:hidden"
      aria-label="Mobile quick navigation"
    >
      <div className="mx-auto flex max-w-3xl gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${tabClass} ${isActive ? 'bg-brand-100 text-brand-900' : 'hover:bg-brand-50'}`
          }
          end
        >
          <span aria-hidden>⌂</span>
          Home
        </NavLink>
        <NavLink
          to="/upcoming"
          className={({ isActive }) =>
            `${tabClass} ${isActive ? 'bg-brand-100 text-brand-900' : 'hover:bg-brand-50'}`
          }
        >
          <span aria-hidden>▶</span>
          Next Class
        </NavLink>
        <NavLink
          to="/mezmurs"
          className={({ isActive }) =>
            `${tabClass} ${isActive ? 'bg-brand-100 text-brand-900' : 'hover:bg-brand-50'}`
          }
        >
          <span aria-hidden>♪</span>
          Mezmurs
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `${tabClass} ${isActive ? 'bg-brand-100 text-brand-900' : 'hover:bg-brand-50'}`
          }
        >
          <span aria-hidden>✉</span>
          About
        </NavLink>
      </div>
    </nav>
  )
}
