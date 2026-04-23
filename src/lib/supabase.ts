import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Prefer explicit "new project" env vars, then fall back.
const supabaseUrl = import.meta.env.VITE_NEW_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_NEW_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

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

export async function testWeeklyClassesQuery() {
  if (!supabase) {
    return {
      ok: false,
      rowCount: 0,
      error: 'Supabase environment variables are missing.'
    }
  }

  const { data, error } = await supabase
    .from('weekly_classes')
    .select('id', { count: 'exact' })
    .limit(1)

  if (error) {
    return {
      ok: false,
      rowCount: 0,
      error: error.message
    }
  }

  return {
    ok: true,
    rowCount: data?.length ?? 0,
    error: null
  }
}

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
    .in('role', ['organizer', 'admin'])
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