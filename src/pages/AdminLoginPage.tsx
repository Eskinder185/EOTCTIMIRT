import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

/**
 * Admin Login Page - Placeholder for future CMS integration
 * This will connect to Supabase authentication for organizer access
 */
export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: Integrate with Supabase authentication
    // const { user, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password
    // })
    
    // Placeholder - will be implemented with real auth
    setTimeout(() => {
      alert('Admin login will be implemented with Supabase authentication')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-900">Organizer Login</h1>
          <p className="mt-2 text-sm text-brand-700">
            Access the content management system
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-3 border border-brand-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent text-base"
                placeholder="organizer@church.org"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-900 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-brand-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent text-base"
                placeholder="Enter your password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Development Info */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-medium text-amber-800 mb-2">🚧 Development Note</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              This admin system will be integrated with Supabase for authentication and content management. 
              Organizers will be able to edit weekly topics, summaries, mezmurs, and other content without touching code.
            </p>
          </div>
        </Card>

        {/* Features Preview */}
        <Card className="p-6">
          <h3 className="font-semibold text-brand-900 mb-3">Content Management Features</h3>
          <ul className="space-y-2 text-sm text-brand-700">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Edit weekly topics and teacher information
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Update Amharic and English summaries
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Manage mezmur selections and details
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Add YouTube replay links
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Create follow-up questions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              View attendance and response analytics
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}