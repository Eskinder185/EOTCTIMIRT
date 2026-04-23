/**
 * Supabase data access layer for EOTC Timirit
 * Provides functions to fetch and manage content from the database
 */

import { supabase } from './supabase'
import { pickLocalized } from './bilingualText'
import type { 
  WeeklyClass, 
  OrganizerSnapshot, 
  AttendanceSlice,
  RecapSuggestion,
  Question,
  Mezmur,
  LocalizedText,
  QuestionType,
  AttendanceChoice,
  WeeklyQuestionStatsReport,
  WeeklyQuestionStat,
} from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type {
  WeeklyKnowledgeEditorInput,
  WeeklyKnowledgeItem,
  WeeklyKnowledgeStatus,
} from '../data/weeklyKnowledge'

const CACHE_DURATION_MS = 60 * 1000
let weeklyClassesCache: WeeklyClass[] | null = null
let weeklyClassesCacheTimestamp = 0
let upcomingTimiritAdminCache: UpcomingTimirtEditorInput | null | undefined
let upcomingTimiritAdminCacheTimestamp = 0
let weeklyKnowledgeCache: WeeklyKnowledgeItem | null | undefined
let weeklyKnowledgeCacheTimestamp = 0

function isFresh(timestamp: number) {
  return Date.now() - timestamp < CACHE_DURATION_MS
}

function invalidateDataCaches() {
  weeklyClassesCache = null
  weeklyClassesCacheTimestamp = 0
  upcomingTimiritAdminCache = undefined
  upcomingTimiritAdminCacheTimestamp = 0
  weeklyKnowledgeCache = undefined
  weeklyKnowledgeCacheTimestamp = 0
}

const WEEKLY_KNOWLEDGE_TYPES = new Set([
  'Knowledge',
  'Fun Fact',
  'Church Reminder',
  'Weekly Greeting',
  'Important Note',
  'Vocabulary / Term of the Week',
])

function normalizeWeeklyKnowledgeStatus(value: string | null | undefined): WeeklyKnowledgeStatus {
  if (!value) return 'draft'
  const normalized = value.toLowerCase()
  if (normalized === 'published') return 'published'
  if (normalized === 'hidden') return 'hidden'
  return 'draft'
}

function mapWeeklyKnowledge(row: any): WeeklyKnowledgeItem {
  const titleEn = row.title_en ?? undefined
  const titleAm = row.title_am ?? undefined
  const subtitleEn = row.subtitle_en ?? undefined
  const subtitleAm = row.subtitle_am ?? undefined
  const contentEn = row.content_en ?? undefined
  const contentAm = row.content_am ?? undefined
  const extraNoteEn = row.extra_note_en ?? undefined
  const extraNoteAm = row.extra_note_am ?? undefined
  const buttonTextEn = row.button_text_en ?? undefined
  const buttonTextAm = row.button_text_am ?? undefined

  return {
    id: row.id,
    title: pickLocalized('en', titleEn, titleAm, row.title),
    titleEn,
    titleAm,
    subtitle: pickLocalized('en', subtitleEn, subtitleAm, row.subtitle),
    subtitleEn,
    subtitleAm,
    content: pickLocalized('en', contentEn, contentAm, row.content),
    contentEn,
    contentAm,
    extraNote: pickLocalized('en', extraNoteEn, extraNoteAm, row.extra_note),
    extraNoteEn,
    extraNoteAm,
    imageUrl: row.image_url || undefined,
    buttonText: pickLocalized('en', buttonTextEn, buttonTextAm, row.button_text),
    buttonTextEn,
    buttonTextAm,
    buttonLink: row.button_link || undefined,
    contentType: WEEKLY_KNOWLEDGE_TYPES.has(row.content_type) ? row.content_type : 'Knowledge',
    status: normalizeWeeklyKnowledgeStatus(row.status),
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    isActive: row.is_active ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function isMissingYoutubeUrlColumnError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false
  }

  const message = error.message ?? ''
  return error.code === 'PGRST204' || message.includes('youtube_url')
}

export function getCachedWeeklyClasses(): WeeklyClass[] | null {
  if (!weeklyClassesCache || !isFresh(weeklyClassesCacheTimestamp)) {
    return null
  }

  return weeklyClassesCache
}

