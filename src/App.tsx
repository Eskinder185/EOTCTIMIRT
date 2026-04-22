import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ClassPage } from './pages/ClassPage'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminResponsesDashboard } from './pages/AdminResponsesDashboard'
import { AdminUpcomingPage } from './pages/AdminUpcomingPage'
import { AdminWeeklyClassForm } from './pages/AdminWeeklyClassForm'
import { AdminWeeklyClasses } from './pages/AdminWeeklyClasses'
import { MezmurPage } from './pages/MezmurPage'
import { OrganizerLoginPage } from './pages/OrganizerLoginPage'
import { PastClassesPage } from './pages/PastClassesPage'
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
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<Navigate to="/about" replace />} />
          <Route path="/classes" element={<Navigate to="/past-timirit" replace />} />
          <Route path="/past-timirit" element={<PastClassesPage />} />
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
          <Route path="responses" element={<AdminResponsesDashboard />} />
          <Route path="classes" element={<Navigate to="/admin/weekly-classes" replace />} />
          <Route path="classes/new" element={<Navigate to="/admin/weekly-classes/new" replace />} />
          <Route path="classes/:id" element={<Navigate to="/admin/weekly-classes" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
