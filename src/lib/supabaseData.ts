import type { Database } from './database.types'
import { supabase } from './supabase'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type {
  AttendanceChoice,
  AttendanceQuestion,
  AttendanceSlice,
  LocalizedText,
  Mezmur,
  OrganizerSnapshot,
  Question,
  QuestionType,
  RecapSuggestion,
  WeeklyClass,
  WeeklyQuestionStat,
  WeeklyQuestionStatsReport,
  TeachingMainPoint,
} from '../data/types'
import type { WeeklyKnowledgeEditorInput, WeeklyKnowledgeItem, WeeklyKnowledgeStatus } from '../data/weeklyKnowledge'

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
  attendanceOptions?: Array<{ value: AttendanceChoice; label: string; labelEn?: string; labelAm?: string }>
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
  mainPoints?: TeachingMainPoint[]
  youtubeUrl?: string
  audioUrl?: string
  audioTitle?: string
  audioNote?: string
  keyVerse?: string
  organizerNote?: string
  status?: 'draft' | 'published'
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
  questions: EditorQuestionInput[]
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
  classSummary?: string
  classSummaryEn?: string
  classSummaryAm?: string
  mainPoints?: TeachingMainPoint[]
  youtubeUrl?: string
  audioUrl?: string
  audioTitle?: string
  keyVerse?: string
  organizerNote?: string
  isActive: boolean
  status: 'draft' | 'published'
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
}

export interface UpcomingTimirtListItem {
  id: string
  scheduledDate: string
  topicPreview: string
  topicPreviewEn?: string
  topicPreviewAm?: string
  note: string
  noteEn?: string
  noteAm?: string
  isActive: boolean
  status: 'draft' | 'published'
}

type WeeklyClassRow = Database['public']['Tables']['weekly_classes']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']
type McOptionRow = Database['public']['Tables']['multiple_choice_options']['Row']
type MezmurRow = Database['public']['Tables']['mezmurs']['Row']
type WeeklyKnowledgeRow = Database['public']['Tables']['weekly_knowledge']['Row']

let weeklyClassesCache: WeeklyClass[] | null = null
let weeklyClassesCacheTimestamp = 0
const CACHE_MS = 60 * 1000
const RESPONSE_CACHE_KEY = 'eotc-user-responses-cache'

const trim = (v?: string | null) => {
  const t = v?.trim()
  return t ? t : undefined
}
const pickLocalized = (en?: string | null, am?: string | null, base?: string | null) => trim(en) ?? trim(am) ?? trim(base)
const isFresh = () => Date.now() - weeklyClassesCacheTimestamp < CACHE_MS

function sanitizeMainPoints(points?: TeachingMainPoint[] | null): TeachingMainPoint[] {
  if (!Array.isArray(points)) {
    return []
  }
  return points
    .slice(0, 4)
    .map((point) => ({
      en: trim(point?.en),
      am: trim(point?.am),
    }))
    .filter((point) => Boolean(point.en || point.am))
}

function parseMainPoints(value: unknown): TeachingMainPoint[] {
  if (!Array.isArray(value)) {
    return []
  }
  return sanitizeMainPoints(
    value.map((point) =>
      point && typeof point === 'object'
        ? {
            en: (point as { en?: unknown }).en as string | undefined,
            am: (point as { am?: unknown }).am as string | undefined,
          }
        : {},
    ),
  )
}

function toMainPointsJson(points?: TeachingMainPoint[] | null): Array<{ en: string | null; am: string | null }> {
  return sanitizeMainPoints(points).map((point) => ({
    en: point.en ?? null,
    am: point.am ?? null,
  }))
}

/** Fixed order for persisting attendance labels in `multiple_choice_options.option_index`. */
const ATTENDANCE_OPTION_ORDER: readonly AttendanceChoice[] = ['in-person', 'online', 'maybe', 'cannot-attend']

const defaultAttendanceOptions = (): AttendanceQuestion['options'] => [
  { value: 'in-person', label: 'In person', labelEn: 'In person' },
  { value: 'online', label: 'Online', labelEn: 'Online' },
  { value: 'maybe', label: 'Maybe', labelEn: 'Maybe' },
  { value: 'cannot-attend', label: 'Cannot attend', labelEn: 'Cannot attend' },
]

function attendanceOptionsFromMcRows(rows: McOptionRow[]): AttendanceQuestion['options'] {
  const sorted = [...rows].sort((a, b) => a.option_index - b.option_index)
  if (sorted.length === 0) {
    return defaultAttendanceOptions()
  }
  const defaults = defaultAttendanceOptions()
  return ATTENDANCE_OPTION_ORDER.map((value, idx) => {
    const row = sorted.find((r) => r.option_index === idx) ?? sorted[idx]
    const fallback = defaults[idx]
    if (!row) {
      return fallback
    }
    const en = trim(row.option_text_en) ?? trim(row.option_text)
    const am = trim(row.option_text_am)
    const merged = pickLocalized(row.option_text_en, row.option_text_am, row.option_text) ?? fallback.label
    return {
      value,
      label: merged,
      labelEn: en ?? fallback.labelEn ?? fallback.label,
      labelAm: am,
    }
  })
}

type SupabaseErrorLike = {
  message: string
  details?: string | null
  hint?: string | null
  code?: string | null
}

function isMissingColumnError(error: unknown, table: string, column: string): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const maybe = error as { code?: string; message?: string }
  return (
    maybe.code === '42703' &&
    typeof maybe.message === 'string' &&
    maybe.message.includes(`${table}.${column}`)
  )
}

