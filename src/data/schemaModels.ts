import type { QuestionType } from './types'
import type { WeeklyKnowledgeContentType, WeeklyKnowledgeStatus } from './weeklyKnowledge'

export interface WeeklyClassRecord {
  id: string
  date: string
  topic: string
  speaker: string
  amharicSummary: string
  englishSummary: string
  keyPoints: string[]
  verses?: string[]
  youtubeUrl?: string
  audioUrl?: string
  audioTitle?: string
  audioNote?: string
  lessonMediaEnabled?: boolean
  teachingNotes?: string
  feedbackSummary?: string
  attendanceSummary?: string
}

export interface MezmurRecord {
  id?: string
  title: string
  transliteration?: string
  lyrics?: string
  youtubeUrl?: string
  audioUrl?: string
  orderIndex: number
}

export interface QuestionRecord {
  id: string
  weeklyClassId: string
  type: QuestionType
  prompt: string
  helperText?: string
  placeholder?: string
  correctIndex?: number
  explanation?: string
  orderIndex: number
}

export interface UpcomingTimiritRecord {
  id: string
  scheduledDate: string
  topicPreview: string
  note: string
  lessonYoutubeUrl?: string
  lessonAudioUrl?: string
  lessonAudioTitle?: string
  lessonNote?: string
  weeklyKnowledgeContent?: string
  weeklyKnowledgeImageUrl?: string
  keyVerse?: string
  organizerNote?: string
  status?: 'draft' | 'published'
  isActive: boolean
}

export interface UpcomingMezmurRecord extends MezmurRecord {
  upcomingTimiritId: string
}

export interface WeeklyKnowledgeRecord {
  id: string
  title: string
  subtitle?: string
  content: string
  extraNote?: string
  imageUrl?: string
  buttonText?: string
  buttonLink?: string
  contentType: WeeklyKnowledgeContentType
  status: WeeklyKnowledgeStatus
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AnonymousFeedbackRecord {
  id: string
  category: string
  subject?: string
  message: string
  status?: string
  createdAt: string
}

export interface ReviewSessionRecord {
  id: string
  weeklyClassId: string
  userFingerprint?: string
  questionCount?: number
  correctAnswers?: number
  scorePercent?: number
  completedAt?: string
  createdAt: string
}
