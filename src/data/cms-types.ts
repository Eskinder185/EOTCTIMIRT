// Content Management Types for future CMS integration
// These interfaces define the editable content structure for organizers

export interface EditableWeeklyClass {
  // Basic Information
  id: string
  date: string
  
  // Content Fields - Editable by organizers
  weeklyTopic: string
  weeklyTopicAmharic?: string
  teacherName: string
  teacherNameAmharic?: string
  
  // Summary & Content
  amharicSummary: string
  englishSummary: string
  keyPoints: string[]
  bibleVerses?: string[]
  
  // Media & Links
  youtubeReplayLink?: string
  
  // Mezmur Information
  mezmur1: {
    title: string
    titleAmharic?: string
    lyrics?: string
    audioUrl?: string
  }
  mezmur2: {
    title: string
    titleAmharic?: string
    lyrics?: string
    audioUrl?: string
  }
  
  // Follow-up & Engagement
  followUpQuestions: string[]
  recapNote?: string
  
  // Administrative
  createdAt: string
  updatedAt: string
  createdBy: string // organizer ID/name
}

export interface EditableChurchInfo {
  // Church Leadership
  priestName: string
  priestNameAmharic: string
  teacherName: string
  teacherNameAmharic: string
  
  // Current Topic
  currentTopicEnglish: string
  currentTopicAmharic: string
  
  // Schedule & Location
  timritSchedule: string
  churchAddress: string
  mapsUrl: string
  
  // Communication
  telegramGroupName: string
  primaryOrganizerName: string
  primaryOrganizerPhone: string
  secondaryOrganizerName: string
  secondaryOrganizerPhone: string
}

// Form validation helpers for content entry
export interface ContentValidation {
  isRequired: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  errorMessage?: string
}

export interface EditableFieldConfig {
  field: keyof EditableWeeklyClass | keyof EditableChurchInfo
  label: string
  type: 'text' | 'textarea' | 'url' | 'date' | 'array'
  validation: ContentValidation
  placeholder?: string
  helpText?: string
}

// Content management permissions
export interface OrganizerPermissions {
  userId: string
  name: string
  email: string
  canEdit: boolean
  canPublish: boolean
  canDelete: boolean
  role: 'primary' | 'secondary' | 'helper'
}

// Future CMS integration points
export interface ContentManagementSystem {
  // Core content operations
  createWeeklyClass(data: Partial<EditableWeeklyClass>): Promise<EditableWeeklyClass>
  updateWeeklyClass(id: string, data: Partial<EditableWeeklyClass>): Promise<EditableWeeklyClass>
  deleteWeeklyClass(id: string): Promise<void>
  
  // Church info management
  updateChurchInfo(data: Partial<EditableChurchInfo>): Promise<EditableChurchInfo>
  
  // Content retrieval for public site
  getCurrentWeek(): Promise<EditableWeeklyClass>
  getWeekById(id: string): Promise<EditableWeeklyClass>
  getUpcomingWeeks(limit?: number): Promise<EditableWeeklyClass[]>
  getPastWeeks(limit?: number): Promise<EditableWeeklyClass[]>
  
  // User management
  validateOrganizer(credentials: any): Promise<OrganizerPermissions>
}