export interface EditorMezmurInput {
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

export interface EditorQuestionInput {
  id?: string
  type: QuestionType
  prompt: string
  promptEn?: string
  promptAm?: string
  helperText?: string
  helperTextEn?: string
  helperTextAm?: string
  placeholder?: string
  placeholderEn?: string
  placeholderAm?: string
  correctIndex?: number
  explanation?: string
  explanationEn?: string
  explanationAm?: string
  options?: LocalizedText[]
  attendanceOptions?: Array<{
    value: AttendanceChoice
    label: string
    labelEn?: string
    labelAm?: string
  }>
}

export interface WeeklyClassEditorInput {
  id: string
  date: string
  topic: string
  topicEn?: string
  topicAm?: string
  speaker: string
  amharicSummary: string
  englishSummary: string
  keyPoints: string[]
  verses: string[]
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
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
  questions: EditorQuestionInput[]
  feedbackSummary?: string
  attendanceSummary?: string
}

export interface UpcomingTimirtEditorInput {
  id?: string
  scheduledDate: string
  topicPreview: string
  topicPreviewEn?: string
  topicPreviewAm?: string
  note: string
  noteEn?: string
  noteAm?: string
  lessonYoutubeUrl?: string
  lessonAudioUrl?: string
  lessonAudioTitle?: string
  lessonAudioTitleEn?: string
  lessonAudioTitleAm?: string
  lessonNote?: string
  lessonNoteEn?: string
  lessonNoteAm?: string
  weeklyKnowledgeContent?: string
  weeklyKnowledgeContentEn?: string
  weeklyKnowledgeContentAm?: string
  weeklyKnowledgeImageUrl?: string
  keyVerse?: string
  keyVerseEn?: string
  keyVerseAm?: string
  organizerNote?: string
  organizerNoteEn?: string
  organizerNoteAm?: string
  classSummaryContent?: string
  classSummaryContentEn?: string
  classSummaryContentAm?: string
  isActive: boolean
  publicationStatus: 'draft' | 'published'
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
}

export interface UpcomingTimirtListItem {
  id: string
  scheduledDate: string
  topicPreview: string
  note: string
  isActive: boolean
  publicationStatus: 'draft' | 'published'
}

export interface AnonymousFeedbackItem {
  id: string
  category: string
  subject?: string
  message: string
  status?: string
  createdAt: string
}

export interface ReviewSessionItem {
  id: string
  weeklyClassId: string
  userFingerprint?: string
  questionCount?: number
  correctAnswers?: number
  scorePercent?: number
  completedAt?: string
  createdAt: string
}

// ============================================================================
// PUBLIC DATA FUNCTIONS (no authentication required)
// ============================================================================

/**
 * Get all weekly classes, ordered by date (newest first)
 */
export async function getWeeklyClasses(): Promise<WeeklyClass[]> {
  if (weeklyClassesCache && isFresh(weeklyClassesCacheTimestamp)) {
    return weeklyClassesCache
  }

  if (!supabase) {
    return []
  }

  const { data: classes, error: classesError } = await supabase
    .from('weekly_classes')
    .select(`
      *,
      mezmurs (
        id,
        title,
        title_en,
        title_am,
        transliteration,
        lyrics,
        lyrics_en,
        lyrics_am,
        note_en,
        note_am,
        youtube_url,
        audio_url,
        order_index
      ),
      questions (
        id,
        type,
        prompt,
        prompt_en,
        prompt_am,
        helper_text,
        helper_text_en,
        helper_text_am,
        placeholder,
        placeholder_en,
        placeholder_am,
        correct_index,
        explanation,
        explanation_en,
        explanation_am,
        order_index,
        multiple_choice_options (
          option_text,
          option_text_en,
          option_text_am,
          option_index
        ),
        attendance_options (
          value,
          label,
          label_en,
          label_am,
          option_index
        )
      )
    `)
    .order('date', { ascending: false })

  if (classesError) {
    console.error('Error fetching weekly classes:', classesError)
    throw classesError
  }

  // Transform database format to TypeScript types
  const transformed = classes.map(transformWeeklyClass)
  weeklyClassesCache = transformed
  weeklyClassesCacheTimestamp = Date.now()
  return transformed
}

/**
 * Get a specific weekly class by ID
 */
export async function getWeeklyClass(id: string): Promise<WeeklyClass | null> {
  if (weeklyClassesCache && isFresh(weeklyClassesCacheTimestamp)) {
    const cached = weeklyClassesCache.find((weeklyClass) => weeklyClass.id === id)
    if (cached) {
      return cached
    }
  }

  if (!supabase) {
    return null
  }

  const { data: classData, error } = await supabase
    .from('weekly_classes')
    .select(`
      *,
      mezmurs (
        id,
        title,
        title_en,
        title_am,
        transliteration,
        lyrics,
        lyrics_en,
        lyrics_am,
        note_en,
        note_am,
        youtube_url,
        audio_url,
        order_index
      ),
      questions (
        id,
        type,
        prompt,
        prompt_en,
        prompt_am,
        helper_text,
        helper_text_en,
        helper_text_am,
        placeholder,
        placeholder_en,
        placeholder_am,
        correct_index,
        explanation,
        explanation_en,
        explanation_am,
        order_index,
        multiple_choice_options (
          option_text,
          option_text_en,
          option_text_am,
          option_index
        ),
        attendance_options (
          value,
          label,
          label_en,
          label_am,
          option_index
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching weekly class:', error)
    throw error
  }

  return transformWeeklyClass(classData)
}

/**
 * Get the upcoming Timirit preview
 */
export async function getUpcomingTimirt(): Promise<UpcomingTimirtPreview | null> {
  if (!supabase) {
    return null
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const data = await fetchUpcomingTimiritRecordForPublic({ fromDate: todayIso })
    ?? await fetchUpcomingTimiritRecordForPublic({})

  if (!data) {
    return null
  }

  // Sort mezmurs by order_index
  const sortedMezmurs = data.upcoming_mezmurs
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((m: any) => ({
      title: m.title,
      transliteration: m.transliteration || undefined,
      lyrics: m.lyrics || undefined,
      youtubeUrl: m.youtube_url || undefined,
      audioUrl: m.audio_url || undefined,
    }))

  return {
    scheduledDate: data.scheduled_date,
    topicPreview: data.topic_preview,
    note: data.note,
    lessonYoutubeUrl: data.lesson_youtube_url || undefined,
    lessonAudioUrl: data.lesson_audio_url || undefined,
    lessonAudioTitle: data.lesson_audio_title || undefined,
    lessonNote: data.lesson_note || undefined,
    weeklyKnowledgeContent: data.weekly_knowledge_content || undefined,
    weeklyKnowledgeImageUrl: data.weekly_knowledge_image_url || undefined,
    keyVerse: data.key_verse || undefined,
    organizerNote: data.organizer_note || undefined,
    classSummaryContent: data.class_summary_content || undefined,
    publicationStatus: data.publication_status === 'published' ? 'published' : 'draft',
    mezmurs: [sortedMezmurs[0], sortedMezmurs[1]] as [Mezmur, Mezmur]
  }
}

export async function getActiveWeeklyKnowledge(targetDate?: string): Promise<WeeklyKnowledgeItem | null> {
  if (weeklyKnowledgeCache !== undefined && isFresh(weeklyKnowledgeCacheTimestamp)) {
    return weeklyKnowledgeCache
  }

  if (!supabase) {
    return null
  }

  const date = targetDate || new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('weekly_knowledge')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(25)

  if (error) {
    throw error
  }

  const row = (data ?? []).find((candidate) => {
    const startsOk = !candidate.start_date || candidate.start_date <= date
    const endsOk = !candidate.end_date || candidate.end_date >= date
    return startsOk && endsOk
  })
  const result = row ? mapWeeklyKnowledge(row) : null
  weeklyKnowledgeCache = result
  weeklyKnowledgeCacheTimestamp = Date.now()
  return result
}

export async function listWeeklyKnowledgeForAdmin(): Promise<WeeklyKnowledgeItem[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('weekly_knowledge')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapWeeklyKnowledge)
}

export async function getWeeklyKnowledgeForAdmin(id: string): Promise<WeeklyKnowledgeItem | null> {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('weekly_knowledge')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapWeeklyKnowledge(data) : null
}

export async function saveWeeklyKnowledgeEditor(input: WeeklyKnowledgeEditorInput): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const normalizedStatus = normalizeWeeklyKnowledgeStatus(input.status)
  const normalizedIsActive = normalizedStatus === 'published' ? input.isActive : false

  const titleEn = input.titleEn?.trim() || input.title.trim()
  const titleAm = input.titleAm?.trim() || null
  const subtitleEn = input.subtitleEn?.trim() || input.subtitle?.trim() || null
  const subtitleAm = input.subtitleAm?.trim() || null
  const contentEn = input.contentEn?.trim() || input.content.trim()
  const contentAm = input.contentAm?.trim() || null
  const extraNoteEn = input.extraNoteEn?.trim() || input.extraNote?.trim() || null
  const extraNoteAm = input.extraNoteAm?.trim() || null
  const buttonTextEn = input.buttonTextEn?.trim() || input.buttonText?.trim() || null
  const buttonTextAm = input.buttonTextAm?.trim() || null

  const { data, error } = await supabase
    .from('weekly_knowledge')
    .upsert({
      id: input.id,
      title: titleEn,
      title_en: titleEn,
      title_am: titleAm,
      subtitle: subtitleEn,
      subtitle_en: subtitleEn,
      subtitle_am: subtitleAm,
      content: contentEn,
      content_en: contentEn,
      content_am: contentAm,
      extra_note: extraNoteEn,
      extra_note_en: extraNoteEn,
      extra_note_am: extraNoteAm,
      image_url: input.imageUrl?.trim() || null,
      button_text: buttonTextEn,
      button_text_en: buttonTextEn,
      button_text_am: buttonTextAm,
      button_link: input.buttonLink?.trim() || null,
      content_type: input.contentType,
      status: normalizedStatus,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      is_active: normalizedIsActive,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  if (normalizedStatus === 'published' && normalizedIsActive) {
    const { error: deactivateOthersError } = await supabase
      .from('weekly_knowledge')
      .update({ is_active: false })
      .neq('id', data.id)
      .eq('is_active', true)
    if (deactivateOthersError) {
      throw deactivateOthersError
    }
  }

  invalidateDataCaches()
  return data.id
}

export async function setWeeklyKnowledgeStatus(
  id: string,
  status: WeeklyKnowledgeStatus,
  isActive: boolean,
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  if (status === 'published' && isActive) {
    const { error: deactivateError } = await supabase
      .from('weekly_knowledge')
      .update({ is_active: false })
      .neq('id', id)
      .eq('is_active', true)
    if (deactivateError) {
      throw deactivateError
    }
  }

  const { error } = await supabase
    .from('weekly_knowledge')
    .update({
      status,
      is_active: status === 'published' ? isActive : false,
    })
    .eq('id', id)

  if (error) {
    throw error
  }

  invalidateDataCaches()
}

export async function listAnonymousFeedbackForAdmin(limit = 50): Promise<AnonymousFeedbackItem[]> {
  if (!supabase) {
    return []
  }

  const tableName = 'anonymous_feedback'
  const { data, error } = await supabase
    .from(tableName)
    .select('id, category, subject, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    subject: row.subject || undefined,
    message: row.message,
    status: row.status || undefined,
    createdAt: row.created_at,
  }))
}

export async function listReviewSessionsForWeek(weeklyClassId: string): Promise<ReviewSessionItem[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('review_sessions')
    .select('id, weekly_class_id, user_fingerprint, question_count, correct_answers, score_percent, completed_at, created_at')
    .eq('weekly_class_id', weeklyClassId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    weeklyClassId: row.weekly_class_id,
    userFingerprint: row.user_fingerprint || undefined,
    questionCount: row.question_count ?? undefined,
    correctAnswers: row.correct_answers ?? undefined,
    scorePercent: row.score_percent ?? undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
  }))
}

async function fetchUpcomingTimiritRecordForPublic({
  fromDate,
}: {
  fromDate?: string
}): Promise<any | null> {
  if (!supabase) {
    return null
  }

  let primaryQuery = supabase
    .from('upcoming_timirit')
    .select(`
      *,
      upcoming_mezmurs (
        title,
        transliteration,
        lyrics,
        youtube_url,
        audio_url,
        order_index
      )
    `)
    .eq('is_active', true)
    .order('scheduled_date', { ascending: true })
    .limit(1)

  if (fromDate) {
    primaryQuery = primaryQuery.gte('scheduled_date', fromDate)
  }

  const primary = await primaryQuery
  let rows: any[] | null = primary.data
  let error: any = primary.error

  if (isMissingYoutubeUrlColumnError(primary.error)) {
    let fallbackQuery = supabase
      .from('upcoming_timirit')
      .select(`
        *,
        upcoming_mezmurs (
          title,
          transliteration,
          lyrics,
          order_index
        )
      `)
      .eq('is_active', true)
      .order('scheduled_date', { ascending: true })
      .limit(1)

    if (fromDate) {
      fallbackQuery = fallbackQuery.gte('scheduled_date', fromDate)
    }

    const fallback = await fallbackQuery
    rows = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('Error fetching upcoming Timirit:', error)
    throw error
  }

  return rows?.[0] ?? null
}

/**
 * Submit user responses to questions
 */
export async function submitUserResponses(
  weeklyClassId: string,
  responses: Array<{
    questionId: string
    responseText?: string
    selectedOptionIndex?: number
    attendanceChoice?: AttendanceChoice
  }>,
  userFingerprint: string
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const responseData = responses.map(response => ({
    weekly_class_id: weeklyClassId,
    question_id: response.questionId,
    user_fingerprint: userFingerprint,
    response_text: response.responseText || null,
    selected_option_index: response.selectedOptionIndex ?? null,
    attendance_choice: response.attendanceChoice || null
  }))

  const { error } = await supabase
    .from('user_responses')
    .upsert(responseData, {
      onConflict: 'weekly_class_id,question_id,user_fingerprint',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Error submitting responses:', error)
    throw error
  }
}

// ============================================================================
// ORGANIZER ANALYTICS FUNCTIONS (requires authentication)
// ============================================================================

/**
 * Get organizer analytics for all weeks
 */
export async function getOrganizerAnalytics(): Promise<OrganizerSnapshot[]> {
  if (!supabase) {
    return []
  }

  const classes = await getWeeklyClasses()
  const analytics: OrganizerSnapshot[] = []

  for (const weeklyClass of classes) {
    try {
      const { data, error } = await supabase.rpc('get_organizer_analytics', {
        target_week_id: weeklyClass.id
      })

      if (error) {
        console.error(`Error getting analytics for week ${weeklyClass.id}:`, error)
        continue
      }

      if (data && data.length > 0) {
        const weekData = data[0]
        
        // Extract unclear topics from the JSONB array
        const topUnclearTopics = Array.isArray(weekData.top_unclear_topics) 
          ? weekData.top_unclear_topics.filter((topic): topic is string => typeof topic === 'string')
          : []

        analytics.push({
          weekId: weekData.week_id,
          weekLabel: weekData.week_label,
          totalResponses: Number(weekData.total_responses),
          reviewedOrWatched: Number(weekData.reviewed_or_watched),
          mostMissedQuestionId: weekData.most_missed_question_id || '',
          mostMissedQuestionLabel: weekData.most_missed_question_label || '',
          missRatePercent: weekData.miss_rate_percent || 0,
          topUnclearTopics,
          languageDifficultyAvg: Number(weekData.language_difficulty_avg) || 3.0
        })
      }
    } catch (err) {
      console.error(`Failed to get analytics for week ${weeklyClass.id}:`, err)
    }
  }

  return analytics.sort((a, b) => new Date(b.weekId).getTime() - new Date(a.weekId).getTime())
}

/**
 * Get attendance breakdown for a specific week
 */
export async function getAttendanceSummary(weekId: string): Promise<AttendanceSlice[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase.rpc('get_attendance_summary', {
    target_week_id: weekId
  })

  if (error) {
    console.error('Error getting attendance summary:', error)
    throw error
  }

  // Transform to the expected format with colors
  const colorMap: Record<AttendanceChoice, string> = {
    'in-person': '#5c7c6a',
    'online': '#6b8cae',
    'maybe': '#c6a24a',
    'cannot-attend': '#a89b8f'
  }

  return data.map(item => ({
    label: item.attendance_choice === 'in-person' ? 'In person' :
           item.attendance_choice === 'online' ? 'Online' :
           item.attendance_choice === 'maybe' ? 'Maybe' :
           'Cannot attend',
    value: Number(item.choice_count),
    fill: colorMap[item.attendance_choice]
  }))
}

/**
 * Get recap suggestions based on response analysis
 */
export async function getRecapSuggestions(weekId: string): Promise<RecapSuggestion[]> {
  const analytics = await getOrganizerAnalytics()
  const weekData = analytics.find(a => a.weekId === weekId)
  
  if (!weekData) {
    return []
  }

  const suggestions: RecapSuggestion[] = []

  // Suggest recap for high-miss-rate questions
  if (weekData.mostMissedQuestionId && weekData.missRatePercent > 30) {
    suggestions.push({
      title: `Revisit: ${weekData.mostMissedQuestionLabel}`,
      detail: `${weekData.missRatePercent}% miss rate suggests this concept needs clarification.`
    })
  }

  // Suggest clarity for unclear topics
  weekData.topUnclearTopics.slice(0, 2).forEach(topic => {
    suggestions.push({
      title: `Address unclear topic: ${topic}`,
      detail: 'Multiple responses mentioned confusion about this topic.'
    })
  })

  // Language difficulty suggestion
  if (weekData.languageDifficultyAvg > 3.5) {
    suggestions.push({
      title: 'Consider bilingual explanation pause',
      detail: `Language difficulty average of ${weekData.languageDifficultyAvg.toFixed(1)} suggests need for translation help.`
    })
  }

  return suggestions
}

export async function getWeeklyQuestionStats(weekId: string): Promise<WeeklyQuestionStatsReport | null> {
  if (!supabase) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      id,
      prompt,
      prompt_en,
      prompt_am,
      type,
      correct_index,
      multiple_choice_options (
        option_text,
        option_text_en,
        option_text_am,
        option_index
      )
    `)
    .eq('weekly_class_id', weekId)
    .eq('type', 'multiple-choice')

  if (questionsError) {
    console.error('Error loading question stats questions:', questionsError)
    throw questionsError
  }

  const mcQuestions = (questions ?? []).filter((question) => question.correct_index !== null)

  if (mcQuestions.length === 0) {
    return {
      weekId,
      totalRespondents: 0,
      totalAnswersSubmitted: 0,
      averagePerformance: 0,
      mostMissedQuestionId: null,
      mostMissedQuestionPrompt: null,
      mostMissedQuestionMissRate: 0,
      questionStats: [],
      commonWeakAreas: [],
    }
  }

  const questionIds = mcQuestions.map((question) => question.id)
  const { data: responses, error: responsesError } = await supabase
    .from('user_responses')
    .select('question_id, selected_option_index, user_fingerprint')
    .eq('weekly_class_id', weekId)
    .in('question_id', questionIds)
    .not('selected_option_index', 'is', null)

  if (responsesError) {
    console.error('Error loading question stats responses:', responsesError)
    throw responsesError
  }

  const normalizedResponses = responses ?? []
  const respondentSet = new Set(
    normalizedResponses
      .map((response) => response.user_fingerprint)
      .filter((fingerprint): fingerprint is string => typeof fingerprint === 'string' && fingerprint.length > 0),
  )

  const questionStats: WeeklyQuestionStat[] = mcQuestions.map((question) => {
    const questionResponses = normalizedResponses.filter((response) => response.question_id === question.id)
    const totalResponses = questionResponses.length
    const correctOptionIndex = question.correct_index as number
    const correctResponses = questionResponses.filter(
      (response) => response.selected_option_index === correctOptionIndex,
    ).length
    const incorrectResponses = totalResponses - correctResponses
    const percentCorrect = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0
    const percentIncorrect = totalResponses > 0 ? 100 - percentCorrect : 0
    const options = (question.multiple_choice_options ?? [])
      .sort((a, b) => a.option_index - b.option_index)
    const correctOptionRow = options.find((option) => option.option_index === correctOptionIndex)
    const correctOptionText = pickLocalized(
      'en',
      correctOptionRow?.option_text_en,
      correctOptionRow?.option_text_am,
      correctOptionRow?.option_text,
    ) || 'Correct answer'

    return {
      questionId: question.id,
      prompt: pickLocalized('en', question.prompt_en, question.prompt_am, question.prompt),
      totalResponses,
      correctResponses,
      incorrectResponses,
      percentCorrect,
      percentIncorrect,
      correctOptionIndex,
      correctOptionText,
      optionDistribution: options.map((option) => {
        const count = questionResponses.filter(
          (response) => response.selected_option_index === option.option_index,
        ).length
        return {
          optionIndex: option.option_index,
          optionText: pickLocalized('en', option.option_text_en, option.option_text_am, option.option_text),
          responses: count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        }
      }),
    }
  })

  const totalAnswersSubmitted = questionStats.reduce((sum, question) => sum + question.totalResponses, 0)
  const totalCorrect = questionStats.reduce((sum, question) => sum + question.correctResponses, 0)
  const averagePerformance = totalAnswersSubmitted > 0
    ? Math.round((totalCorrect / totalAnswersSubmitted) * 100)
    : 0
  const mostMissed = [...questionStats]
    .sort((a, b) => b.percentIncorrect - a.percentIncorrect)[0]

  return {
    weekId,
    totalRespondents: respondentSet.size,
    totalAnswersSubmitted,
    averagePerformance,
    mostMissedQuestionId: mostMissed?.questionId ?? null,
    mostMissedQuestionPrompt: mostMissed?.prompt ?? null,
    mostMissedQuestionMissRate: mostMissed?.percentIncorrect ?? 0,
    questionStats,
    commonWeakAreas: questionStats
      .filter((question) => question.percentIncorrect >= 40 && question.totalResponses > 0)
      .sort((a, b) => b.percentIncorrect - a.percentIncorrect)
      .slice(0, 3)
      .map((question) => question.prompt),
  }
}

export async function saveWeeklyClassEditor(data: WeeklyClassEditorInput): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const normalizedId = data.id.trim() || data.date
  const normalizedQuestions = data.questions.map((question, index) => ({
    ...question,
    id: question.id?.trim() || `${normalizedId}-q-${crypto.randomUUID()}`,
    orderIndex: index,
  }))

