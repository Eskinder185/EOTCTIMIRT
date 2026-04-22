import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Weekly Classes', href: '/admin/weekly-classes', icon: '📚' },
  { name: 'Upcoming Timirit', href: '/admin/upcoming', icon: '🔮' },
]

export function AdminLayout() {
  const { user, profile, signOut, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="border-b border-brand-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Organizer portal</p>
              <h1 className="text-xl font-semibold text-brand-900">EOTC Timirit Admin</h1>
              <p className="text-sm text-brand-700">Welcome, {profile?.full_name || user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-brand-900 shadow-sm">
                Public site
              </Link>
              <Button onClick={handleSignOut} variant="secondary">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="hidden w-64 shrink-0 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm md:block">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-100 text-brand-900' : 'text-brand-700 hover:bg-brand-50'
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

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-2 text-center text-[11px] font-semibold ${
                  isActive ? 'bg-brand-100 text-brand-900' : 'text-brand-700'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}