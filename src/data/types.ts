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

export interface Mezmur {
  title: string
  transliteration?: string
  lyrics?: string
  youtubeUrl?: string
}

export interface QuestionBase {
  id: string
  type: QuestionType
  /** Display text; may be Amharic, English, or mixed depending on the class */
  prompt: string
  /** Soft helper line so questions never read like an exam */
  helperText?: string
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice'
  options: string[]
  /** Index into `options` for the “best” answer used in recap analytics */
  correctIndex: number
  explanation: string
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: 'short-answer'
  placeholder?: string
}

export interface ReflectionQuestion extends QuestionBase {
  type: 'reflection'
  placeholder?: string
}

export interface FeedbackOpenQuestion extends QuestionBase {
  type: 'feedback-open'
  placeholder?: string
}

export type AttendanceChoice =
  | 'in-person'
  | 'online'
  | 'maybe'
  | 'cannot-attend'

export interface AttendanceQuestion extends QuestionBase {
  type: 'attendance'
  options: { value: AttendanceChoice; label: string }[]
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
  speaker: string
  amharicSummary: string
  englishSummary: string
  keyPoints: string[]
  verses?: string[]
  /** Full watch URL when available; UI still works if empty */
  youtubeUrl?: string
  mezmurs: [Mezmur, Mezmur]
  questions: Question[]
  /** Optional organizer-facing sentence distilled from open feedback (mock / future API). */
  feedbackSummary?: string
  /** Optional organizer-facing sentence about attendance signals (mock / future API). */
  attendanceSummary?: string
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