  const existingQuestions = await supabase
    .from('questions')
    .select('id')
    .eq('weekly_class_id', normalizedId)

  if (existingQuestions.error) {
    throw existingQuestions.error
  }

  const keptQuestionIds = new Set(normalizedQuestions.map((question) => question.id))
  const removedQuestionIds = (existingQuestions.data ?? [])
    .map((question) => question.id)
    .filter((questionId) => !keptQuestionIds.has(questionId))

  const { error: classError } = await supabase
    .from('weekly_classes')
    .upsert({
      id: normalizedId,
      date: data.date,
      topic: data.topic,
      speaker: data.speaker,
      amharic_summary: data.amharicSummary,
      english_summary: data.englishSummary,
      key_points: data.keyPoints,
      verses: data.verses,
      youtube_url: data.youtubeUrl || null,
      audio_url: data.audioUrl || null,
      audio_title: data.audioTitle || null,
      audio_note: data.audioNote || null,
      lesson_media_enabled: data.lessonMediaEnabled ?? true,
      teaching_notes: data.teachingNotes || null,
      feedback_summary: data.feedbackSummary || null,
      attendance_summary: data.attendanceSummary || null,
    })

  if (classError) {
    throw classError
  }

  const { error: deleteMezmursError } = await supabase
    .from('mezmurs')
    .delete()
    .eq('weekly_class_id', normalizedId)