function shouldRetryWithLegacySelect(error: unknown, table: string, column: string): boolean {
  if (isMissingColumnError(error, table, column)) {
    return true
  }
  const maybe = (error ?? {}) as { code?: string; message?: string }
  const message = typeof maybe.message === 'string' ? maybe.message.toLowerCase() : ''
  return maybe.code === '400' || message.includes('does not exist') || message.includes(column)
}

function parseOptionalUuid(value?: string | null): string | undefined {
  const trimmed = trim(value)
  if (!trimmed) return undefined
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(trimmed) ? trimmed : undefined
}

function throwSupabaseWriteError(
  operation: string,
  table: string,
  error: SupabaseErrorLike | null,
  payload?: unknown,
): never | void {
  if (!error) return
  const enriched = {
    table,
    operation,
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
    payload: payload ?? null,
    fullError: error,
  }
  console.error('[supabaseData] organizer write failed', enriched)
  const wrapped = new Error(error.message) as Error & { supabase?: typeof enriched }
  wrapped.supabase = enriched
  throw wrapped
}

function invalidateCache() {
  weeklyClassesCache = null
  weeklyClassesCacheTimestamp = 0
}

function mapQuestion(q: QuestionRow, options: McOptionRow[]): Question {
  const base = {
    id: q.id,
    type: q.type as QuestionType,
    prompt: pickLocalized(q.prompt_en, q.prompt_am, q.prompt) ?? '',
    promptEn: trim(q.prompt_en) ?? trim(q.prompt),
    promptAm: trim(q.prompt_am),
    helperText: pickLocalized(q.helper_text_en, q.helper_text_am, q.helper_text),
    helperTextEn: trim(q.helper_text_en) ?? trim(q.helper_text),
    helperTextAm: trim(q.helper_text_am),
  }
  if (q.type === 'multiple-choice') {
    return {
      ...base,
      type: 'multiple-choice',
      options: options.sort((a, b) => a.option_index - b.option_index).map((o) => ({ en: trim(o.option_text_en) ?? trim(o.option_text), am: trim(o.option_text_am) })),
      correctIndex: q.correct_index ?? 0,
      explanation: pickLocalized(q.explanation_en, q.explanation_am, q.explanation) ?? '',
      explanationEn: trim(q.explanation_en) ?? trim(q.explanation),
      explanationAm: trim(q.explanation_am),
    }
  }
  if (q.type === 'attendance') {
    return { ...base, type: 'attendance', options: attendanceOptionsFromMcRows(options) }
  }
  return {
    ...base,
    type: q.type as Extract<QuestionType, 'short-answer' | 'reflection' | 'feedback-open'>,
    placeholder: pickLocalized(q.placeholder_en, q.placeholder_am, q.placeholder),
    placeholderEn: trim(q.placeholder_en) ?? trim(q.placeholder),
    placeholderAm: trim(q.placeholder_am),
  }
}

function mapClass(row: WeeklyClassRow, mezmurs: MezmurRow[], questions: Question[]): WeeklyClass {
  const m = mezmurs.sort((a, b) => a.order_index - b.order_index).map((x): Mezmur => ({
    title: pickLocalized(x.title_en, x.title_am, x.title) ?? '',
    titleEn: trim(x.title_en), titleAm: trim(x.title_am), transliteration: trim(x.transliteration),
    lyrics: trim(x.lyrics), lyricsEn: undefined, lyricsAm: undefined,
    noteEn: undefined, noteAm: undefined, youtubeUrl: trim(x.youtube_url), audioUrl: trim(x.audio_url),
  }))
  return {
    id: row.id, date: row.date,
    topic: pickLocalized(row.topic_en, row.topic_am, row.topic) ?? '',
    topicEn: trim(row.topic_en), topicAm: trim(row.topic_am), speaker: trim(row.speaker) ?? '',
    amharicSummary: row.amharic_summary ?? '', englishSummary: row.english_summary ?? '',
    keyPoints: [], verses: [],
    youtubeUrl: trim(row.youtube_url), audioUrl: trim(row.audio_url),
    audioTitle: trim(row.audio_title),
    audioTitleEn: undefined, audioTitleAm: undefined,
    audioNote: trim(row.audio_note), lessonMediaEnabled: undefined,
    teachingNotes: undefined,
    teachingNotesEn: undefined, teachingNotesAm: undefined,
    mainPoints: parseMainPoints(row.main_points),
    keyVerse: trim(row.key_verse),
    organizerNote: trim(row.organizer_note),
    status: row.status === 'published' ? 'published' : 'draft',
    mezmurs: [m[0] ?? { title: '' }, m[1] ?? { title: '' }],
    questions,
  }
}

export function getCachedWeeklyClasses(): WeeklyClass[] | null {
  return weeklyClassesCache && isFresh() ? weeklyClassesCache : null
}

