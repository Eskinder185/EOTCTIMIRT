import { supabase } from './supabase'

export const anonymousFeedbackCategories = [
  'Website feedback',
  'Teaching feedback',
  'Future topic suggestion',
  'General note',
] as const

export type AnonymousFeedbackCategory = (typeof anonymousFeedbackCategories)[number]

export interface AnonymousFeedbackInput {
  category: AnonymousFeedbackCategory
  subject?: string
  message: string
}

const FEEDBACK_TIMEOUT_MS = 15000
const FEEDBACK_FUNCTION_NAME = 'quick-function'
const RETRY_DELAY_MS = 800

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function invokeAnonymousFeedback(input: AnonymousFeedbackInput) {
  return supabase!.functions.invoke(FEEDBACK_FUNCTION_NAME, { body: input })
}

async function invokeAnonymousFeedbackFallback(input: AnonymousFeedbackInput) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured for anonymous feedback.')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${FEEDBACK_FUNCTION_NAME}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(input),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const backendMessage =
      payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : null
    throw new Error(backendMessage || 'Unable to send anonymous feedback right now.')
  }

  return { data: payload, error: null }
}

function friendlySubmissionError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : ''
  const normalized = rawMessage.toLowerCase()
  if (normalized.includes('failed to send a request to the edge function')) {
    return 'Cannot reach the feedback service right now. Please try again in a moment. If this continues, ask an organizer to confirm the Edge Function is deployed and project URL is correct.'
  }
  if (normalized.includes('request timed out')) {
    return 'The request took too long. Please check your connection and try again.'
  }
  return rawMessage || 'Unable to send anonymous feedback right now.'
}

export async function submitAnonymousFeedback(input: AnonymousFeedbackInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured for anonymous feedback.')
  }

  let timeoutId: number | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('Request timed out. Please try again in a moment.'))
    }, FEEDBACK_TIMEOUT_MS)
  })

  let invokeResult: Awaited<ReturnType<typeof supabase.functions.invoke>>
  try {
    invokeResult = await Promise.race([
      invokeAnonymousFeedback(input),
      timeoutPromise,
    ])
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Anonymous feedback invoke failed, retrying with fallback fetch:', {
        error,
        functionName: FEEDBACK_FUNCTION_NAME,
      })
    }
    try {
      await wait(RETRY_DELAY_MS)
      invokeResult = await Promise.race([
        invokeAnonymousFeedbackFallback(input),
        timeoutPromise,
      ])
    } catch (fallbackError) {
      const message = friendlySubmissionError(fallbackError)
      if (import.meta.env.DEV) {
        console.error('Anonymous feedback submission failed:', {
          primaryError: error,
          fallbackError,
          functionName: FEEDBACK_FUNCTION_NAME,
          inputCategory: input.category,
        })
      }
      throw new Error(message)
    }
    if (import.meta.env.DEV) {
      console.info('Anonymous feedback fallback fetch succeeded.')
    }
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
    }
  }

  const { data, error } = invokeResult

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Anonymous feedback function returned error:', {
        message: error.message,
        details: error,
      })
    }
    throw new Error(friendlySubmissionError(error))
  }

  if (!data || (typeof data === 'object' && 'ok' in data && !data.ok)) {
    if (import.meta.env.DEV) {
      console.error('Anonymous feedback function returned invalid payload:', data)
    }
    throw new Error('Unable to confirm submission right now. Please try again.')
  }
}