  if (deleteMezmursError) {
    throw deleteMezmursError
  }

  const { error: mezmursError } = await supabase
    .from('mezmurs')
    .insert(
      data.mezmurs.map((mezmur, index) => ({
        weekly_class_id: normalizedId,
        title: mezmur.title,
        transliteration: mezmur.transliteration || null,
        lyrics: mezmur.lyrics || null,
        youtube_url: mezmur.youtubeUrl || null,
        audio_url: mezmur.audioUrl || null,
        order_index: index,
      })),
    )

  if (mezmursError) {
    throw mezmursError
  }

  const { error: questionsError } = await supabase
    .from('questions')
    .upsert(
      normalizedQuestions.map((question) => ({
        id: question.id,
        weekly_class_id: normalizedId,
        type: question.type,
        prompt: question.prompt,
        helper_text: question.helperText || null,
        placeholder: question.placeholder || null,
        correct_index: question.type === 'multiple-choice' ? (question.correctIndex ?? 0) : null,
        explanation: question.type === 'multiple-choice' ? (question.explanation || null) : null,
        order_index: question.orderIndex,
      })),
    )

  if (questionsError) {
    throw questionsError
  }

  for (const question of normalizedQuestions) {
    const questionId = question.id as string

    const { error: deleteChoiceError } = await supabase
      .from('multiple_choice_options')
      .delete()
      .eq('question_id', questionId)

    if (deleteChoiceError) {
      throw deleteChoiceError
    }

    const { error: deleteAttendanceError } = await supabase
      .from('attendance_options')
      .delete()
      .eq('question_id', questionId)

    if (deleteAttendanceError) {
      throw deleteAttendanceError
    }

    if (question.type === 'multiple-choice' && question.options && question.options.length > 0) {
      const { error: choiceError } = await supabase
        .from('multiple_choice_options')
        .insert(
          question.options.map((optionText, optionIndex) => ({
            question_id: questionId,
            option_text: optionText,
            option_index: optionIndex,
          })),
        )

      if (choiceError) {
        throw choiceError
      }
    }

    if (question.type === 'attendance') {
      const attendanceOptions = question.attendanceOptions ?? [
        { value: 'in-person', label: 'In person' },
        { value: 'online', label: 'Online' },
        { value: 'maybe', label: 'Maybe' },
        { value: 'cannot-attend', label: 'Cannot attend' },
      ]

      const { error: attendanceError } = await supabase
        .from('attendance_options')
        .insert(
          attendanceOptions.map((option, optionIndex) => ({
            question_id: questionId,
            value: option.value,
            label: option.label,
            option_index: optionIndex,
          })),
        )

      if (attendanceError) {
        throw attendanceError
      }
    }
  }

