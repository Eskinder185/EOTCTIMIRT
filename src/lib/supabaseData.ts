/**
 * Supabase data access layer for EOTC Timirit
 * Provides functions to fetch and manage content from the database
 */

import { supabase } from './supabase'
import { pickLocalized } from './bilingualText'
import type { Database } from './database.types'
import { formatUnknownError } from './formatError'
import { legacySingleLineFromLocalized, normalizeLocalizedText } from './localizedText'
import { sanitizeOptionalHttpUrl } from './optionalUrl'
import { parseOptionalUuid } from './uuid'
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

const WEEKLY_CLASS_RELATION_SELECT = `
  *,
  mezmurs (*),
  questions (
    *,
    multiple_choice_options (*),
    attendance_options (*)
  )
`
const WEEKLY_CLASS_MINIMAL_SELECT_WITH_STATUS = 'id, date, topic, speaker, amharic_summary, english_summary, status'
const WEEKLY_CLASS_MINIMAL_SELECT = 'id, date, topic, speaker, amharic_summary, english_summary'
const WEEKLY_CLASS_EXPANDED_SCALAR_SELECT = [
  'id',
  'date',
  'topic',
  'topic_en',
  'topic_am',
  'speaker',
  'amharic_summary',
  'english_summary',
  'key_points',
  'verses',
  'youtube_url',
  'audio_url',
  'audio_title',
  'audio_title_en',
  'audio_title_am',
  'audio_note',
  'audio_note_en',
  'audio_note_am',
  'lesson_media_enabled',
  'teaching_notes',
  'teaching_notes_en',
  'teaching_notes_am',
  'feedback_summary',
  'attendance_summary',
].join(', ')
const WEEKLY_CLASSES_HEALTH_DEBUG =
  import.meta.env.DEV || String(import.meta.env.VITE_DEBUG_WEEKLY_CLASSES_FETCH ?? '').toLowerCase() === 'true'
const ADMIN_WRITE_DEBUG =
  import.meta.env.DEV || String(import.meta.env.VITE_DEBUG_ADMIN_WRITES ?? '').toLowerCase() === 'true'

type WeeklyClassRow = Database['public']['Tables']['weekly_classes']['Row']
type MezmurRow = Database['public']['Tables']['mezmurs']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']
type MultipleChoiceOptionRow = Database['public']['Tables']['multiple_choice_options']['Row']
type AttendanceOptionRow = Database['public']['Tables']['attendance_options']['Row']

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

function logSupabaseError(context: string, error: unknown, query?: string) {
  const details = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null
  console.error(`[Supabase] ${context}`, {
    message: typeof details?.message === 'string' ? details.message : undefined,
    details: typeof details?.details === 'string' ? details.details : undefined,
    hint: typeof details?.hint === 'string' ? details.hint : undefined,
    code: typeof details?.code === 'string' ? details.code : undefined,
    query,
    error,
  })
}

function logWeeklyClassesHealth(stage: string, payload?: Record<string, unknown>) {
  if (!WEEKLY_CLASSES_HEALTH_DEBUG) return
  console.info('[weekly_classes_fetch_health]', { stage, ...payload })
}

function logAdminWrite(action: string, stage: string, payload?: Record<string, unknown>) {
  if (!ADMIN_WRITE_DEBUG) return
  console.info('[admin_write]', { action, stage, ...payload })
}

function logAdminWriteError(action: string, stage: string, error: unknown, query?: string) {
  logSupabaseError(`${action}:${stage}`, error, query)
  logAdminWrite(action, `${stage}_error`, {
    error_message: formatUnknownError(error),
  })
}

type WeeklyClassHydratedRow = WeeklyClassRow & {
  mezmurs?: MezmurRow[]
  questions?: Array<QuestionRow & {
    multiple_choice_options?: MultipleChoiceOptionRow[]
    attendance_options?: AttendanceOptionRow[]
  }>
}

async function fetchWeeklyClassRowsWithFallback(): Promise<WeeklyClassHydratedRow[]> {
  if (!supabase) return []

  const full = await supabase
    .from('weekly_classes')
    .select(WEEKLY_CLASS_RELATION_SELECT)
    .order('date', { ascending: false })

  if (!full.error && full.data) {
    logWeeklyClassesHealth('full_embedded_query_success', { rows: full.data.length })
    return full.data as WeeklyClassHydratedRow[]
  }

  logSupabaseError('weekly_classes full relation select failed', full.error, WEEKLY_CLASS_RELATION_SELECT)

  const minimalWithStatus = await supabase
    .from('weekly_classes')
    .select(WEEKLY_CLASS_MINIMAL_SELECT_WITH_STATUS)
    .order('date', { ascending: false })

  if (minimalWithStatus.error) {
    logSupabaseError(
      'weekly_classes minimal select (with status) failed',
      minimalWithStatus.error,
      WEEKLY_CLASS_MINIMAL_SELECT_WITH_STATUS,
    )
  } else {
    logWeeklyClassesHealth('minimal_query_with_status_success', { rows: minimalWithStatus.data?.length ?? 0 })
  }

  const expandedScalar = await supabase
    .from('weekly_classes')
    .select(WEEKLY_CLASS_EXPANDED_SCALAR_SELECT)
    .order('date', { ascending: false })

  let rows: WeeklyClassRow[] = []
  if (expandedScalar.error) {
    logSupabaseError(
      'weekly_classes expanded scalar select failed; falling back to strict minimal fields',
      expandedScalar.error,
      WEEKLY_CLASS_EXPANDED_SCALAR_SELECT,
    )

    const minimal = await supabase
      .from('weekly_classes')
      .select(WEEKLY_CLASS_MINIMAL_SELECT)
      .order('date', { ascending: false })

    if (minimal.error) {
      logSupabaseError('weekly_classes minimal select failed', minimal.error, WEEKLY_CLASS_MINIMAL_SELECT)
      throw minimal.error
    }
    logWeeklyClassesHealth('strict_minimal_scalar_query_success', { rows: minimal.data?.length ?? 0 })
    rows = (minimal.data ?? []) as unknown as WeeklyClassRow[]
  } else {
    logWeeklyClassesHealth('expanded_scalar_query_success', { rows: expandedScalar.data?.length ?? 0 })
    rows = (expandedScalar.data ?? []) as unknown as WeeklyClassRow[]
  }

  return hydrateWeeklyClassRelations(rows)
}