export async function getWeeklyClasses(): Promise<WeeklyClass[]> {
  if (weeklyClassesCache && isFresh()) return weeklyClassesCache
  if (!supabase) return []
  const weeklyClassSelectShapeLegacy = [
    'id',
    'date',
    'topic',
    'topic_en',
    'topic_am',
    'speaker',
    'amharic_summary',
    'english_summary',
    'key_verse',
    'youtube_url',
    'audio_url',
    'audio_title',
    'audio_note',
    'organizer_note',
    'status',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
  ].join(',')
  if (import.meta.env.DEV) {
    console.info('[getWeeklyClasses] select shape', weeklyClassSelectShapeLegacy)
  }
  const { data: classRows, error } = await supabase
    .from('weekly_classes')
    .select(weeklyClassSelectShapeLegacy)
    .order('date', { ascending: false })
  if (error) throw error
  const rows = (classRows ?? []) as unknown as WeeklyClassRow[]
  const ids = rows.map((r) => r.id)
  if (ids.length === 0) return []

  const [{ data: mezmurs }, { data: questions }, { data: opts }] = await Promise.all([
    supabase.from('mezmurs').select('*').in('weekly_class_id', ids),
    supabase.from('questions').select('*').in('weekly_class_id', ids),
    supabase.from('multiple_choice_options').select('*'),
  ])
  const optMap = new Map<string, McOptionRow[]>()
  for (const o of opts ?? []) optMap.set(o.question_id, [...(optMap.get(o.question_id) ?? []), o])
  const qMap = new Map<string, Question[]>()
  for (const q of (questions ?? []).sort((a, b) => a.order_index - b.order_index)) {
    qMap.set(q.weekly_class_id, [...(qMap.get(q.weekly_class_id) ?? []), mapQuestion(q, optMap.get(q.id) ?? [])])
  }
  const result = rows.map((r) => mapClass(r, (mezmurs ?? []).filter((m) => m.weekly_class_id === r.id), qMap.get(r.id) ?? []))
  weeklyClassesCache = result
  weeklyClassesCacheTimestamp = Date.now()
  return result
}

export async function getWeeklyClass(id: string): Promise<WeeklyClass | null> {
  const all = await getWeeklyClasses()
  return all.find((w) => w.id === id) ?? null
}

export async function getUpcomingTimirt(): Promise<UpcomingTimirtPreview | null> {
  if (!supabase) return null
  let data: Array<Record<string, unknown>> | null = null
  {
    const withMainPoints = await supabase
      .from('upcoming_timirit')
      .select('*')
      .eq('is_active', true)
      .order('scheduled_date', { ascending: true })
      .limit(1)
    if (withMainPoints.error) {
      if (shouldRetryWithLegacySelect(withMainPoints.error, 'upcoming_timirit', 'main_points')) {
        const legacy = await supabase
          .from('upcoming_timirit')
          .select('id,scheduled_date,topic_preview,topic_preview_en,topic_preview_am,note,note_en,note_am,class_summary,class_summary_en,class_summary_am,youtube_url,audio_url,audio_title,key_verse,organizer_note,status,is_active')
          .eq('is_active', true)
          .order('scheduled_date', { ascending: true })
          .limit(1)
        if (legacy.error) throw legacy.error
        data = legacy.data as Array<Record<string, unknown>> | null
      } else {
        throw withMainPoints.error
      }
    } else {
      data = withMainPoints.data as Array<Record<string, unknown>> | null
    }
  }
  const row = data?.[0] as Database['public']['Tables']['upcoming_timirit']['Row'] | undefined
  if (!row) return null
  const { data: mezmurs } = await supabase.from('upcoming_mezmurs').select('*').eq('upcoming_timirit_id', row.id).order('order_index', { ascending: true })
  return {
    scheduledDate: row.scheduled_date,
    topicPreview: pickLocalized(row.topic_preview_en, row.topic_preview_am, row.topic_preview) ?? '',
    topicPreviewEn: trim(row.topic_preview_en) ?? trim(row.topic_preview),
    topicPreviewAm: trim(row.topic_preview_am),
    note: pickLocalized(row.note_en, row.note_am, row.note) ?? '',
    noteEn: trim(row.note_en) ?? trim(row.note),
    noteAm: trim(row.note_am),
    classSummary: pickLocalized(row.class_summary_en, row.class_summary_am, row.class_summary),
    classSummaryEn: trim(row.class_summary_en) ?? trim(row.class_summary),
    classSummaryAm: trim(row.class_summary_am),
    mainPoints: parseMainPoints(row.main_points),
    youtubeUrl: trim(row.youtube_url), audioUrl: trim(row.audio_url), audioTitle: trim(row.audio_title),
    lessonYoutubeUrl: trim(row.youtube_url),
    lessonAudioUrl: trim(row.audio_url),
    lessonAudioTitle: trim(row.audio_title),
    lessonNote: pickLocalized(row.class_summary_en, row.class_summary_am, row.class_summary),
    keyVerse: trim(row.key_verse),
    organizerNote: trim(row.organizer_note),
    status: row.status === 'published' ? 'published' : 'draft',
    mezmurs: [
      {
        title: pickLocalized(mezmurs?.[0]?.title_en, mezmurs?.[0]?.title_am, mezmurs?.[0]?.title) ?? '',
        titleEn: trim(mezmurs?.[0]?.title_en) ?? trim(mezmurs?.[0]?.title),
        titleAm: trim(mezmurs?.[0]?.title_am),
        transliteration: trim(mezmurs?.[0]?.transliteration),
        lyrics: trim(mezmurs?.[0]?.lyrics),
        youtubeUrl: trim(mezmurs?.[0]?.youtube_url),
        audioUrl: trim(mezmurs?.[0]?.audio_url),
      },
      {
        title: pickLocalized(mezmurs?.[1]?.title_en, mezmurs?.[1]?.title_am, mezmurs?.[1]?.title) ?? '',
        titleEn: trim(mezmurs?.[1]?.title_en) ?? trim(mezmurs?.[1]?.title),
        titleAm: trim(mezmurs?.[1]?.title_am),
        transliteration: trim(mezmurs?.[1]?.transliteration),
        lyrics: trim(mezmurs?.[1]?.lyrics),
        youtubeUrl: trim(mezmurs?.[1]?.youtube_url),
        audioUrl: trim(mezmurs?.[1]?.audio_url),
      },
    ],
  }
}