  if (removedQuestionIds.length > 0) {
    const { error: removeQuestionsError } = await supabase
      .from('questions')
      .delete()
      .in('id', removedQuestionIds)

    if (removeQuestionsError) {
      throw removeQuestionsError
    }
  }

  invalidateDataCaches()
  return normalizedId
}

export async function getUpcomingTimirtForAdmin(id?: string): Promise<UpcomingTimirtEditorInput | null> {
  if (!id && upcomingTimiritAdminCache !== undefined && isFresh(upcomingTimiritAdminCacheTimestamp)) {
    return upcomingTimiritAdminCache
  }

  if (!supabase) {
    return null
  }

  let primaryQuery = supabase
    .from('upcoming_timirit')
    .select(`
      *,
      upcoming_mezmurs (
        title,
        transliteration,
        lyrics,
        youtube_url,
        audio_url,
        order_index
      )
    `)
    .order('scheduled_date', { ascending: true })
    .limit(1)

  primaryQuery = id ? primaryQuery.eq('id', id) : primaryQuery.eq('is_active', true)
  const primary = await primaryQuery

  let data: any = primary.data
  let error: any = primary.error

  if (isMissingYoutubeUrlColumnError(primary.error)) {
    let fallbackQuery = supabase
      .from('upcoming_timirit')
      .select(`
        *,
        upcoming_mezmurs (
          title,
          transliteration,
          lyrics,
          order_index
        )
      `)
      .order('scheduled_date', { ascending: true })
      .limit(1)
    fallbackQuery = id ? fallbackQuery.eq('id', id) : fallbackQuery.eq('is_active', true)
    const fallback = await fallbackQuery
    data = fallback.data
    error = fallback.error
  }

  const row = Array.isArray(data) ? data[0] : data

  if (error || !row) {
    if (error?.code === 'PGRST116' || !row) {
      return null
    }

    throw error
  }

  const sortedMezmurs = Array.isArray(row.upcoming_mezmurs)
    ? row.upcoming_mezmurs
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((mezmur: any) => ({
          title: mezmur.title,
          transliteration: mezmur.transliteration || undefined,
          lyrics: mezmur.lyrics || undefined,
          youtubeUrl: mezmur.youtube_url || undefined,
          audioUrl: mezmur.audio_url || undefined,
        }))
    : []

  const result: UpcomingTimirtEditorInput = {
    id: row.id,
    scheduledDate: row.scheduled_date,
    topicPreview: row.topic_preview,
    note: row.note,
    lessonYoutubeUrl: row.lesson_youtube_url || undefined,
    lessonAudioUrl: row.lesson_audio_url || undefined,
    lessonAudioTitle: row.lesson_audio_title || undefined,
    lessonNote: row.lesson_note || undefined,
    weeklyKnowledgeContent: row.weekly_knowledge_content || undefined,
    weeklyKnowledgeImageUrl: row.weekly_knowledge_image_url || undefined,
    keyVerse: row.key_verse || undefined,
    organizerNote: row.organizer_note || undefined,
    classSummaryContent: row.class_summary_content || undefined,
    isActive: row.is_active ?? true,
    publicationStatus: row.publication_status === 'published' ? 'published' : 'draft',
    mezmurs: [
      sortedMezmurs[0] ?? { title: '' },
      sortedMezmurs[1] ?? { title: '' },
    ] as [EditorMezmurInput, EditorMezmurInput],
  }

  if (!id) {
    upcomingTimiritAdminCache = result
    upcomingTimiritAdminCacheTimestamp = Date.now()
  }
  return result
}