async function fetchWeeklyClassRowByIdWithFallback(id: string): Promise<WeeklyClassHydratedRow | null> {
  if (!supabase) return null

  const full = await supabase
    .from('weekly_classes')
    .select(WEEKLY_CLASS_RELATION_SELECT)
    .eq('id', id)
    .single()

  if (!full.error && full.data) {
    logWeeklyClassesHealth('full_embedded_query_success_single', { id })
    return full.data as WeeklyClassHydratedRow
  }
  if (full.error?.code === 'PGRST116') {
    return null
  }

  logSupabaseError(`weekly_class ${id} full relation select failed`, full.error, WEEKLY_CLASS_RELATION_SELECT)

  const minimalWithStatus = await supabase
    .from('weekly_classes')
    .select(WEEKLY_CLASS_MINIMAL_SELECT_WITH_STATUS)
    .eq('id', id)
    .single()

  if (minimalWithStatus.error) {
    if (minimalWithStatus.error.code === 'PGRST116') return null
    logSupabaseError(
      `weekly_class ${id} minimal select (with status) failed`,
      minimalWithStatus.error,
      WEEKLY_CLASS_MINIMAL_SELECT_WITH_STATUS,
    )
  } else {
    logWeeklyClassesHealth('minimal_query_with_status_success_single', { id })
  }

  const expandedScalar = await supabase
    .from('weekly_classes')
    .select(WEEKLY_CLASS_EXPANDED_SCALAR_SELECT)
    .eq('id', id)
    .single()

  let baseRow: WeeklyClassRow
  if (expandedScalar.error) {
    if (expandedScalar.error.code === 'PGRST116') return null
    logSupabaseError(
      `weekly_class ${id} expanded scalar select failed; falling back to strict minimal fields`,
      expandedScalar.error,
      WEEKLY_CLASS_EXPANDED_SCALAR_SELECT,
    )

    const minimal = await supabase
      .from('weekly_classes')
      .select(WEEKLY_CLASS_MINIMAL_SELECT)
      .eq('id', id)
      .single()

    if (minimal.error) {
      if (minimal.error.code === 'PGRST116') return null
      logSupabaseError(`weekly_class ${id} minimal select failed`, minimal.error, WEEKLY_CLASS_MINIMAL_SELECT)
      throw minimal.error
    }
    logWeeklyClassesHealth('strict_minimal_scalar_query_success_single', { id })
    baseRow = minimal.data as unknown as WeeklyClassRow
  } else {
    logWeeklyClassesHealth('expanded_scalar_query_success_single', { id })
    baseRow = expandedScalar.data as unknown as WeeklyClassRow
  }

  const hydrated = await hydrateWeeklyClassRelations([baseRow])
  return hydrated[0] ?? null
}

