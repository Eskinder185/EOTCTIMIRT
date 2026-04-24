import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUiLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'

export function AdminLayout() {
  const { user, profile, signOut, loading } = useAuth()
  const { language, setLanguage } = useUiLanguage()
  const { theme, setTheme } = useTheme()
  const isAm = language === 'am'
  const themeIcon = theme === 'day' ? '☀' : '☾'
  const location = useLocation()
  const navigate = useNavigate()
  const navigation = [
    { name: isAm ? 'ዳሽቦርድ' : 'Dashboard', href: '/admin', icon: '📊' },
    { name: isAm ? 'ሳምንታዊ ክፍሎች' : 'Weekly Classes', href: '/admin/weekly-classes', icon: '📚' },
    { name: isAm ? 'ቀጣይ ትምህርት' : 'Upcoming Timirt', href: '/admin/upcoming', icon: '🔮' },
    { name: isAm ? 'ሳምንታዊ እውቀት' : 'Weekly Knowledge', href: '/admin/weekly-knowledge', icon: '🕯️' },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/admin/login')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brand-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-accent-600" />
      </div>
    )
  }

  const isNavActive = (href: string) => {
    const path = location.pathname
    if (href === '/admin') {
      return path === '/admin' || path === '/admin/'
    }
    return path === href || path.startsWith(`${href}/`)
  }

  return (
    <div className="min-h-dvh bg-brand-50">
      <header className="sticky top-0 z-30 border-b border-brand-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {isAm ? 'የአደራጅ መግቢያ ፖርታል' : 'Organizer Portal'}
              </p>
              <h1 className="text-xl font-semibold text-brand-900">
                {isAm ? 'የEOTC ትምህርት አስተዳደር' : 'EOTC Timirt Admin'}
              </h1>
              <p className="text-sm text-brand-700">
                {isAm ? 'እንኳን ደህና መጡ፣ አደራጅ' : 'Welcome, Organizer'}
                {!isAm ? ` ${profile?.full_name || user?.email}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand-200 bg-white px-2.5 text-base font-semibold text-brand-900 shadow-sm transition hover:bg-brand-100 active:scale-95"
                aria-label={`${isAm ? 'ገጽታ' : 'Theme'}: ${theme === 'day' ? (isAm ? 'ቀን' : 'Day') : isAm ? 'ሌሊት' : 'Night'}`}
              >
                <span aria-hidden className="leading-none">
                  {themeIcon}
                </span>
              </button>
              <div className="inline-flex min-h-11 items-center rounded-full border border-brand-200 bg-white p-0.5 shadow-sm">
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
              <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-accent-600/35 hover:bg-brand-50"
              >
                {isAm ? 'የሕዝብ ጣቢያ' : 'Public Site'}
              </Link>
              <Button onClick={handleSignOut} variant="secondary">
                {isAm ? 'ውጣ' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="hidden w-64 shrink-0 rounded-2xl border border-brand-200 bg-white p-3 shadow-sm md:block">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const active = isNavActive(item.href)
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-100 text-brand-900 ring-2 ring-accent-600/30'
                        : 'text-brand-800 hover:bg-brand-50 active:bg-brand-100/80'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-200 bg-white/95 px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_40px_rgba(42,34,28,0.12)] backdrop-blur-md [data-theme='night']:shadow-[0_-12px_40px_rgba(0,0,0,0.45)] md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navigation.map((item) => {
            const active = isNavActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex min-h-[3.35rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center text-[0.62rem] font-bold uppercase leading-tight tracking-wide ${
                  active
                    ? 'bg-brand-100 text-brand-900 ring-2 ring-inset ring-accent-600/35 shadow-sm'
                    : 'text-brand-800 hover:bg-brand-100/70 active:bg-brand-200/50'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="line-clamp-2">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}