export async function saveUpcomingTimirtEditor(data: UpcomingTimirtEditorInput): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: upcomingRecord, error: upcomingError } = await supabase
    .from('upcoming_timirit')
    .upsert({
      id: data.id,
      scheduled_date: data.scheduledDate,
      topic_preview: data.topicPreview,
      note: data.note,
      lesson_youtube_url: data.lessonYoutubeUrl || null,
      lesson_audio_url: data.lessonAudioUrl || null,
      lesson_audio_title: data.lessonAudioTitle || null,
      lesson_note: data.lessonNote || null,
      weekly_knowledge_content: data.weeklyKnowledgeContent || null,
      weekly_knowledge_image_url: data.weeklyKnowledgeImageUrl || null,
      key_verse: data.keyVerse || null,
      organizer_note: data.organizerNote || null,
      class_summary_content: data.classSummaryContent || null,
      is_active: data.isActive,
      publication_status: data.publicationStatus,
    })
    .select('id')
    .single()

  if (upcomingError) {
    throw upcomingError
  }

  const upcomingId = upcomingRecord.id

  const { error: deleteMezmursError } = await supabase
    .from('upcoming_mezmurs')
    .delete()
    .eq('upcoming_timirit_id', upcomingId)

  if (deleteMezmursError) {
    throw deleteMezmursError
  }

  let { error: insertMezmursError } = await supabase
    .from('upcoming_mezmurs')
    .insert(
      data.mezmurs.map((mezmur, index) => ({
        upcoming_timirit_id: upcomingId,
        title: mezmur.title,
        transliteration: mezmur.transliteration || null,
        lyrics: mezmur.lyrics || null,
        youtube_url: mezmur.youtubeUrl || null,
        audio_url: mezmur.audioUrl || null,
        order_index: index,
      })),
    )

  if (isMissingYoutubeUrlColumnError(insertMezmursError)) {
    const fallbackInsert = await supabase
      .from('upcoming_mezmurs')
      .insert(
        data.mezmurs.map((mezmur, index) => ({
          upcoming_timirit_id: upcomingId,
          title: mezmur.title,
          transliteration: mezmur.transliteration || null,
          lyrics: mezmur.lyrics || null,
          order_index: index,
        })),
      )
    insertMezmursError = fallbackInsert.error
  }

  if (insertMezmursError) {
    throw insertMezmursError
  }

  invalidateDataCaches()
  return upcomingId
}

