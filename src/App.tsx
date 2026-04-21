import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ClassPage } from './pages/ClassPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { MezmurPage } from './pages/MezmurPage'
import { MissedThisWeekPage } from './pages/MissedThisWeekPage'
import { PastClassesPage } from './pages/PastClassesPage'
import { ThisWeekPage } from './pages/ThisWeekPage'
import { OrganizerLoginPage } from './pages/OrganizerLoginPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminWeeklyClasses } from './pages/AdminWeeklyClasses'
import { AdminWeeklyClassForm } from './pages/AdminWeeklyClassForm'
import { AdminResponsesDashboard } from './pages/AdminResponsesDashboard'

const OrganizerDashboardPage = lazy(async () => {
  const module = await import('./pages/OrganizerDashboardPage')
  return { default: module.OrganizerDashboardPage }
})

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
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
                      Loading organizer tools…
                    </div>
                  }
                >
                  <OrganizerDashboardPage />
                </Suspense>
              }
            />
          </Route>

          {/* Admin login (public) */}
          <Route path="/admin/login" element={<OrganizerLoginPage />} />

          {/* Protected admin routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="classes" element={<AdminWeeklyClasses />} />
            <Route path="classes/new" element={<AdminWeeklyClassForm />} />
            <Route path="classes/:id" element={<AdminWeeklyClassForm />} />
            <Route path="responses" element={<AdminResponsesDashboard />} />
            {/* Additional admin routes will be added here */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
