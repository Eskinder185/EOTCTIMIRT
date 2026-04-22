import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, signOutOrganizer, hasSupabaseConfig } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { getUpcomingTimirtForAdmin, getWeeklyClasses } from '../lib/supabaseData'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PROFILE_STORAGE_KEY = 'eotc-auth-profile-cache'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheProfile = (nextProfile: UserProfile | null) => {
    if (!nextProfile) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
  }

  const readCachedProfile = () => {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as UserProfile
    } catch {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      return null
    }
  }

  const loadProfileForUser = async (targetUser: User): Promise<UserProfile | null> => {
    if (!supabase) {
      return null
    }

    const cachedProfile = readCachedProfile()
    if (cachedProfile && cachedProfile.id === targetUser.id && cachedProfile.is_active) {
      return cachedProfile
    }

    const { data: loadedProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetUser.id)
      .eq('is_active', true)
      .in('role', ['organizer', 'admin'])
      .single()

    if (profileError || !loadedProfile) {
      return null
    }

    cacheProfile(loadedProfile)
    return loadedProfile
  }

  const prefetchOrganizerData = () => {
    void Promise.allSettled([getWeeklyClasses(), getUpcomingTimirtForAdmin()])
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)

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
        const loadedProfile = await loadProfileForUser(data.user)
        if (!loadedProfile) {
          await supabase.auth.signOut()
          throw new Error('Access denied. You must be an authorized organizer to access this portal.')
        }

        setUser(data.user)
        setProfile(loadedProfile)
        prefetchOrganizerData()
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred'
      setError(errorMessage)
      throw err
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setError(null)
      await signOutOrganizer()
      setUser(null)
      setProfile(null)
      cacheProfile(null)
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
      setInitialized(true)
      return
    }
    const sb = supabase

    const initializeAuth = async () => {
      try {
        setLoading(true)
        const {
          data: { session },
        } = await sb.auth.getSession()

        if (!session?.user) {
          setUser(null)
          setProfile(null)
          return
        }

        setUser(session.user)
        const loadedProfile = await loadProfileForUser(session.user)
        if (!loadedProfile) {
          await sb.auth.signOut()
          setUser(null)
          setProfile(null)
          return
        }

        setProfile(loadedProfile)
        prefetchOrganizerData()
      } catch (err) {
        console.error('Auth initialization failed:', err)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    void initializeAuth()

    // Listen for changes
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (!session?.user) {
          return
        }

        setUser(session.user)
        const loadedProfile = await loadProfileForUser(session.user)

        if (!loadedProfile) {
          await sb.auth.signOut()
          setUser(null)
          setProfile(null)
          return
        }

        setProfile(loadedProfile)
        prefetchOrganizerData()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        cacheProfile(null)
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
    initialized,
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