function mapKnowledge(row: WeeklyKnowledgeRow): WeeklyKnowledgeItem {
  return {
    id: row.id,
    title: pickLocalized(row.title_en, row.title_am, row.title) ?? '',
    titleEn: trim(row.title_en) ?? trim(row.title),
    titleAm: trim(row.title_am),
    subtitle: pickLocalized(row.subtitle_en, row.subtitle_am, row.subtitle),
    subtitleEn: trim(row.subtitle_en) ?? trim(row.subtitle),
    subtitleAm: trim(row.subtitle_am),
    content: pickLocalized(row.content_en, row.content_am, row.content) ?? '',
    contentEn: trim(row.content_en) ?? trim(row.content),
    contentAm: trim(row.content_am),
    extraNote: pickLocalized(row.extra_note_en, row.extra_note_am, row.extra_note),
    extraNoteEn: trim(row.extra_note_en) ?? trim(row.extra_note),
    extraNoteAm: trim(row.extra_note_am),
    imageUrl: trim(row.image_url),
    buttonText: pickLocalized(row.button_text_en, row.button_text_am, row.button_text),
    buttonTextEn: trim(row.button_text_en) ?? trim(row.button_text),
    buttonTextAm: trim(row.button_text_am),
    buttonLink: trim(row.button_link),
    status: (trim(row.status) as WeeklyKnowledgeStatus) ?? 'draft',
    startDate: trim(row.start_date),
    endDate: trim(row.end_date),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getActiveWeeklyKnowledge(targetDate?: string): Promise<WeeklyKnowledgeItem | null> {
  if (!supabase) return null
  const date = targetDate ?? new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase.from('weekly_knowledge').select('*').eq('is_active', true).eq('status', 'published').order('updated_at', { ascending: false }).limit(25)
  if (error) throw error
  const row = (data ?? []).find((x) => (!x.start_date || x.start_date <= date) && (!x.end_date || x.end_date >= date))
  return row ? mapKnowledge(row) : null
}

export async function listWeeklyKnowledgeForAdmin(): Promise<WeeklyKnowledgeItem[]> { if (!supabase) return []; const { data, error } = await supabase.from('weekly_knowledge').select('*').order('updated_at', { ascending: false }); if (error) throw error; return (data ?? []).map(mapKnowledge) }
export async function getWeeklyKnowledgeForAdmin(id: string): Promise<WeeklyKnowledgeItem | null> { if (!supabase) return null; const { data, error } = await supabase.from('weekly_knowledge').select('*').eq('id', id).maybeSingle(); if (error) throw error; return data ? mapKnowledge(data) : null }

export async function saveWeeklyKnowledgeEditor(input: WeeklyKnowledgeEditorInput): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const row: Database['public']['Tables']['weekly_knowledge']['Insert'] = {
    id: input.id,
    title: trim(input.titleEn) ?? trim(input.titleAm) ?? trim(input.title) ?? null,
    subtitle: trim(input.subtitleEn) ?? trim(input.subtitleAm) ?? trim(input.subtitle) ?? null,
    title_en: trim(input.titleEn) ?? null,
    title_am: trim(input.titleAm) ?? null,
    subtitle_en: trim(input.subtitleEn) ?? null,
    subtitle_am: trim(input.subtitleAm) ?? null,
    content: trim(input.contentEn) ?? trim(input.contentAm) ?? trim(input.content) ?? null,
    content_en: trim(input.contentEn) ?? null,
    content_am: trim(input.contentAm) ?? null,
    extra_note: trim(input.extraNoteEn) ?? trim(input.extraNoteAm) ?? trim(input.extraNote) ?? null,
    extra_note_en: trim(input.extraNoteEn) ?? null,
    extra_note_am: trim(input.extraNoteAm) ?? null,
    image_url: trim(input.imageUrl) ?? null,
    button_text: pickLocalized(input.buttonTextEn, input.buttonTextAm, input.buttonText) ?? null,
    button_text_en: trim(input.buttonTextEn) ?? null,
    button_text_am: trim(input.buttonTextAm) ?? null,
    button_link: trim(input.buttonLink) ?? null,
    status: trim(input.status) ?? 'draft',
    start_date: trim(input.startDate) ?? null,
    end_date: trim(input.endDate) ?? null,
    is_active: input.status === 'published' ? input.isActive : false,
  }
  const { data, error } = await supabase.from('weekly_knowledge').upsert(row).select('id').single()
  throwSupabaseWriteError('upsert', 'weekly_knowledge', error, row)
  if (!data?.id) throw new Error('Supabase did not return weekly_knowledge id after upsert.')
  if (row.status === 'published' && row.is_active) await supabase.from('weekly_knowledge').update({ is_active: false }).neq('id', data.id).eq('is_active', true)
  return data.id
}

export async function setWeeklyKnowledgeStatus(id: string, status: WeeklyKnowledgeStatus, isActive: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (status === 'published' && isActive) {
    const { error: deactivateOthersError } = await supabase.from('weekly_knowledge').update({ is_active: false }).neq('id', id).eq('is_active', true)
    throwSupabaseWriteError('update deactivate others', 'weekly_knowledge', deactivateOthersError, { id, status, isActive })
  }
  const payload = { status, is_active: status === 'published' ? isActive : false }
  const { error } = await supabase.from('weekly_knowledge').update(payload).eq('id', id)
  throwSupabaseWriteError('update status', 'weekly_knowledge', error, { id, ...payload })
}

export async function deleteWeeklyKnowledge(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('weekly_knowledge').delete().eq('id', id)
  throwSupabaseWriteError('delete by id', 'weekly_knowledge', error, { id })
}

export async function saveWeeklyClassEditor(data: WeeklyClassEditorInput): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const id = parseOptionalUuid(data.id) ?? crypto.randomUUID()
  const assertNoError = (
    operation: string,
    error: { message: string; details?: string | null; hint?: string | null; code?: string | null } | null,
    context?: Record<string, unknown>,
  ) => {
    if (!error) return
    const enriched = {
      operation,
      message: error.message,
      details: error.details ?? null,
      hint: error.hint ?? null,
      code: error.code ?? null,
      context: context ?? null,
    }
    console.error('[saveWeeklyClassEditor] Supabase operation failed', enriched)
    const e = new Error(error.message) as Error & { supabase?: typeof enriched }
    e.supabase = enriched
    throw e
  }

  const row: Database['public']['Tables']['weekly_classes']['Insert'] = {
    id, date: data.date, topic: trim(data.topic) ?? trim(data.topicEn) ?? trim(data.topicAm) ?? null,
    topic_en: trim(data.topicEn) ?? null, topic_am: trim(data.topicAm) ?? null,
    speaker: trim(data.speaker) ?? '', amharic_summary: trim(data.amharicSummary) ?? '', english_summary: trim(data.englishSummary) ?? '',
    main_points: toMainPointsJson(data.mainPoints),
    youtube_url: trim(data.youtubeUrl) ?? null, audio_url: trim(data.audioUrl) ?? null,
    audio_title: trim(data.audioTitle) ?? null,
    audio_note: trim(data.audioNote) ?? null,
    key_verse: trim(data.keyVerse) ?? null,
    organizer_note: trim(data.organizerNote) ?? null,
    status: data.status ?? 'published',
  }
  if (import.meta.env.DEV) {
    console.info('[saveWeeklyClassEditor] upsert weekly_classes payload', { weeklyClassId: id, payload: structuredClone(row) })
  }
  const { error } = await supabase.from('weekly_classes').upsert(row)
  if (error) {
    if (shouldRetryWithLegacySelect(error, 'weekly_classes', 'main_points')) {
      const { main_points: _ignoredMainPoints, ...legacyRow } = row
      const { error: legacyUpsertError } = await supabase.from('weekly_classes').upsert(legacyRow)
      assertNoError('upsert weekly_classes (legacy schema)', legacyUpsertError, {
        weeklyClassId: id,
        payload: legacyRow,
      })
    } else {
      assertNoError('upsert weekly_classes', error, { weeklyClassId: id, payload: row })
    }
  }

  const { data: existingQuestions, error: existingQuestionsError } = await supabase
    .from('questions')
    .select('id')
    .eq('weekly_class_id', id)
  assertNoError('select existing questions', existingQuestionsError, { weeklyClassId: id })

  const existingQuestionIds = (existingQuestions ?? []).map((item) => item.id)
  if (existingQuestionIds.length > 0) {
    const { error: optionsDeleteError } = await supabase
      .from('multiple_choice_options')
      .delete()
      .in('question_id', existingQuestionIds)
    assertNoError('delete existing multiple_choice_options', optionsDeleteError, { weeklyClassId: id, questionIds: existingQuestionIds })
  }

  const { error: mezDeleteError } = await supabase.from('mezmurs').delete().eq('weekly_class_id', id)
  assertNoError('delete existing mezmurs', mezDeleteError, { weeklyClassId: id })

  const { error: questionsDeleteError } = await supabase.from('questions').delete().eq('weekly_class_id', id)
  assertNoError('delete existing questions', questionsDeleteError, { weeklyClassId: id })

  const mezRows = data.mezmurs
    .map((m, i) => ({
      weekly_class_id: id,
      order_index: i,
      title: pickLocalized(m.titleEn, m.titleAm, m.title) ?? '',
      title_en: trim(m.titleEn) ?? null,
      title_am: trim(m.titleAm) ?? null,
      transliteration: trim(m.transliteration) ?? null,
      lyrics: trim(m.lyrics) ?? null,
      youtube_url: trim(m.youtubeUrl) ?? null,
      audio_url: trim(m.audioUrl) ?? null,
    }))
    .filter((m) =>
      Boolean(
        m.title.trim() ||
          m.title_en?.trim() ||
          m.title_am?.trim() ||
          m.transliteration?.trim() ||
          m.lyrics?.trim() ||
          m.youtube_url?.trim() ||
          m.audio_url?.trim(),
      ),
    )
  if (mezRows.length > 0) {
    const { error: mezInsertError } = await supabase.from('mezmurs').insert(mezRows)
    assertNoError('insert mezmurs', mezInsertError, { weeklyClassId: id, payloadCount: mezRows.length })
  }

  const resolvedQuestionIds = data.questions.map((q) => parseOptionalUuid(q.id) ?? crypto.randomUUID())
  const qRows = data.questions.map((q, i) => ({
    id: resolvedQuestionIds[i],
    weekly_class_id: id,
    type: q.type,
    order_index: i,
    prompt: trim(q.prompt) ?? trim(q.promptEn) ?? trim(q.promptAm) ?? null,
    prompt_en: trim(q.promptEn) ?? null,
    prompt_am: trim(q.promptAm) ?? null,
    helper_text: trim(q.helperText) ?? trim(q.helperTextEn) ?? trim(q.helperTextAm) ?? null,
    helper_text_en: trim(q.helperTextEn) ?? null,
    helper_text_am: trim(q.helperTextAm) ?? null,
    placeholder: trim(q.placeholder) ?? trim(q.placeholderEn) ?? trim(q.placeholderAm) ?? null,
    placeholder_en: trim(q.placeholderEn) ?? null,
    placeholder_am: trim(q.placeholderAm) ?? null,
    correct_index: q.type === 'multiple-choice' ? (q.correctIndex ?? 0) : null,
    explanation: trim(q.explanation) ?? trim(q.explanationEn) ?? trim(q.explanationAm) ?? null,
    explanation_en: trim(q.explanationEn) ?? null,
    explanation_am: trim(q.explanationAm) ?? null,
  }))
  if (qRows.length > 0) {
    const { error: qInsertError } = await supabase.from('questions').insert(qRows)
    assertNoError('insert questions', qInsertError, { weeklyClassId: id, payloadCount: qRows.length })
  }
  for (const [i, q] of data.questions.entries()) {
    const qid = resolvedQuestionIds[i]
    if (q.type === 'multiple-choice') {
      const oRows = (q.options ?? []).map((o, oi) => ({
        question_id: qid,
        option_index: oi,
        option_text: trim(o.en) ?? trim(o.am) ?? null,
        option_text_en: trim(o.en) ?? null,
        option_text_am: trim(o.am) ?? null,
      }))
      if (oRows.length > 0) {
        const { error: optionsInsertError } = await supabase.from('multiple_choice_options').insert(oRows)
        assertNoError('insert multiple_choice_options', optionsInsertError, {
          weeklyClassId: id,
          questionId: qid,
          payloadCount: oRows.length,
        })
      }
      continue
    }
    if (q.type === 'attendance') {
      const byValue = new Map((q.attendanceOptions ?? []).map((o) => [o.value, o]))
      const oRows = ATTENDANCE_OPTION_ORDER.map((value, oi) => {
        const opt = byValue.get(value)
        const en = trim(opt?.labelEn) ?? trim(opt?.label)
        const am = trim(opt?.labelAm)
        return {
          question_id: qid,
          option_index: oi,
          option_text: pickLocalized(en, am, opt?.label) ?? null,
          option_text_en: en ?? null,
          option_text_am: am ?? null,
        }
      })
      const { error: attendanceOptionsError } = await supabase.from('multiple_choice_options').insert(oRows)
      assertNoError('insert multiple_choice_options (attendance)', attendanceOptionsError, {
        weeklyClassId: id,
        questionId: qid,
        payloadCount: oRows.length,
      })
    }
  }

  invalidateCache()
  return id
}

