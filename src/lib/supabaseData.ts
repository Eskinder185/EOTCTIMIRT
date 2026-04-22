/**
 * Supabase data access layer for EOTC Timirit
 * Provides functions to fetch and manage content from the database
 */

import { supabase } from './supabase'
import type { 
  WeeklyClass, 
  OrganizerSnapshot, 
  AttendanceSlice,
  RecapSuggestion,
  Question,
  Mezmur,
  QuestionType,
  AttendanceChoice,
  WeeklyQuestionStatsReport,
  WeeklyQuestionStat,
} from '../data/types'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'

const CACHE_DURATION_MS = 60 * 1000
let weeklyClassesCache: WeeklyClass[] | null = null
let weeklyClassesCacheTimestamp = 0
let upcomingTimiritAdminCache: UpcomingTimirtEditorInput | null | undefined
let upcomingTimiritAdminCacheTimestamp = 0

function isFresh(timestamp: number) {
  return Date.now() - timestamp < CACHE_DURATION_MS
}

function invalidateDataCaches() {
  weeklyClassesCache = null
  weeklyClassesCacheTimestamp = 0
  upcomingTimiritAdminCache = undefined
  upcomingTimiritAdminCacheTimestamp = 0
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
  transliteration?: string
  lyrics?: string
  youtubeUrl?: string
}

export interface EditorQuestionInput {
  id?: string
  type: QuestionType
  prompt: string
  helperText?: string
  placeholder?: string
  correctIndex?: number
  explanation?: string
  options?: string[]
  attendanceOptions?: Array<{
    value: AttendanceChoice
    label: string
  }>
}

export interface WeeklyClassEditorInput {
  id: string
  date: string
  topic: string
  speaker: string
  amharicSummary: string
  englishSummary: string
  keyPoints: string[]
  verses: string[]
  youtubeUrl?: string
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
  questions: EditorQuestionInput[]
  feedbackSummary?: string
  attendanceSummary?: string
}

export interface UpcomingTimirtEditorInput {
  id?: string
  scheduledDate: string
  topicPreview: string
  note: string
  isActive: boolean
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
}

export interface UpcomingTimirtListItem {
  id: string
  scheduledDate: string
  topicPreview: string
  note: string
  isActive: boolean
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
        transliteration,
        lyrics,
        youtube_url,
        order_index
      ),
      questions (
        id,
        type,
        prompt,
        helper_text,
        placeholder,
        correct_index,
        explanation,
        order_index,
        multiple_choice_options (
          option_text,
          option_index
        ),
        attendance_options (
          value,
          label,
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
        transliteration,
        lyrics,
        youtube_url,
        order_index
      ),
      questions (
        id,
        type,
        prompt,
        helper_text,
        placeholder,
        correct_index,
        explanation,
        order_index,
        multiple_choice_options (
          option_text,
          option_index
        ),
        attendance_options (
          value,
          label,
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
    }))

  return {
    scheduledDate: data.scheduled_date,
    topicPreview: data.topic_preview,
    note: data.note,
    mezmurs: [sortedMezmurs[0], sortedMezmurs[1]] as [Mezmur, Mezmur]
  }
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
      type,
      correct_index,
      multiple_choice_options (
        option_text,
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
    const correctOptionText =
      options.find((option) => option.option_index === correctOptionIndex)?.option_text ?? 'Correct answer'

    return {
      questionId: question.id,
      prompt: question.prompt,
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
          optionText: option.option_text,
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
        }))
    : []

  const result: UpcomingTimirtEditorInput = {
    id: row.id,
    scheduledDate: row.scheduled_date,
    topicPreview: row.topic_preview,
    note: row.note,
    isActive: row.is_active ?? true,
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
      is_active: data.isActive,
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
    .select('id, scheduled_date, topic_preview, note, is_active')
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
  }))
}

export async function listActiveUpcomingTimirit(): Promise<UpcomingTimirtListItem[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('upcoming_timirit')
    .select('id, scheduled_date, topic_preview, note, is_active')
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
  }))
}

export async function setUpcomingTimiritActive(id: string, isActive: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase
    .from('upcoming_timirit')
    .update({ is_active: isActive })
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
    .update({ is_active: false })
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
      youtube_url: data.youtubeUrl || null
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
          youtubeUrl: m.youtube_url || undefined
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