async function hydrateWeeklyClassRelations(rows: WeeklyClassRow[]): Promise<WeeklyClassHydratedRow[]> {
  if (!supabase || rows.length === 0) {
    if (rows.length === 0) {
      logWeeklyClassesHealth('separate_relation_fetches_skipped_empty_rows')
    }
    return rows as WeeklyClassHydratedRow[]
  }

  const classIds = rows.map((row) => row.id)
  const baseById = new Map<string, WeeklyClassHydratedRow>(
    rows.map((row) => [row.id, { ...row, mezmurs: [], questions: [] }]),
  )

  const mezmursResult = await supabase
    .from('mezmurs')
    .select('*')
    .in('weekly_class_id', classIds)
    .order('order_index', { ascending: true })

  if (mezmursResult.error) {
    logSupabaseError('Failed to fetch weekly_classes->mezmurs relation', mezmursResult.error, 'mezmurs(*)')
  } else {
    for (const mezmur of mezmursResult.data as MezmurRow[]) {
      const target = baseById.get(mezmur.weekly_class_id)
      if (target?.mezmurs) target.mezmurs.push(mezmur)
    }
  }

  const questionsResult = await supabase
    .from('questions')
    .select('*')
    .in('weekly_class_id', classIds)
    .order('order_index', { ascending: true })

  const questionIds: string[] = []
  if (questionsResult.error) {
    logSupabaseError('Failed to fetch weekly_classes->questions relation', questionsResult.error, 'questions(*)')
  } else {
    for (const question of questionsResult.data as QuestionRow[]) {
      questionIds.push(question.id)
      const target = baseById.get(question.weekly_class_id)
      if (target?.questions) {
        target.questions.push({
          ...question,
          multiple_choice_options: [],
          attendance_options: [],
        })
      }
    }
  }

  if (questionIds.length > 0) {
    const optionsResult = await supabase
      .from('multiple_choice_options')
      .select('*')
      .in('question_id', questionIds)
      .order('option_index', { ascending: true })

    if (optionsResult.error) {
      logSupabaseError(
        'Failed to fetch questions->multiple_choice_options relation',
        optionsResult.error,
        'multiple_choice_options(*)',
      )
    } else {
      const optionMap = new Map<string, MultipleChoiceOptionRow[]>()
      for (const option of optionsResult.data as MultipleChoiceOptionRow[]) {
        const current = optionMap.get(option.question_id)
        if (current) current.push(option)
        else optionMap.set(option.question_id, [option])
      }
      for (const weeklyClass of baseById.values()) {
        for (const question of weeklyClass.questions ?? []) {
          question.multiple_choice_options = optionMap.get(question.id) ?? []
        }
      }
    }

    const attendanceResult = await supabase
      .from('attendance_options')
      .select('*')
      .in('question_id', questionIds)
      .order('option_index', { ascending: true })

    if (attendanceResult.error) {
      logSupabaseError(
        'Failed to fetch questions->attendance_options relation',
        attendanceResult.error,
        'attendance_options(*)',
      )
    } else {
      const attendanceMap = new Map<string, AttendanceOptionRow[]>()
      for (const option of attendanceResult.data as AttendanceOptionRow[]) {
        const current = attendanceMap.get(option.question_id)
        if (current) current.push(option)
        else attendanceMap.set(option.question_id, [option])
      }
      for (const weeklyClass of baseById.values()) {
        for (const question of weeklyClass.questions ?? []) {
          question.attendance_options = attendanceMap.get(question.id) ?? []
        }
      }
    }
  } else {
    logWeeklyClassesHealth('separate_relation_fetches_no_questions', { classCount: rows.length })
  }

  logWeeklyClassesHealth('separate_relation_fetches_complete', {
    classCount: rows.length,
    questionCount: questionIds.length,
    mezmursFetched: mezmursResult.error ? 0 : mezmursResult.data?.length ?? 0,
    questionsFetched: questionsResult.error ? 0 : questionsResult.data?.length ?? 0,
  })

  return rows.map((row) => baseById.get(row.id) ?? ({ ...row } as WeeklyClassHydratedRow))
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

  const classes = await fetchWeeklyClassRowsWithFallback()

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

  const classData = await fetchWeeklyClassRowByIdWithFallback(id)
  if (!classData) {
    return null
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

  const titleEn = trimOrNull(input.titleEn) ?? trimOrNull(input.title)
  const titleAm = trimOrNull(input.titleAm)
  const subtitleEn = trimOrNull(input.subtitleEn) ?? trimOrNull(input.subtitle)
  const subtitleAm = trimOrNull(input.subtitleAm)
  const contentEn = trimOrNull(input.contentEn) ?? trimOrNull(input.content)
  const contentAm = trimOrNull(input.contentAm)
  const extraNoteEn = trimOrNull(input.extraNoteEn) ?? trimOrNull(input.extraNote)
  const extraNoteAm = trimOrNull(input.extraNoteAm)
  const buttonTextEn = trimOrNull(input.buttonTextEn) ?? trimOrNull(input.buttonText)
  const buttonTextAm = trimOrNull(input.buttonTextAm)
  const normalizedRow = {
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
    image_url: sanitizeOptionalHttpUrl(input.imageUrl),
    button_text: buttonTextEn,
    button_text_en: buttonTextEn,
    button_text_am: buttonTextAm,
    button_link: sanitizeOptionalHttpUrl(input.buttonLink),
    content_type: input.contentType,
    status: normalizedStatus,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    is_active: normalizedIsActive,
  }
  logAdminWrite('saveWeeklyKnowledgeEditor', 'payload_received', { payload: structuredClone(input) })
  logAdminWrite('saveWeeklyKnowledgeEditor', 'payload_normalized', { normalizedRow: structuredClone(normalizedRow) })

  const { data, error } = await supabase
    .from('weekly_knowledge')
    .upsert(normalizedRow)
    .select('id')
    .single()
  logAdminWrite('saveWeeklyKnowledgeEditor', 'supabase_response', {
    returnedId: data?.id ?? null,
    hasError: Boolean(error),
  })

  if (error) {
    logAdminWriteError('saveWeeklyKnowledgeEditor', 'weekly_knowledge_upsert', error)
    throw error
  }

  if (normalizedStatus === 'published' && normalizedIsActive) {
    const { error: deactivateOthersError } = await supabase
      .from('weekly_knowledge')
      .update({ is_active: false })
      .neq('id', data.id)
      .eq('is_active', true)
    if (deactivateOthersError) {
      logAdminWriteError('saveWeeklyKnowledgeEditor', 'deactivate_other_active_rows', deactivateOthersError)
      throw deactivateOthersError
    }
    logAdminWrite('saveWeeklyKnowledgeEditor', 'deactivate_other_active_rows_success', {})
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

  logAdminWrite('setWeeklyKnowledgeStatus', 'payload_received', { id, status, isActive })
  if (status === 'published' && isActive) {
    const { error: deactivateError } = await supabase
      .from('weekly_knowledge')
      .update({ is_active: false })
      .neq('id', id)
      .eq('is_active', true)
    if (deactivateError) {
      logAdminWriteError('setWeeklyKnowledgeStatus', 'deactivate_other_active_rows', deactivateError)
      throw deactivateError
    }
    logAdminWrite('setWeeklyKnowledgeStatus', 'deactivate_other_active_rows_success', {})
  }

  const { error } = await supabase
    .from('weekly_knowledge')
    .update({
      status,
      is_active: status === 'published' ? isActive : false,
    })
    .eq('id', id)

  if (error) {
    logAdminWriteError('setWeeklyKnowledgeStatus', 'status_update', error)
    throw error
  }
  logAdminWrite('setWeeklyKnowledgeStatus', 'status_update_success', { id, status, isActive })

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

function trimOrNull(value: string | undefined | null): string | null {
  const t = value?.trim()
  return t ? t : null
}

type NormalizedEditorQuestion = EditorQuestionInput & { id: string; orderIndex: number }

function buildQuestionUpsertRow(question: NormalizedEditorQuestion, weeklyClassId: string) {
  const promptEn = trimOrNull(question.promptEn)
  const promptAm = trimOrNull(question.promptAm)
  const promptLegacy = trimOrNull(question.prompt) || promptEn || promptAm || null

  const helperEn = trimOrNull(question.helperTextEn)
  const helperAm = trimOrNull(question.helperTextAm)
  const helperLegacy = trimOrNull(question.helperText) || helperEn || helperAm || null

  const placeholderEn = trimOrNull(question.placeholderEn)
  const placeholderAm = trimOrNull(question.placeholderAm)
  const placeholderLegacy =
    question.type !== 'multiple-choice' && question.type !== 'attendance'
      ? trimOrNull(question.placeholder) || placeholderEn || placeholderAm || null
      : null

  const explanationEn = question.type === 'multiple-choice' ? trimOrNull(question.explanationEn) : null
  const explanationAm = question.type === 'multiple-choice' ? trimOrNull(question.explanationAm) : null
  const explanationLegacy =
    question.type === 'multiple-choice'
      ? trimOrNull(question.explanation) || explanationEn || explanationAm || null
      : null

  return {
    id: question.id,
    weekly_class_id: weeklyClassId,
    type: question.type,
    prompt: promptLegacy,
    prompt_en: promptEn,
    prompt_am: promptAm,
    helper_text: helperLegacy,
    helper_text_en: helperEn,
    helper_text_am: helperAm,
    placeholder: placeholderLegacy,
    placeholder_en: placeholderEn,
    placeholder_am: placeholderAm,
    correct_index: question.type === 'multiple-choice' ? (question.correctIndex ?? 0) : null,
    explanation: explanationLegacy,
    explanation_en: explanationEn,
    explanation_am: explanationAm,
    order_index: question.orderIndex,
  }
}

export async function saveWeeklyClassEditor(data: WeeklyClassEditorInput): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const normalizedId = data.id.trim() || data.date
  const normalizedQuestions: NormalizedEditorQuestion[] = data.questions.map((question, index) => ({
    ...question,
    id: question.id?.trim() || `${normalizedId}-q-${crypto.randomUUID()}`,
    orderIndex: index,
  }))

  const englishSummary = data.englishSummary?.trim() || ''
  const amharicSummary = data.amharicSummary?.trim() || ''
  const classRow = {
    id: normalizedId,
    date: data.date,
    topic: trimOrNull(data.topic) || trimOrNull(data.topicEn) || trimOrNull(data.topicAm) || null,
    topic_en: trimOrNull(data.topicEn),
    topic_am: trimOrNull(data.topicAm),
    speaker: data.speaker?.trim() || ' ',
    amharic_summary: amharicSummary || englishSummary || ' ',
    english_summary: englishSummary || amharicSummary || ' ',
    key_points: Array.isArray(data.keyPoints) ? data.keyPoints.map((p) => p.trim()).filter(Boolean) : [],
    verses: Array.isArray(data.verses) ? data.verses.map((v) => v.trim()).filter(Boolean) : [],
    youtube_url: sanitizeOptionalHttpUrl(data.youtubeUrl),
    audio_url: sanitizeOptionalHttpUrl(data.audioUrl),
    audio_title: trimOrNull(data.audioTitle),
    audio_title_en: trimOrNull(data.audioTitleEn),
    audio_title_am: trimOrNull(data.audioTitleAm),
    audio_note: trimOrNull(data.audioNote),
    audio_note_en: trimOrNull(data.audioNoteEn),
    audio_note_am: trimOrNull(data.audioNoteAm),
    lesson_media_enabled: data.lessonMediaEnabled ?? true,
    teaching_notes: trimOrNull(data.teachingNotes),
    teaching_notes_en: trimOrNull(data.teachingNotesEn),
    teaching_notes_am: trimOrNull(data.teachingNotesAm),
  }
  logAdminWrite('saveWeeklyClassEditor', 'payload_received', { payload: structuredClone(data) })
  logAdminWrite('saveWeeklyClassEditor', 'payload_normalized', {
    classRow: structuredClone(classRow),
    questionCount: normalizedQuestions.length,
  })

  if (import.meta.env.DEV) {
    console.info('[saveWeeklyClassEditor] weekly_classes upsert', structuredClone(classRow))
    console.info('[saveWeeklyClassEditor] questions', structuredClone(normalizedQuestions))
  }

  const existingQuestions = await supabase
    .from('questions')
    .select('id')
    .eq('weekly_class_id', normalizedId)

  if (existingQuestions.error) {
    logAdminWriteError('saveWeeklyClassEditor', 'existing_questions_select', existingQuestions.error)
    throw new Error(formatUnknownError(existingQuestions.error))
  }

  const keptQuestionIds = new Set(normalizedQuestions.map((question) => question.id))
  const removedQuestionIds = (existingQuestions.data ?? [])
    .map((question) => question.id)
    .filter((questionId) => !keptQuestionIds.has(questionId))

  const { error: classError } = await supabase.from('weekly_classes').upsert(classRow)
  logAdminWrite('saveWeeklyClassEditor', 'weekly_classes_upsert_response', { hasError: Boolean(classError) })

  if (classError) {
    logAdminWriteError('saveWeeklyClassEditor', 'weekly_classes_upsert', classError)
    throw new Error(formatUnknownError(classError))
  }

  const { error: deleteMezmursError } = await supabase
    .from('mezmurs')
    .delete()
    .eq('weekly_class_id', normalizedId)

  if (deleteMezmursError) {
    logAdminWriteError('saveWeeklyClassEditor', 'mezmurs_delete_existing', deleteMezmursError)
    throw new Error(formatUnknownError(deleteMezmursError))
  }

  const mezmurRows = data.mezmurs.map((mezmur, index) => ({
    weekly_class_id: normalizedId,
    title:
      mezmur.title?.trim() ||
      mezmur.titleEn?.trim() ||
      mezmur.titleAm?.trim() ||
      'Untitled mezmur',
    title_en: trimOrNull(mezmur.titleEn),
    title_am: trimOrNull(mezmur.titleAm),
    transliteration: trimOrNull(mezmur.transliteration),
    lyrics: trimOrNull(mezmur.lyrics),
    lyrics_en: trimOrNull(mezmur.lyricsEn),
    lyrics_am: trimOrNull(mezmur.lyricsAm),
    note_en: trimOrNull(mezmur.noteEn),
    note_am: trimOrNull(mezmur.noteAm),
    youtube_url: sanitizeOptionalHttpUrl(mezmur.youtubeUrl),
    audio_url: sanitizeOptionalHttpUrl(mezmur.audioUrl),
    order_index: index,
  }))

  if (import.meta.env.DEV) {
    console.info('[saveWeeklyClassEditor] mezmurs insert', structuredClone(mezmurRows))
  }

  const { error: mezmursError } = await supabase.from('mezmurs').insert(mezmurRows)
  logAdminWrite('saveWeeklyClassEditor', 'mezmurs_insert_response', {
    rowCount: mezmurRows.length,
    hasError: Boolean(mezmursError),
  })

  if (mezmursError) {
    logAdminWriteError('saveWeeklyClassEditor', 'mezmurs_insert', mezmursError)
    throw new Error(formatUnknownError(mezmursError))
  }

  const questionRows = normalizedQuestions.map((question) => buildQuestionUpsertRow(question, normalizedId))
  logAdminWrite('saveWeeklyClassEditor', 'questions_payload_normalized', {
    questionRows: structuredClone(questionRows),
  })

  const { error: questionsError } = await supabase.from('questions').upsert(questionRows)
  logAdminWrite('saveWeeklyClassEditor', 'questions_upsert_response', {
    rowCount: questionRows.length,
    hasError: Boolean(questionsError),
  })

  if (questionsError) {
    logAdminWriteError('saveWeeklyClassEditor', 'questions_upsert', questionsError)
    throw new Error(formatUnknownError(questionsError))
  }

  for (const question of normalizedQuestions) {
    const questionId = question.id as string

    const { error: deleteChoiceError } = await supabase
      .from('multiple_choice_options')
      .delete()
      .eq('question_id', questionId)

    if (deleteChoiceError) {
      logAdminWriteError('saveWeeklyClassEditor', `delete_mc_options_${questionId}`, deleteChoiceError)
      throw new Error(formatUnknownError(deleteChoiceError))
    }

    const { error: deleteAttendanceError } = await supabase
      .from('attendance_options')
      .delete()
      .eq('question_id', questionId)

    if (deleteAttendanceError) {
      logAdminWriteError('saveWeeklyClassEditor', `delete_attendance_options_${questionId}`, deleteAttendanceError)
      throw new Error(formatUnknownError(deleteAttendanceError))
    }

    if (question.type === 'multiple-choice' && question.options && question.options.length > 0) {
      const { error: choiceError } = await supabase
        .from('multiple_choice_options')
        .insert(
          question.options.map((option, optionIndex) => {
            const n = normalizeLocalizedText(option)
            return {
              question_id: questionId,
              option_text_en: n.en ?? null,
              option_text_am: n.am ?? null,
              option_text: legacySingleLineFromLocalized(n),
              option_index: optionIndex,
            }
          }),
        )

      if (choiceError) {
        logAdminWriteError('saveWeeklyClassEditor', `insert_mc_options_${questionId}`, choiceError)
        throw new Error(formatUnknownError(choiceError))
      }
      logAdminWrite('saveWeeklyClassEditor', 'insert_mc_options_success', {
        questionId,
        optionCount: question.options.length,
      })
    }

    if (question.type === 'attendance') {
      const attendanceOptions = question.attendanceOptions ?? [
        { value: 'in-person' as const, label: 'In person' },
        { value: 'online' as const, label: 'Online' },
        { value: 'maybe' as const, label: 'Maybe' },
        { value: 'cannot-attend' as const, label: 'Cannot attend' },
      ]

      const { error: attendanceError } = await supabase
        .from('attendance_options')
        .insert(
          attendanceOptions.map((option, optionIndex) => ({
            question_id: questionId,
            value: option.value,
            label: trimOrNull(option.label),
            label_en: trimOrNull(option.labelEn) || trimOrNull(option.label),
            label_am: trimOrNull(option.labelAm),
            option_index: optionIndex,
          })),
        )

      if (attendanceError) {
        logAdminWriteError('saveWeeklyClassEditor', `insert_attendance_options_${questionId}`, attendanceError)
        throw new Error(formatUnknownError(attendanceError))
      }
      logAdminWrite('saveWeeklyClassEditor', 'insert_attendance_options_success', {
        questionId,
        optionCount: attendanceOptions.length,
      })
    }
  }

  if (removedQuestionIds.length > 0) {
    const { error: removeQuestionsError } = await supabase
      .from('questions')
      .delete()
      .in('id', removedQuestionIds)

    if (removeQuestionsError) {
      logAdminWriteError('saveWeeklyClassEditor', 'remove_deleted_questions', removeQuestionsError)
      throw new Error(formatUnknownError(removeQuestionsError))
    }
    logAdminWrite('saveWeeklyClassEditor', 'remove_deleted_questions_success', {
      removedCount: removedQuestionIds.length,
    })
  }
  logAdminWrite('saveWeeklyClassEditor', 'save_success', { weeklyClassId: normalizedId })

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
          title_en,
          title_am,
          transliteration,
          lyrics,
          lyrics_en,
          lyrics_am,
          note_en,
          note_am,
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
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((mezmur: {
          title: string
          title_en?: string | null
          title_am?: string | null
          transliteration?: string | null
          lyrics?: string | null
          lyrics_en?: string | null
          lyrics_am?: string | null
          note_en?: string | null
          note_am?: string | null
          youtube_url?: string | null
          audio_url?: string | null
        }) => ({
          title: mezmur.title,
          titleEn: mezmur.title_en || undefined,
          titleAm: mezmur.title_am || undefined,
          transliteration: mezmur.transliteration || undefined,
          lyrics: mezmur.lyrics || undefined,
          lyricsEn: mezmur.lyrics_en || undefined,
          lyricsAm: mezmur.lyrics_am || undefined,
          noteEn: mezmur.note_en || undefined,
          noteAm: mezmur.note_am || undefined,
          youtubeUrl: mezmur.youtube_url || undefined,
          audioUrl: mezmur.audio_url || undefined,
        }))
    : []

  const result: UpcomingTimirtEditorInput = {
    id: row.id,
    scheduledDate: row.scheduled_date,
    topicPreview: row.topic_preview ?? '',
    topicPreviewEn: row.topic_preview_en || undefined,
    topicPreviewAm: row.topic_preview_am || undefined,
    note: row.note ?? '',
    noteEn: row.note_en || undefined,
    noteAm: row.note_am || undefined,
    lessonYoutubeUrl: row.lesson_youtube_url || undefined,
    lessonAudioUrl: row.lesson_audio_url || undefined,
    lessonAudioTitle: row.lesson_audio_title || undefined,
    lessonAudioTitleEn: row.lesson_audio_title_en || undefined,
    lessonAudioTitleAm: row.lesson_audio_title_am || undefined,
    lessonNote: row.lesson_note || undefined,
    lessonNoteEn: row.lesson_note_en || undefined,
    lessonNoteAm: row.lesson_note_am || undefined,
    weeklyKnowledgeContent: row.weekly_knowledge_content || undefined,
    weeklyKnowledgeContentEn: row.weekly_knowledge_content_en || undefined,
    weeklyKnowledgeContentAm: row.weekly_knowledge_content_am || undefined,
    weeklyKnowledgeImageUrl: row.weekly_knowledge_image_url || undefined,
    keyVerse: row.key_verse || undefined,
    keyVerseEn: row.key_verse_en || undefined,
    keyVerseAm: row.key_verse_am || undefined,
    organizerNote: row.organizer_note || undefined,
    organizerNoteEn: row.organizer_note_en || undefined,
    organizerNoteAm: row.organizer_note_am || undefined,
    classSummaryContent: row.class_summary_content || undefined,
    classSummaryContentEn: row.class_summary_content_en || undefined,
    classSummaryContentAm: row.class_summary_content_am || undefined,
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

type UpcomingTimiritInsert = Database['public']['Tables']['upcoming_timirit']['Insert']
type UpcomingMezmurInsert = Database['public']['Tables']['upcoming_mezmurs']['Insert']

function buildUpcomingTimiritInsertRow(data: UpcomingTimirtEditorInput): UpcomingTimiritInsert {
  const id = parseOptionalUuid(data.id)
  const row: UpcomingTimiritInsert = {
    scheduled_date: data.scheduledDate,
    topic_preview: data.topicPreview?.trim() || null,
    topic_preview_en: data.topicPreviewEn?.trim() || null,
    topic_preview_am: data.topicPreviewAm?.trim() || null,
    note: data.note?.trim() || null,
    note_en: data.noteEn?.trim() || null,
    note_am: data.noteAm?.trim() || null,
    lesson_youtube_url: sanitizeOptionalHttpUrl(data.lessonYoutubeUrl),
    lesson_audio_url: sanitizeOptionalHttpUrl(data.lessonAudioUrl),
    lesson_audio_title: data.lessonAudioTitle?.trim() || null,
    lesson_audio_title_en: data.lessonAudioTitleEn?.trim() || null,
    lesson_audio_title_am: data.lessonAudioTitleAm?.trim() || null,
    lesson_note: data.lessonNote?.trim() || null,
    lesson_note_en: data.lessonNoteEn?.trim() || null,
    lesson_note_am: data.lessonNoteAm?.trim() || null,
    weekly_knowledge_content: data.weeklyKnowledgeContent?.trim() || null,
    weekly_knowledge_content_en: data.weeklyKnowledgeContentEn?.trim() || null,
    weekly_knowledge_content_am: data.weeklyKnowledgeContentAm?.trim() || null,
    weekly_knowledge_image_url: sanitizeOptionalHttpUrl(data.weeklyKnowledgeImageUrl),
    key_verse: data.keyVerse?.trim() || null,
    key_verse_en: data.keyVerseEn?.trim() || null,
    key_verse_am: data.keyVerseAm?.trim() || null,
    organizer_note: data.organizerNote?.trim() || null,
    organizer_note_en: data.organizerNoteEn?.trim() || null,
    organizer_note_am: data.organizerNoteAm?.trim() || null,
    class_summary_content: data.classSummaryContent?.trim() || null,
    class_summary_content_en: data.classSummaryContentEn?.trim() || null,
    class_summary_content_am: data.classSummaryContentAm?.trim() || null,
    is_active: data.isActive,
    publication_status: data.publicationStatus,
  }
  if (id) {
    row.id = id
  }
  return row
}

function buildUpcomingMezmurRows(
  upcomingId: string,
  mezmurs: UpcomingTimirtEditorInput['mezmurs'],
): UpcomingMezmurInsert[] {
  return mezmurs.map((mezmur, index) => ({
    upcoming_timirit_id: upcomingId,
    title: mezmur.title?.trim() || 'Untitled mezmur',
    title_en: mezmur.titleEn?.trim() || null,
    title_am: mezmur.titleAm?.trim() || null,
    transliteration: mezmur.transliteration?.trim() || null,
    lyrics: mezmur.lyrics?.trim() || null,
    lyrics_en: mezmur.lyricsEn?.trim() || null,
    lyrics_am: mezmur.lyricsAm?.trim() || null,
    note_en: mezmur.noteEn?.trim() || null,
    note_am: mezmur.noteAm?.trim() || null,
    youtube_url: sanitizeOptionalHttpUrl(mezmur.youtubeUrl),
    audio_url: sanitizeOptionalHttpUrl(mezmur.audioUrl),
    order_index: index,
  }))
}

export async function saveUpcomingTimirtEditor(data: UpcomingTimirtEditorInput): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const insertRow = buildUpcomingTimiritInsertRow(data)
  logAdminWrite('saveUpcomingTimirtEditor', 'payload_received', { payload: structuredClone(data) })
  logAdminWrite('saveUpcomingTimirtEditor', 'payload_normalized', { insertRow: structuredClone(insertRow) })

  if (import.meta.env.DEV) {
    console.info('[saveUpcomingTimirtEditor] incoming form payload', structuredClone(data))
    console.info('[saveUpcomingTimirtEditor] upcoming_timirit upsert row', structuredClone(insertRow))
  }

  const { data: upcomingRecord, error: upcomingError } = await supabase
    .from('upcoming_timirit')
    .upsert(insertRow)
    .select('id')
    .single()

  if (import.meta.env.DEV) {
    console.info('[saveUpcomingTimirtEditor] upcoming_timirit response', { upcomingRecord, upcomingError })
  }
  logAdminWrite('saveUpcomingTimirtEditor', 'upcoming_timirit_upsert_response', {
    returnedId: upcomingRecord?.id ?? null,
    hasError: Boolean(upcomingError),
  })

  if (upcomingError) {
    logAdminWriteError('saveUpcomingTimirtEditor', 'upcoming_timirit_upsert', upcomingError)
    throw new Error(formatUnknownError(upcomingError))
  }

  if (!upcomingRecord?.id) {
    throw new Error('Save did not return an upcoming Timirit id.')
  }

  const upcomingId = upcomingRecord.id

  const { error: deleteMezmursError } = await supabase
    .from('upcoming_mezmurs')
    .delete()
    .eq('upcoming_timirit_id', upcomingId)

  if (deleteMezmursError) {
    if (import.meta.env.DEV) {
      console.error('[saveUpcomingTimirtEditor] delete upcoming_mezmurs', deleteMezmursError)
    }
    logAdminWriteError('saveUpcomingTimirtEditor', 'upcoming_mezmurs_delete_existing', deleteMezmursError)
    throw new Error(formatUnknownError(deleteMezmursError))
  }

  const mezmurRows = buildUpcomingMezmurRows(upcomingId, data.mezmurs)

  if (import.meta.env.DEV) {
    console.info('[saveUpcomingTimirtEditor] upcoming_mezmurs insert rows', structuredClone(mezmurRows))
  }

  let { error: insertMezmursError } = await supabase.from('upcoming_mezmurs').insert(mezmurRows)

  if (isMissingYoutubeUrlColumnError(insertMezmursError)) {
    const fallbackRows = mezmurRows.map(({ youtube_url: _y, ...rest }) => rest)
    const fallbackInsert = await supabase.from('upcoming_mezmurs').insert(fallbackRows)
    insertMezmursError = fallbackInsert.error
  }

  if (import.meta.env.DEV) {
    console.info('[saveUpcomingTimirtEditor] upcoming_mezmurs insert result', { insertMezmursError })
  }

  if (insertMezmursError) {
    logAdminWriteError('saveUpcomingTimirtEditor', 'upcoming_mezmurs_insert', insertMezmursError)
    throw new Error(formatUnknownError(insertMezmursError))
  }
  logAdminWrite('saveUpcomingTimirtEditor', 'upcoming_mezmurs_insert_success', {
    rowCount: mezmurRows.length,
  })

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
    topicPreview: row.topic_preview ?? '',
    note: row.note ?? '',
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
    topicPreview: row.topic_preview ?? '',
    note: row.note ?? '',
    isActive: row.is_active ?? false,
    publicationStatus: row.publication_status === 'published' ? 'published' : 'draft',
  }))
}