export async function listUpcomingTimiritForAdmin(): Promise<UpcomingTimirtListItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('upcoming_timirit').select('*').order('scheduled_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    scheduledDate: r.scheduled_date,
    topicPreview: pickLocalized(r.topic_preview_en, r.topic_preview_am, r.topic_preview) ?? '',
    topicPreviewEn: trim(r.topic_preview_en) ?? trim(r.topic_preview),
    topicPreviewAm: trim(r.topic_preview_am),
    note: pickLocalized(r.note_en, r.note_am, r.note) ?? '',
    noteEn: trim(r.note_en) ?? trim(r.note),
    noteAm: trim(r.note_am),
    isActive: r.is_active ?? false,
    status: r.status === 'published' ? 'published' : 'draft',
  }))
}

export const listActiveUpcomingTimirit = async () => (await listUpcomingTimiritForAdmin()).filter((x) => x.isActive)

export async function getUpcomingTimirtForAdmin(id?: string): Promise<UpcomingTimirtEditorInput | null> {
  if (!supabase) return null
  let query = supabase.from('upcoming_timirit').select('*').order('scheduled_date', { ascending: true }).limit(1)
  query = id ? query.eq('id', id) : query.eq('is_active', true)
  let data: Array<Record<string, unknown>> | null = null
  {
    const result = await query
    if (result.error) {
      if (shouldRetryWithLegacySelect(result.error, 'upcoming_timirit', 'main_points')) {
        let legacyQuery = supabase
          .from('upcoming_timirit')
          .select('id,scheduled_date,topic_preview,topic_preview_en,topic_preview_am,note,note_en,note_am,class_summary,class_summary_en,class_summary_am,youtube_url,audio_url,audio_title,key_verse,organizer_note,status,is_active')
          .order('scheduled_date', { ascending: true })
          .limit(1)
        legacyQuery = id ? legacyQuery.eq('id', id) : legacyQuery.eq('is_active', true)
        const legacy = await legacyQuery
        if (legacy.error) throw legacy.error
        data = legacy.data as Array<Record<string, unknown>> | null
      } else {
        throw result.error
      }
    } else {
      data = result.data as Array<Record<string, unknown>> | null
    }
  }
  const row = data?.[0] as Database['public']['Tables']['upcoming_timirit']['Row'] | undefined
  if (!row) return null
  const { data: mez } = await supabase.from('upcoming_mezmurs').select('*').eq('upcoming_timirit_id', row.id).order('order_index', { ascending: true })
  return {
    id: row.id, scheduledDate: row.scheduled_date,
    topicPreview: pickLocalized(row.topic_preview_en, row.topic_preview_am, row.topic_preview) ?? '',
    topicPreviewEn: trim(row.topic_preview_en) ?? trim(row.topic_preview),
    topicPreviewAm: trim(row.topic_preview_am),
    note: pickLocalized(row.note_en, row.note_am, row.note) ?? '',
    noteEn: trim(row.note_en) ?? trim(row.note),
    noteAm: trim(row.note_am),
    classSummary: pickLocalized(row.class_summary_en, row.class_summary_am, row.class_summary),
    classSummaryEn: trim(row.class_summary_en) ?? trim(row.class_summary),
    classSummaryAm: trim(row.class_summary_am),
    mainPoints: parseMainPoints(row.main_points),
    youtubeUrl: trim(row.youtube_url), audioUrl: trim(row.audio_url), audioTitle: trim(row.audio_title),
    keyVerse: trim(row.key_verse),
    organizerNote: trim(row.organizer_note),
    isActive: row.is_active ?? true, status: row.status === 'published' ? 'published' : 'draft',
    mezmurs: [
      {
        title: pickLocalized(mez?.[0]?.title_en, mez?.[0]?.title_am, mez?.[0]?.title) ?? '',
        titleEn: trim(mez?.[0]?.title_en) ?? trim(mez?.[0]?.title),
        titleAm: trim(mez?.[0]?.title_am),
        transliteration: trim(mez?.[0]?.transliteration),
        lyrics: trim(mez?.[0]?.lyrics),
        youtubeUrl: trim(mez?.[0]?.youtube_url),
        audioUrl: trim(mez?.[0]?.audio_url),
      },
      {
        title: pickLocalized(mez?.[1]?.title_en, mez?.[1]?.title_am, mez?.[1]?.title) ?? '',
        titleEn: trim(mez?.[1]?.title_en) ?? trim(mez?.[1]?.title),
        titleAm: trim(mez?.[1]?.title_am),
        transliteration: trim(mez?.[1]?.transliteration),
        lyrics: trim(mez?.[1]?.lyrics),
        youtubeUrl: trim(mez?.[1]?.youtube_url),
        audioUrl: trim(mez?.[1]?.audio_url),
      },
    ],
  }
}

