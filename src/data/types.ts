/**
 * Core domain types for weekly classes.
 * Shaped so a future Supabase/Firebase layer can map rows → `WeeklyClass`
 * without renaming UI-facing fields.
 */

export type QuestionType =
  | 'multiple-choice'
  | 'short-answer'
  | 'reflection'
  | 'feedback-open'
  | 'attendance'

export type LocalizedText = {
  en?: string
  am?: string
}

export interface TeachingMainPoint {
  en?: string
  am?: string
}

export interface Mezmur {
  title: string
  titleEn?: string
  titleAm?: string
  transliteration?: string
  lyrics?: string
  lyricsEn?: string
  lyricsAm?: string
  noteEn?: string
  noteAm?: string
  youtubeUrl?: string
  audioUrl?: string
}

export interface QuestionBase {
  id: string
  type: QuestionType
  /** Display text; may be Amharic, English, or mixed depending on the class */
  prompt: string
  promptEn?: string
  promptAm?: string
  /** Soft helper line so questions never read like an exam */
  helperText?: string
  helperTextEn?: string
  helperTextAm?: string
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice'
  options: LocalizedText[]
  /** Index into `options` for the “best” answer used in recap analytics */
  correctIndex: number
  explanation: string
  explanationEn?: string
  explanationAm?: string
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: 'short-answer'
  placeholder?: string
  placeholderEn?: string
  placeholderAm?: string
}

export interface ReflectionQuestion extends QuestionBase {
  type: 'reflection'
  placeholder?: string
  placeholderEn?: string
  placeholderAm?: string
}

export interface FeedbackOpenQuestion extends QuestionBase {
  type: 'feedback-open'
  placeholder?: string
  placeholderEn?: string
  placeholderAm?: string
}

export type AttendanceChoice =
  | 'in-person'
  | 'online'
  | 'maybe'
  | 'cannot-attend'

export interface AttendanceQuestion extends QuestionBase {
  type: 'attendance'
  options: { value: AttendanceChoice; label: string; labelEn?: string; labelAm?: string }[]
}

export type Question =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | ReflectionQuestion
  | FeedbackOpenQuestion
  | AttendanceQuestion

export interface WeeklyClass {
  id: string
  /** ISO date string for the Tuesday session */
  date: string
  topic: string
  topicEn?: string
  topicAm?: string
  speaker: string
  amharicSummary: string
  englishSummary: string
  keyPoints: string[]
  verses?: string[]
  /** Full watch URL when available; UI still works if empty */
  youtubeUrl?: string
  audioUrl?: string
  audioTitle?: string
  audioTitleEn?: string
  audioTitleAm?: string
  audioNote?: string
  audioNoteEn?: string
  audioNoteAm?: string
  lessonMediaEnabled?: boolean
  teachingNotes?: string
  teachingNotesEn?: string
  teachingNotesAm?: string
  mainPoints?: TeachingMainPoint[]
  keyVerse?: string
  organizerNote?: string
  status?: 'draft' | 'published'
  mezmurs: [Mezmur, Mezmur]
  questions: Question[]
}

/** Aggregated analytics for the organizer dashboard (mock for now). */
export interface OrganizerSnapshot {
  weekId: string
  weekLabel: string
  totalResponses: number
  reviewedOrWatched: number
  /** Which MC question id had the lowest correct rate this week */
  mostMissedQuestionId: string
  mostMissedQuestionLabel: string
  missRatePercent: number
  /** Short phrases extracted from open feedback (mocked) */
  topUnclearTopics: string[]
  /** Average self-reported difficulty following Amharic (1–5), mock trend */
  languageDifficultyAvg: number
}

export interface AttendanceSlice {
  label: string
  value: number
  fill: string
}

export interface RecapSuggestion {
  title: string
  detail: string
}

export interface QuestionOptionDistribution {
  optionIndex: number
  optionText: string
  responses: number
  percentage: number
}

export interface WeeklyQuestionStat {
  questionId: string
  prompt: string
  totalResponses: number
  correctResponses: number
  incorrectResponses: number
  percentCorrect: number
  percentIncorrect: number
  correctOptionIndex: number
  correctOptionText: string
  optionDistribution: QuestionOptionDistribution[]
}

export interface WeeklyQuestionStatsReport {
  weekId: string
  totalRespondents: number
  totalAnswersSubmitted: number
  averagePerformance: number
  mostMissedQuestionId: string | null
  mostMissedQuestionPrompt: string | null
  mostMissedQuestionMissRate: number
  questionStats: WeeklyQuestionStat[]
  commonWeakAreas: string[]
}
