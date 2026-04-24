import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ClassPage } from './pages/ClassPage'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminUpcomingPage } from './pages/AdminUpcomingPage'
import { AdminWeeklyKnowledgePage } from './pages/AdminWeeklyKnowledgePage'
import { AdminWeeklyClassForm } from './pages/AdminWeeklyClassForm'
import { AdminWeeklyClasses } from './pages/AdminWeeklyClasses'
import { MezmurPage } from './pages/MezmurPage'
import { OrthodoxResourcesPage } from './pages/OrthodoxResourcesPage'
import { UpcomingMezmursPage } from './pages/UpcomingMezmursPage'
import { OrganizerLoginPage } from './pages/OrganizerLoginPage'
import { PastClassesPage } from './pages/PastClassesPage'
import { UpcomingClassesPage } from './pages/UpcomingClassesPage'
import { UpcomingClassPage } from './pages/UpcomingClassPage'

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
          <Route path="/this-week" element={<Navigate to="/upcoming" replace />} />
          <Route path="/missed" element={<Navigate to="/past-timirit" replace />} />
          <Route path="/upcoming" element={<UpcomingClassPage />} />
          <Route path="/upcoming-classes" element={<UpcomingClassesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<Navigate to="/about" replace />} />
          <Route path="/classes" element={<Navigate to="/past-timirit" replace />} />
          <Route path="/past-timirit" element={<PastClassesPage />} />
          <Route path="/class/:id" element={<ClassPage />} />
          <Route path="/mezmurs" element={<MezmurPage />} />
          <Route path="/orthodox-resources" element={<OrthodoxResourcesPage />} />
          <Route path="/resources" element={<Navigate to="/orthodox-resources" replace />} />
          <Route
            path="/organizer"
            element={
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm font-medium text-brand-800 shadow-sm">
                    Loading organizer tools...
                  </div>
                }
              >
                <OrganizerDashboardPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="/upcoming-mezmurs" element={<UpcomingMezmursPage />} />
        <Route path="/admin/login" element={<OrganizerLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="weekly-classes" element={<AdminWeeklyClasses />} />
          <Route path="weekly-classes/new" element={<AdminWeeklyClassForm />} />
          <Route path="weekly-classes/:id" element={<AdminWeeklyClassForm />} />
          <Route path="upcoming" element={<AdminUpcomingPage />} />
          <Route path="weekly-knowledge" element={<AdminWeeklyKnowledgePage />} />
          <Route path="classes" element={<Navigate to="/admin/weekly-classes" replace />} />
          <Route path="classes/new" element={<Navigate to="/admin/weekly-classes/new" replace />} />
          <Route path="classes/:id" element={<Navigate to="/admin/weekly-classes" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
