import { Link, Outlet } from 'react-router-dom'
import { CHURCH_FOOTER_LINE_AM, CHURCH_FOOTER_LINE_EN, TEACHER_YOUTUBE_CHANNEL } from '../../site/constants'
import { useUiLanguage } from '../../contexts/LanguageContext'
import { useUiText } from '../../lib/uiText'
import { BottomNav } from './BottomNav'
import { SiteHeader } from './SiteHeader'

export function AppLayout() {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const footerChurchLine = isAm ? CHURCH_FOOTER_LINE_AM : CHURCH_FOOTER_LINE_EN

  return (
    <div className="flex min-h-dvh scroll-smooth flex-col bg-brand-50 text-brand-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
        <Outlet />
      </main>
      <footer className="border-t border-brand-200 bg-white/80 px-4 py-6 pb-28 text-sm text-brand-700 sm:px-6 sm:pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="font-semibold text-brand-900">{footerChurchLine}</p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <a
              className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-accent-600 hover:bg-brand-50"
              href="/about#feedback"
            >
              {t('footerFeedback')}
            </a>
            <a
              className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-600 underline-offset-4 hover:underline"
              href={TEACHER_YOUTUBE_CHANNEL.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('footerTeacherYouTube')}
            </a>
            <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-600 underline-offset-4 hover:underline" to="/about">
              {t('about')}
            </Link>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  )
}