export async function saveUpcomingTimirtEditor(data: UpcomingTimirtEditorInput): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const row: Database['public']['Tables']['upcoming_timirit']['Insert'] = {
    id: data.id, scheduled_date: data.scheduledDate,
    topic_preview: pickLocalized(data.topicPreviewEn, data.topicPreviewAm, data.topicPreview) ?? null,
    topic_preview_en: trim(data.topicPreviewEn) ?? null,
    topic_preview_am: trim(data.topicPreviewAm) ?? null,
    note: pickLocalized(data.noteEn, data.noteAm, data.note) ?? null,
    note_en: trim(data.noteEn) ?? null,
    note_am: trim(data.noteAm) ?? null,
    class_summary: pickLocalized(data.classSummaryEn, data.classSummaryAm, data.classSummary) ?? null,
    class_summary_en: trim(data.classSummaryEn) ?? null,
    class_summary_am: trim(data.classSummaryAm) ?? null,
    main_points: toMainPointsJson(data.mainPoints),
    youtube_url: trim(data.youtubeUrl) ?? null, audio_url: trim(data.audioUrl) ?? null, audio_title: trim(data.audioTitle) ?? null,
    key_verse: trim(data.keyVerse) ?? null,
    organizer_note: trim(data.organizerNote) ?? null,
    is_active: data.isActive, status: data.status,
  }
  let saved: { id: string } | null = null
  {
    const result = await supabase.from('upcoming_timirit').upsert(row).select('id').single()
    if (result.error) {
      if (shouldRetryWithLegacySelect(result.error, 'upcoming_timirit', 'main_points')) {
        const { main_points: _ignoredMainPoints, ...legacyRow } = row
        const legacyResult = await supabase.from('upcoming_timirit').upsert(legacyRow).select('id').single()
        throwSupabaseWriteError('upsert (legacy schema)', 'upcoming_timirit', legacyResult.error, legacyRow)
        saved = legacyResult.data
      } else {
        throwSupabaseWriteError('upsert', 'upcoming_timirit', result.error, row)
      }
    } else {
      saved = result.data
    }
  }
  if (!saved?.id) throw new Error('Supabase did not return upcoming_timirit id after upsert.')
  const { error: deleteUpcomingMezmursError } = await supabase.from('upcoming_mezmurs').delete().eq('upcoming_timirit_id', saved.id)
  throwSupabaseWriteError('delete by upcoming_timirit_id', 'upcoming_mezmurs', deleteUpcomingMezmursError, { upcoming_timirit_id: saved.id })
  const upcomingMezmurRows = data.mezmurs.map((m, i) => ({ upcoming_timirit_id: saved.id, order_index: i, title: pickLocalized(m.titleEn, m.titleAm, m.title) ?? '', title_en: trim(m.titleEn) ?? null, title_am: trim(m.titleAm) ?? null, transliteration: trim(m.transliteration) ?? null, lyrics: trim(m.lyrics) ?? null, youtube_url: trim(m.youtubeUrl) ?? null, audio_url: trim(m.audioUrl) ?? null }))
  const { error: insertUpcomingMezmursError } = await supabase.from('upcoming_mezmurs').insert(upcomingMezmurRows)
  throwSupabaseWriteError('insert', 'upcoming_mezmurs', insertUpcomingMezmursError, upcomingMezmurRows)
  if (row.status === 'published' && row.is_active) {
    const { error: deactivateOthersError } = await supabase.from('upcoming_timirit').update({ is_active: false }).neq('id', saved.id).eq('is_active', true)
    throwSupabaseWriteError('update deactivate others', 'upcoming_timirit', deactivateOthersError, { id: saved.id })
  }
  return saved.id
}

