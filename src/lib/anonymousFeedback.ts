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
  website?: string
}

const FEEDBACK_TIMEOUT_MS = 15000

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
      supabase.functions.invoke('anonymous-feedback', { body: input }),
      timeoutPromise,
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send anonymous feedback right now.'
    if (import.meta.env.DEV) {
      console.error('Anonymous feedback submission failed:', { error, inputCategory: input.category })
    }
    throw new Error(message)
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
    throw new Error(error.message || 'Unable to send anonymous feedback right now.')
  }

  if (!data || (typeof data === 'object' && 'ok' in data && !data.ok)) {
    if (import.meta.env.DEV) {
      console.error('Anonymous feedback function returned invalid payload:', data)
    }
    throw new Error('Unable to confirm submission right now. Please try again.')
  }
}