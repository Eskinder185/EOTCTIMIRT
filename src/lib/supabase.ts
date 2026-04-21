import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

// Create Supabase client with TypeScript types
export const supabase = hasSupabaseConfig
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null

// Helper function to check if user is authenticated organizer
export async function checkOrganizerAuth() {
  if (!supabase) {
    return { isAuthenticated: false, user: null, profile: null }
  }

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { isAuthenticated: false, user: null, profile: null }
  }
  
  // Check if user has active organizer profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()
  
  return {
    isAuthenticated: !!profile,
    user,
    profile
  }
}

// Helper function to get current organizer session
export async function getOrganizerSession() {
  if (!supabase) {
    return null
  }

  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Sign out organizer
export async function signOutOrganizer() {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}