export async function setUpcomingTimiritActive(id: string, isActive: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (isActive) {
    const { error: deactivateOthersError } = await supabase.from('upcoming_timirit').update({ is_active: false }).neq('id', id).eq('is_active', true)
    throwSupabaseWriteError('update deactivate others', 'upcoming_timirit', deactivateOthersError, { id, isActive })
  }
  const payload = { is_active: isActive, status: isActive ? 'published' : 'draft' }
  const { error } = await supabase.from('upcoming_timirit').update(payload).eq('id', id)
  throwSupabaseWriteError('update status/active', 'upcoming_timirit', error, { id, ...payload })
}
export async function deactivateUpcomingTimirt(id?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  let q = supabase.from('upcoming_timirit').update({ is_active: false, status: 'draft' }).eq('is_active', true)
  if (id) q = q.eq('id', id)
  const { error } = await q
  throwSupabaseWriteError('deactivate', 'upcoming_timirit', error, { id })
}
export async function deleteUpcomingTimirt(id?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (id) {
    const { error } = await supabase.from('upcoming_timirit').delete().eq('id', id)
    throwSupabaseWriteError('delete by id', 'upcoming_timirit', error, { id })
    return
  }
  const { data } = await supabase.from('upcoming_timirit').select('id').eq('is_active', true).limit(1)
  const activeId = data?.[0]?.id
  if (!activeId) return
  const { error } = await supabase.from('upcoming_timirit').delete().eq('id', activeId)
  throwSupabaseWriteError('delete active', 'upcoming_timirit', error, { id: activeId })
}

