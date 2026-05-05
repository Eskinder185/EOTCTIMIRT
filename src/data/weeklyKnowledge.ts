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
  buttonLink?: string
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
  buttonLink?: string
  status: WeeklyKnowledgeStatus
  startDate?: string
  endDate?: string
  isActive: boolean
}
