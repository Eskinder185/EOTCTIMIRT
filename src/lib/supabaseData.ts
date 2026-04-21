/**
 * Supabase data access layer for EOTC Timirit
 * Provides functions to fetch and manage content from the database
 */

import { supabase } from './supabase'
import type { 
  WeeklyClass, 
  UpcomingTimirtPreview, 
  OrganizerSnapshot, 
  AttendanceSlice,
  RecapSuggestion,
  Question,
  Mezmur,
  QuestionType,
  AttendanceChoice
} from '../data/types'

// ============================================================================
// PUBLIC DATA FUNCTIONS (no authentication required)
// ============================================================================

/**
 * Get all weekly classes, ordered by date (newest first)
 */
export async function getWeeklyClasses(): Promise<WeeklyClass[]> {
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
  return classes.map(transformWeeklyClass)
}

/**
 * Get a specific weekly class by ID
 */
export async function getWeeklyClass(id: string): Promise<WeeklyClass | null> {
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

  const { data, error } = await supabase
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
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No active upcoming Timirit
    }
    console.error('Error fetching upcoming Timirit:', error)
    throw error
  }

  // Sort mezmurs by order_index
  const sortedMezmurs = data.upcoming_mezmurs
    .sort((a, b) => a.order_index - b.order_index)
    .map(m => ({
      title: m.title,
      transliteration: m.transliteration || undefined,
      lyrics: m.lyrics || undefined
    }))

  return {
    scheduledDate: data.scheduled_date,
    topicPreview: data.topic_preview,
    note: data.note,
    mezmurs: [sortedMezmurs[0], sortedMezmurs[1]] as [Mezmur, Mezmur]
  }
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
          ? weekData.top_unclear_topics.filter(topic => topic && typeof topic === 'string')
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

// ============================================================================
// ADMIN CONTENT MANAGEMENT FUNCTIONS (requires authentication)
// ============================================================================

/**
 * Create a new weekly class
 */
export async function createWeeklyClass(
  data: Omit<WeeklyClass, 'questions' | 'mezmurs' | 'feedbackSummary' | 'attendanceSummary'>
): Promise<string> {
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

  return result.id
}

/**
 * Update an existing weekly class
 */
export async function updateWeeklyClass(
  id: string,
  data: Partial<Omit<WeeklyClass, 'questions' | 'mezmurs' | 'id'>>
): Promise<void> {
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
}

/**
 * Delete a weekly class and all associated data
 */
export async function deleteWeeklyClass(id: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_classes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting weekly class:', error)
    throw error
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transform database row to WeeklyClass type
 */
function transformWeeklyClass(data: any): WeeklyClass {
  // Sort mezmurs by order_index
  const sortedMezmurs = data.mezmurs
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((m: any) => ({
      title: m.title,
      transliteration: m.transliteration || undefined,
      lyrics: m.lyrics || undefined,
      youtubeUrl: m.youtube_url || undefined
    }))

  // Sort questions by order_index and transform
  const sortedQuestions = data.questions
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map(transformQuestion)

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
    mezmurs: [sortedMezmurs[0], sortedMezmurs[1]] as [Mezmur, Mezmur],
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
      const sortedOptions = data.multiple_choice_options
        .sort((a: any, b: any) => a.option_index - b.option_index)
        .map((opt: any) => opt.option_text)
      
      return {
        ...baseQuestion,
        type: 'multiple-choice',
        options: sortedOptions,
        correctIndex: data.correct_index,
        explanation: data.explanation
      }

    case 'attendance':
      const sortedAttendanceOptions = data.attendance_options
        .sort((a: any, b: any) => a.option_index - b.option_index)
        .map((opt: any) => ({
          value: opt.value as AttendanceChoice,
          label: opt.label
        }))
      
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