export async function deleteWeeklyClass(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('weekly_classes').delete().eq('id', id)
  throwSupabaseWriteError('delete by id', 'weekly_classes', error, { id })
  invalidateCache()
}

export async function submitUserResponses(weeklyClassId: string, responses: Array<{ questionId: string; responseText?: string; selectedOptionIndex?: number; attendanceChoice?: AttendanceChoice }>, userFingerprint: string): Promise<void> {
  const current = JSON.parse(localStorage.getItem(RESPONSE_CACHE_KEY) ?? '[]') as Array<Record<string, unknown>>
  const kept = current.filter((item) => !(item.weeklyClassId === weeklyClassId && item.userFingerprint === userFingerprint))
  kept.push(...responses.map((r) => ({ ...r, weeklyClassId, userFingerprint, submittedAt: new Date().toISOString() })))
  localStorage.setItem(RESPONSE_CACHE_KEY, JSON.stringify(kept))
}

export async function getOrganizerAnalytics(): Promise<OrganizerSnapshot[]> { const weeks = await getWeeklyClasses(); return weeks.map((w, i) => ({ weekId: w.id, weekLabel: w.date, totalResponses: 0, reviewedOrWatched: 0, mostMissedQuestionId: w.questions[0]?.id ?? '', mostMissedQuestionLabel: w.questions[0]?.prompt ?? '', missRatePercent: 0, topUnclearTopics: [], languageDifficultyAvg: i % 2 === 0 ? 2.8 : 3.1 })) }
export async function getAttendanceSummary(_weekId: string): Promise<AttendanceSlice[]> { return [{ label: 'In person', value: 0, fill: '#5c7c6a' }, { label: 'Online', value: 0, fill: '#6b8cae' }, { label: 'Maybe', value: 0, fill: '#c6a24a' }, { label: 'Cannot attend', value: 0, fill: '#a89b8f' }] }
export async function getRecapSuggestions(_weekId: string): Promise<RecapSuggestion[]> { return [] }
export async function getWeeklyQuestionStats(weekId: string): Promise<WeeklyQuestionStatsReport | null> { const w = await getWeeklyClass(weekId); if (!w) return null; const qs: WeeklyQuestionStat[] = w.questions.filter((q) => q.type === 'multiple-choice').map((q) => ({ questionId: q.id, prompt: q.prompt, totalResponses: 0, correctResponses: 0, incorrectResponses: 0, percentCorrect: 0, percentIncorrect: 0, correctOptionIndex: q.correctIndex, correctOptionText: q.options[q.correctIndex]?.en ?? q.options[q.correctIndex]?.am ?? 'Correct answer', optionDistribution: q.options.map((o, i) => ({ optionIndex: i, optionText: o.en ?? o.am ?? `Option ${i + 1}`, responses: 0, percentage: 0 })) })); return { weekId, totalRespondents: 0, totalAnswersSubmitted: 0, averagePerformance: 0, mostMissedQuestionId: qs[0]?.questionId ?? null, mostMissedQuestionPrompt: qs[0]?.prompt ?? null, mostMissedQuestionMissRate: 0, questionStats: qs, commonWeakAreas: [] } }
