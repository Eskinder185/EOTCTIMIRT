import { Link, Outlet } from 'react-router-dom'
import { CHURCH_FULL_NAME } from '../../site/constants'
import { useUiText } from '../../lib/uiText'
import { SiteHeader } from './SiteHeader'

export function AppLayout() {
  const t = useUiText()

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50 text-brand-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
        <Outlet />
      </main>
      <footer className="border-t border-brand-200 bg-white/80 px-4 py-6 text-sm text-brand-700 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <p className="font-semibold text-brand-900">{CHURCH_FULL_NAME}</p>
          <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-600 underline-offset-4 hover:underline" to="/about">
            {t('about')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