export async function listUpcomingTimiritForAdmin(): Promise<UpcomingTimirtListItem[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('upcoming_timirit')
    .select('id, scheduled_date, topic_preview, note, is_active, publication_status')
    .order('scheduled_date', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    scheduledDate: row.scheduled_date,
    topicPreview: row.topic_preview,
    note: row.note,
    isActive: row.is_active ?? false,
    publicationStatus: row.publication_status === 'published' ? 'published' : 'draft',
  }))
}

export async function listActiveUpcomingTimirit(): Promise<UpcomingTimirtListItem[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('upcoming_timirit')
    .select('id, scheduled_date, topic_preview, note, is_active, publication_status')
    .eq('is_active', true)
    .order('scheduled_date', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    scheduledDate: row.scheduled_date,
    topicPreview: row.topic_preview,
    note: row.note,
    isActive: row.is_active ?? false,
    publicationStatus: row.publication_status === 'published' ? 'published' : 'draft',
  }))
}

export async function setUpcomingTimiritActive(id: string, isActive: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase
    .from('upcoming_timirit')
    .update({
      is_active: isActive,
      publication_status: isActive ? 'published' : 'draft',
    })
    .eq('id', id)

  if (error) {
    throw error
  }

  invalidateDataCaches()
}

export async function deactivateUpcomingTimirt(id?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  let query = supabase
    .from('upcoming_timirit')
    .update({ is_active: false, publication_status: 'draft' })
    .eq('is_active', true)

  if (id) {
    query = query.eq('id', id)
  }

  const { error } = await query
  if (error) {
    throw error
  }

  invalidateDataCaches()
}

export async function deleteUpcomingTimirt(id?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  if (id) {
    const { error } = await supabase
      .from('upcoming_timirit')
      .delete()
      .eq('id', id)
    if (error) {
      throw error
    }
  } else {
    const { data: activeRows, error: selectError } = await supabase
      .from('upcoming_timirit')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    if (selectError) {
      throw selectError
    }

    const activeId = activeRows?.[0]?.id
    if (!activeId) {
      return
    }

    const { error: deleteError } = await supabase
      .from('upcoming_timirit')
      .delete()
      .eq('id', activeId)

    if (deleteError) {
      throw deleteError
    }
  }

  invalidateDataCaches()
}

// ============================================================================
// ADMIN CONTENT MANAGEMENT FUNCTIONS (requires authentication)
// ============================================================================

/**
 * Create a new weekly class
 */
