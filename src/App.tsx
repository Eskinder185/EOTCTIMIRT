import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ClassPage } from './pages/ClassPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { MezmurPage } from './pages/MezmurPage'
import { MissedThisWeekPage } from './pages/MissedThisWeekPage'
import { PastClassesPage } from './pages/PastClassesPage'
import { ThisWeekPage } from './pages/ThisWeekPage'

const OrganizerDashboardPage = lazy(async () => {
  const module = await import('./pages/OrganizerDashboardPage')
  return { default: module.OrganizerDashboardPage }
})

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/this-week" element={<ThisWeekPage />} />
          <Route path="/missed" element={<MissedThisWeekPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/classes" element={<PastClassesPage />} />
          <Route path="/class/:id" element={<ClassPage />} />
          <Route path="/mezmurs" element={<MezmurPage />} />
          <Route
            path="/organizer"
            element={
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-brand-200 bg-white p-6 text-center text-sm text-brand-700">
                    Loading organizer tools...
                  </div>
                }
              >
                <OrganizerDashboardPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