export async function setUpcomingTimiritActive(id: string, isActive: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  logAdminWrite('setUpcomingTimiritActive', 'payload_received', { id, isActive })
  const { error } = await supabase
    .from('upcoming_timirit')
    .update({
      is_active: isActive,
      publication_status: isActive ? 'published' : 'draft',
    })
    .eq('id', id)

  if (error) {
    logAdminWriteError('setUpcomingTimiritActive', 'upcoming_timirit_update', error)
    throw error
  }
  logAdminWrite('setUpcomingTimiritActive', 'upcoming_timirit_update_success', { id, isActive })

  invalidateDataCaches()
}

export async function deactivateUpcomingTimirt(id?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  logAdminWrite('deactivateUpcomingTimirt', 'payload_received', { id: id ?? null })
  let query = supabase
    .from('upcoming_timirit')
    .update({ is_active: false, publication_status: 'draft' })
    .eq('is_active', true)

  if (id) {
    query = query.eq('id', id)
  }

  const { error } = await query
  if (error) {
    logAdminWriteError('deactivateUpcomingTimirt', 'deactivate_update', error)
    throw error
  }
  logAdminWrite('deactivateUpcomingTimirt', 'deactivate_update_success', { id: id ?? null })

  invalidateDataCaches()
}

export async function deleteUpcomingTimirt(id?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  logAdminWrite('deleteUpcomingTimirt', 'payload_received', { id: id ?? null })
  if (id) {
    const { error } = await supabase
      .from('upcoming_timirit')
      .delete()
      .eq('id', id)
    if (error) {
      logAdminWriteError('deleteUpcomingTimirt', 'delete_by_id', error)
      throw error
    }
  } else {
    const { data: activeRows, error: selectError } = await supabase
      .from('upcoming_timirit')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    if (selectError) {
      logAdminWriteError('deleteUpcomingTimirt', 'select_active_row', selectError)
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
      logAdminWriteError('deleteUpcomingTimirt', 'delete_active_row', deleteError)
      throw deleteError
    }
  }
  logAdminWrite('deleteUpcomingTimirt', 'delete_success', { id: id ?? null })

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

  logAdminWrite('createWeeklyClass', 'payload_received', { payload: structuredClone(data) })
  const insertRow: Database['public']['Tables']['weekly_classes']['Insert'] = {
    id: data.id,
    date: data.date,
    topic: trimOrNull(data.topic) ?? trimOrNull(data.topicEn) ?? trimOrNull(data.topicAm),
    topic_en: trimOrNull(data.topicEn),
    topic_am: trimOrNull(data.topicAm),
    speaker: data.speaker?.trim() || ' ',
    amharic_summary: data.amharicSummary?.trim() || data.englishSummary?.trim() || ' ',
    english_summary: data.englishSummary?.trim() || data.amharicSummary?.trim() || ' ',
    key_points: Array.isArray(data.keyPoints) ? data.keyPoints.map((p) => p.trim()).filter(Boolean) : [],
    verses: Array.isArray(data.verses) ? data.verses.map((v) => v.trim()).filter(Boolean) : [],
    youtube_url: sanitizeOptionalHttpUrl(data.youtubeUrl),
    audio_url: sanitizeOptionalHttpUrl(data.audioUrl),
    audio_title: trimOrNull(data.audioTitle),
    audio_title_en: trimOrNull(data.audioTitleEn),
    audio_title_am: trimOrNull(data.audioTitleAm),
    audio_note: trimOrNull(data.audioNote),
    audio_note_en: trimOrNull(data.audioNoteEn),
    audio_note_am: trimOrNull(data.audioNoteAm),
    lesson_media_enabled: data.lessonMediaEnabled ?? true,
    teaching_notes: trimOrNull(data.teachingNotes),
    teaching_notes_en: trimOrNull(data.teachingNotesEn),
    teaching_notes_am: trimOrNull(data.teachingNotesAm),
  }
  logAdminWrite('createWeeklyClass', 'payload_normalized', { insertRow: structuredClone(insertRow) })

  const { data: result, error } = await supabase
    .from('weekly_classes')
    .insert(insertRow)
    .select('id')
    .single()
  logAdminWrite('createWeeklyClass', 'weekly_classes_insert_response', {
    returnedId: result?.id ?? null,
    hasError: Boolean(error),
  })

  if (error) {
    logAdminWriteError('createWeeklyClass', 'weekly_classes_insert', error)
    throw new Error(formatUnknownError(error))
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

  logAdminWrite('updateWeeklyClass', 'payload_received', { id, payload: structuredClone(data) })
  const updateData: Database['public']['Tables']['weekly_classes']['Update'] = {}
  
  if (data.topic !== undefined) updateData.topic = trimOrNull(data.topic)
  if (data.topicEn !== undefined) updateData.topic_en = trimOrNull(data.topicEn)
  if (data.topicAm !== undefined) updateData.topic_am = trimOrNull(data.topicAm)
  if (data.speaker !== undefined) updateData.speaker = data.speaker.trim() || ' '
  if (data.amharicSummary !== undefined) updateData.amharic_summary = data.amharicSummary.trim() || ' '
  if (data.englishSummary !== undefined) updateData.english_summary = data.englishSummary.trim() || ' '
  if (data.keyPoints !== undefined) updateData.key_points = data.keyPoints.map((p) => p.trim()).filter(Boolean)
  if (data.verses !== undefined) updateData.verses = data.verses.map((v) => v.trim()).filter(Boolean)
  if (data.youtubeUrl !== undefined) updateData.youtube_url = sanitizeOptionalHttpUrl(data.youtubeUrl)
  if (data.audioUrl !== undefined) updateData.audio_url = sanitizeOptionalHttpUrl(data.audioUrl)
  if (data.audioTitle !== undefined) updateData.audio_title = trimOrNull(data.audioTitle)
  if (data.audioTitleEn !== undefined) updateData.audio_title_en = trimOrNull(data.audioTitleEn)
  if (data.audioTitleAm !== undefined) updateData.audio_title_am = trimOrNull(data.audioTitleAm)
  if (data.audioNote !== undefined) updateData.audio_note = trimOrNull(data.audioNote)
  if (data.audioNoteEn !== undefined) updateData.audio_note_en = trimOrNull(data.audioNoteEn)
  if (data.audioNoteAm !== undefined) updateData.audio_note_am = trimOrNull(data.audioNoteAm)
  if (data.lessonMediaEnabled !== undefined) updateData.lesson_media_enabled = data.lessonMediaEnabled
  if (data.teachingNotes !== undefined) updateData.teaching_notes = trimOrNull(data.teachingNotes)
  if (data.teachingNotesEn !== undefined) updateData.teaching_notes_en = trimOrNull(data.teachingNotesEn)
  if (data.teachingNotesAm !== undefined) updateData.teaching_notes_am = trimOrNull(data.teachingNotesAm)
  if (data.feedbackSummary !== undefined) updateData.feedback_summary = trimOrNull(data.feedbackSummary)
  if (data.attendanceSummary !== undefined) updateData.attendance_summary = trimOrNull(data.attendanceSummary)
  logAdminWrite('updateWeeklyClass', 'payload_normalized', { id, updateData: structuredClone(updateData) })

  const { error } = await supabase
    .from('weekly_classes')
    .update(updateData)
    .eq('id', id)
  logAdminWrite('updateWeeklyClass', 'weekly_classes_update_response', { id, hasError: Boolean(error) })

  if (error) {
    logAdminWriteError('updateWeeklyClass', 'weekly_classes_update', error)
    throw new Error(formatUnknownError(error))
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

  logAdminWrite('deleteWeeklyClass', 'payload_received', { id })
  const { error } = await supabase
    .from('weekly_classes')
    .delete()
    .eq('id', id)

  if (error) {
    logAdminWriteError('deleteWeeklyClass', 'weekly_classes_delete', error)
    throw new Error(formatUnknownError(error))
  }
  logAdminWrite('deleteWeeklyClass', 'weekly_classes_delete_success', { id })

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
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((m: {
          title: string
          title_en?: string | null
          title_am?: string | null
          transliteration?: string | null
          lyrics?: string | null
          lyrics_en?: string | null
          lyrics_am?: string | null
          note_en?: string | null
          note_am?: string | null
          youtube_url?: string | null
          audio_url?: string | null
        }) => ({
          title: m.title,
          titleEn: m.title_en || undefined,
          titleAm: m.title_am || undefined,
          transliteration: m.transliteration || undefined,
          lyrics: m.lyrics || undefined,
          lyricsEn: m.lyrics_en || undefined,
          lyricsAm: m.lyrics_am || undefined,
          noteEn: m.note_en || undefined,
          noteAm: m.note_am || undefined,
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
    topic: data.topic ?? data.topic_en ?? data.topic_am ?? '',
    topicEn: data.topic_en || undefined,
    topicAm: data.topic_am || undefined,
    speaker: data.speaker ?? 'Organizer',
    amharicSummary: data.amharic_summary ?? '',
    englishSummary: data.english_summary ?? '',
    keyPoints: Array.isArray(data.key_points) ? data.key_points : [],
    verses: Array.isArray(data.verses) ? data.verses : undefined,
    youtubeUrl: data.youtube_url || undefined,
    audioUrl: data.audio_url || undefined,
    audioTitle: data.audio_title || undefined,
    audioTitleEn: data.audio_title_en || undefined,
    audioTitleAm: data.audio_title_am || undefined,
    audioNote: data.audio_note || undefined,
    audioNoteEn: data.audio_note_en || undefined,
    audioNoteAm: data.audio_note_am || undefined,
    lessonMediaEnabled: data.lesson_media_enabled ?? true,
    teachingNotes: data.teaching_notes || undefined,
    teachingNotesEn: data.teaching_notes_en || undefined,
    teachingNotesAm: data.teaching_notes_am || undefined,
    mezmurs,
    questions: sortedQuestions,
    feedbackSummary: data.feedback_summary || undefined,
    attendanceSummary: data.attendance_summary || undefined
  }
}

/**
 * Transform database question row to Question type
 */
function trimU(value: string | null | undefined): string | undefined {
  const t = value?.trim()
  return t ? t : undefined
}

function transformQuestion(data: {
  id: string
  type: string
  prompt?: string | null
  prompt_en?: string | null
  prompt_am?: string | null
  helper_text?: string | null
  helper_text_en?: string | null
  helper_text_am?: string | null
  placeholder?: string | null
  placeholder_en?: string | null
  placeholder_am?: string | null
  correct_index?: number | null
  explanation?: string | null
  explanation_en?: string | null
  explanation_am?: string | null
  multiple_choice_options?: unknown
  attendance_options?: unknown
}): Question {
  const promptEn = trimU(data.prompt_en) ?? trimU(data.prompt)
  const promptAm = trimU(data.prompt_am)
  const baseQuestion = {
    id: data.id,
    type: data.type as QuestionType,
    prompt: pickLocalized('en', data.prompt_en, data.prompt_am, data.prompt) || '',
    promptEn,
    promptAm,
    helperText: pickLocalized('en', data.helper_text_en, data.helper_text_am, data.helper_text) || undefined,
    helperTextEn: trimU(data.helper_text_en) ?? trimU(data.helper_text),
    helperTextAm: trimU(data.helper_text_am),
  }

  switch (data.type) {
    case 'multiple-choice': {
      const sortedOptions = Array.isArray(data.multiple_choice_options)
        ? data.multiple_choice_options
            .sort((a: { option_index: number }, b: { option_index: number }) => a.option_index - b.option_index)
            .map((opt: {
              option_text?: string | null
              option_text_en?: string | null
              option_text_am?: string | null
            }) =>
              normalizeLocalizedText({
                en: opt.option_text_en ?? opt.option_text ?? undefined,
                am: opt.option_text_am ?? undefined,
              }),
            )
        : []

      return {
        ...baseQuestion,
        type: 'multiple-choice',
        options: sortedOptions,
        correctIndex: data.correct_index ?? 0,
        explanation: pickLocalized('en', data.explanation_en, data.explanation_am, data.explanation) || '',
        explanationEn: trimU(data.explanation_en) ?? trimU(data.explanation),
        explanationAm: trimU(data.explanation_am),
      }
    }

    case 'attendance': {
      const sortedAttendanceOptions = Array.isArray(data.attendance_options)
        ? data.attendance_options
            .sort((a: { option_index: number }, b: { option_index: number }) => a.option_index - b.option_index)
            .map((opt: {
              value: AttendanceChoice
              label?: string | null
              label_en?: string | null
              label_am?: string | null
            }) => ({
              value: opt.value as AttendanceChoice,
              label: pickLocalized('en', opt.label_en, opt.label_am, opt.label) || '',
              labelEn: trimU(opt.label_en) ?? trimU(opt.label),
              labelAm: trimU(opt.label_am),
            }))
        : []

      return {
        ...baseQuestion,
        type: 'attendance',
        options: sortedAttendanceOptions,
      }
    }

    case 'short-answer':
    case 'reflection':
    case 'feedback-open':
      return {
        ...baseQuestion,
        type: data.type,
        placeholder: pickLocalized('en', data.placeholder_en, data.placeholder_am, data.placeholder) || undefined,
        placeholderEn: trimU(data.placeholder_en) ?? trimU(data.placeholder),
        placeholderAm: trimU(data.placeholder_am),
      } as Question

    default:
      throw new Error(`Unknown question type: ${data.type}`)
  }
}