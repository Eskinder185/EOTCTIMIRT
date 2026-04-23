export type WeeklyKnowledgeContentType =
  | 'Knowledge'
  | 'Fun Fact'
  | 'Church Reminder'
  | 'Weekly Greeting'
  | 'Important Note'
  | 'Vocabulary / Term of the Week'

export type WeeklyKnowledgeStatus = 'draft' | 'published' | 'hidden'

export interface WeeklyKnowledgeItem {
  id: string
  title: string
  titleEn?: string
  titleAm?: string
  subtitle?: string
  subtitleEn?: string
  subtitleAm?: string
  content: string
  contentEn?: string
  contentAm?: string
  extraNote?: string
  extraNoteEn?: string
  extraNoteAm?: string
  imageUrl?: string
  buttonText?: string
  buttonTextEn?: string
  buttonTextAm?: string
  buttonLink?: string
  contentType: WeeklyKnowledgeContentType
  status: WeeklyKnowledgeStatus
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WeeklyKnowledgeEditorInput {
  id?: string
  title: string
  titleEn?: string
  titleAm?: string
  subtitle?: string
  subtitleEn?: string
  subtitleAm?: string
  content: string
  contentEn?: string
  contentAm?: string
  extraNote?: string
  extraNoteEn?: string
  extraNoteAm?: string
  imageUrl?: string
  buttonText?: string
  buttonTextEn?: string
  buttonTextAm?: string
  buttonLink?: string
  contentType: WeeklyKnowledgeContentType
  status: WeeklyKnowledgeStatus
  startDate?: string
  endDate?: string
  isActive: boolean
}
