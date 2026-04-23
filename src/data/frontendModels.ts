/**
 * TEMP FRONTEND CONTAINMENT LAYER
 * replace with new Supabase repository later.
 */

export type BilingualText = {
  en?: string
  am?: string
}

export interface MultipleChoiceOption {
  id: string
  label: BilingualText
}

export interface QuestionModel {
  id: string
  prompt: BilingualText
  helperText?: BilingualText
  type: 'multiple-choice' | 'short-answer' | 'reflection' | 'feedback-open' | 'attendance'
  options?: MultipleChoiceOption[]
  correctOptionId?: string
}

export interface MezmurModel {
  id: string
  title: BilingualText
  transliteration?: string
  youtubeUrl?: string
  audioUrl?: string
}

export interface WeeklyKnowledgeModel {
  id: string
  title: BilingualText
  content: BilingualText
  extraNote?: BilingualText
  status: 'draft' | 'published' | 'hidden'
}

export interface WeeklyClassModel {
  id: string
  date: string
  topic: BilingualText
  speaker?: string
  summary: BilingualText
  keyPoints?: BilingualText[]
  mezmurs: MezmurModel[]
  questions: QuestionModel[]
  status: 'draft' | 'published' | 'inactive'
}

export interface UpcomingTimiritModel {
  id: string
  scheduledDate: string
  topicPreview: BilingualText
  note?: BilingualText
  mezmurs: MezmurModel[]
  status: 'draft' | 'published' | 'inactive'
}

export interface OrganizerProfileModel {
  id: string
  name: string
  email?: string
  role: 'organizer' | 'admin'
  isActive: boolean
}
