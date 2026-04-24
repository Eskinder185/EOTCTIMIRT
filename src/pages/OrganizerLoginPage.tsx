import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUiLanguage } from '../contexts/LanguageContext'
import { Button } from '../components/ui/Button'

export function OrganizerLoginPage() {
  const { signIn, isAuthenticated, loading, error } = useAuth()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const location = useLocation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  const from = location.state?.from?.pathname || '/admin'
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    try {
      setIsSubmitting(true)
      await signIn(email, password)
      // AuthContext will handle the redirect via the Navigate above
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Sign in failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Organizer Portal
          </h1>
          <p className="text-gray-600">
            EOTC Timirit Content Management
          </p>
        </div>

        <Link
          to="/"
          className="mb-6 flex min-h-12 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-base font-semibold text-gray-800 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          {isAm ? 'ወደ መነሻ ገጽ ተመለስ' : 'Back to Home'}
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="your-email@example.com"
              required
              disabled={isSubmitting || loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="••••••••"
              required
              disabled={isSubmitting || loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading || !email || !password}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Access restricted to authorized organizers only
            </p>
            <p className="text-xs text-gray-400">
              Need access? Contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}