export async function createWeeklyClass(
  data: Omit<WeeklyClass, 'questions' | 'mezmurs' | 'feedbackSummary' | 'attendanceSummary'>
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: result, error } = await supabase
    .from('weekly_classes')
    .insert({
      id: data.id,
      date: data.date,
      topic: data.topic,
      speaker: data.speaker,
      amharic_summary: data.amharicSummary,
      english_summary: data.englishSummary,
      key_points: data.keyPoints,
      verses: data.verses || [],
      youtube_url: data.youtubeUrl || null,
      audio_url: data.audioUrl || null,
      audio_title: data.audioTitle || null,
      audio_note: data.audioNote || null,
      lesson_media_enabled: data.lessonMediaEnabled ?? true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating weekly class:', error)
    throw error
  }

  invalidateDataCaches()
  return result.id
}

/**
 * Update an existing weekly class
 */
export async function updateWeeklyClass(
  id: string,
  data: Partial<Omit<WeeklyClass, 'questions' | 'mezmurs' | 'id'>>
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const updateData: any = {}
  
  if (data.topic !== undefined) updateData.topic = data.topic
  if (data.speaker !== undefined) updateData.speaker = data.speaker
  if (data.amharicSummary !== undefined) updateData.amharic_summary = data.amharicSummary
  if (data.englishSummary !== undefined) updateData.english_summary = data.englishSummary
  if (data.keyPoints !== undefined) updateData.key_points = data.keyPoints
  if (data.verses !== undefined) updateData.verses = data.verses
  if (data.youtubeUrl !== undefined) updateData.youtube_url = data.youtubeUrl
  if (data.audioUrl !== undefined) updateData.audio_url = data.audioUrl
  if (data.audioTitle !== undefined) updateData.audio_title = data.audioTitle
  if (data.audioNote !== undefined) updateData.audio_note = data.audioNote
  if (data.lessonMediaEnabled !== undefined) updateData.lesson_media_enabled = data.lessonMediaEnabled
  if (data.teachingNotes !== undefined) updateData.teaching_notes = data.teachingNotes
  if (data.feedbackSummary !== undefined) updateData.feedback_summary = data.feedbackSummary
  if (data.attendanceSummary !== undefined) updateData.attendance_summary = data.attendanceSummary

  const { error } = await supabase
    .from('weekly_classes')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating weekly class:', error)
    throw error
  }

  invalidateDataCaches()
}

/**
 * Delete a weekly class and all associated data
 */
export async function deleteWeeklyClass(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase
    .from('weekly_classes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting weekly class:', error)
    throw error
  }

  invalidateDataCaches()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transform database row to WeeklyClass type
 */
function transformWeeklyClass(data: any): WeeklyClass {
  // Sort mezmurs by order_index
  const sortedMezmurs = Array.isArray(data.mezmurs)
    ? data.mezmurs
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((m: any) => ({
          title: m.title,
          transliteration: m.transliteration || undefined,
          lyrics: m.lyrics || undefined,
          youtubeUrl: m.youtube_url || undefined,
          audioUrl: m.audio_url || undefined,
        }))
    : []

  // Sort questions by order_index and transform
  const sortedQuestions = Array.isArray(data.questions)
    ? data.questions
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map(transformQuestion)
    : []

  const mezmurs: [Mezmur, Mezmur] = [
    sortedMezmurs[0] ?? { title: 'Mezmur will be added soon' },
    sortedMezmurs[1] ?? { title: 'Second mezmur will be added soon' }
  ]

  return {
    id: data.id,
    date: data.date,
    topic: data.topic,
    speaker: data.speaker,
    amharicSummary: data.amharic_summary,
    englishSummary: data.english_summary,
    keyPoints: Array.isArray(data.key_points) ? data.key_points : [],
    verses: Array.isArray(data.verses) ? data.verses : undefined,
    youtubeUrl: data.youtube_url || undefined,
    audioUrl: data.audio_url || undefined,
    audioTitle: data.audio_title || undefined,
    audioNote: data.audio_note || undefined,
    lessonMediaEnabled: data.lesson_media_enabled ?? true,
    teachingNotes: data.teaching_notes || undefined,
    mezmurs,
    questions: sortedQuestions,
    feedbackSummary: data.feedback_summary || undefined,
    attendanceSummary: data.attendance_summary || undefined
  }
}

/**
 * Transform database question row to Question type
 */
function transformQuestion(data: any): Question {
  const baseQuestion = {
    id: data.id,
    type: data.type as QuestionType,
    prompt: data.prompt,
    helperText: data.helper_text || undefined
  }

  switch (data.type) {
    case 'multiple-choice':
      const sortedOptions = Array.isArray(data.multiple_choice_options)
        ? data.multiple_choice_options
            .sort((a: any, b: any) => a.option_index - b.option_index)
            .map((opt: any) => opt.option_text)
        : []
      
      return {
        ...baseQuestion,
        type: 'multiple-choice',
        options: sortedOptions,
        correctIndex: data.correct_index,
        explanation: data.explanation
      }

    case 'attendance':
      const sortedAttendanceOptions = Array.isArray(data.attendance_options)
        ? data.attendance_options
            .sort((a: any, b: any) => a.option_index - b.option_index)
            .map((opt: any) => ({
              value: opt.value as AttendanceChoice,
              label: opt.label
            }))
        : []
      
      return {
        ...baseQuestion,
        type: 'attendance',
        options: sortedAttendanceOptions
      }

    case 'short-answer':
    case 'reflection':
    case 'feedback-open':
      return {
        ...baseQuestion,
        type: data.type,
        placeholder: data.placeholder || undefined
      } as Question

    default:
      throw new Error(`Unknown question type: ${data.type}`)
  }
}