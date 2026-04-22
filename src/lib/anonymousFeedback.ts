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

export async function submitAnonymousFeedback(input: AnonymousFeedbackInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured for anonymous feedback.')
  }

  const { error } = await supabase.functions.invoke('anonymous-feedback', {
    body: input,
  })

  if (error) {
    throw new Error(error.message || 'Unable to send anonymous feedback right now.')
  }
}