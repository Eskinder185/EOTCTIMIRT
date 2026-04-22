import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, checkOrganizerAuth, signOutOrganizer, hasSupabaseConfig } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication status and load profile
  const checkAuth = async () => {
    try {
      setLoading(true)
      const { isAuthenticated, user: authUser, profile: userProfile } = await checkOrganizerAuth()
      
      if (isAuthenticated && authUser && userProfile) {
        setUser(authUser)
        setProfile(userProfile)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      if (!supabase || !hasSupabaseConfig) {
        throw new Error('Organizer login is not configured yet. Add Supabase environment variables to enable the portal.')
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        throw signInError
      }

      if (data.user) {
        // Check if user has organizer profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .eq('is_active', true)
          .in('role', ['organizer', 'admin'])
          .single()

        if (profileError || !profile) {
          await supabase.auth.signOut()
          throw new Error('Access denied. You must be an authorized organizer to access this portal.')
        }

        setUser(data.user)
        setProfile(profile)
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setError(null)
      await signOutOrganizer()
      setUser(null)
      setProfile(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      setError(errorMessage)
      throw err
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) {
      setLoading(false)
      return
    }

    // Get initial session
    checkAuth()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated: !!(user && profile),
    signIn,
    signOut,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext