import type { Database } from './database.types'
import { supabase } from './supabase'
import type { UpcomingTimirtPreview } from '../data/mockUpcoming'
import type {
  AttendanceChoice,
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
  organizerNote?: string
  organizerNoteEn?: string
  organizerNoteAm?: string
  isActive: boolean
  status: 'draft' | 'published'
  mezmurs: [EditorMezmurInput, EditorMezmurInput]
}

export interface UpcomingTimirtListItem {
  id: string
  scheduledDate: string
  topicPreview: string
  note: string
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
const toStrings = (value: unknown) => (Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [])
const isFresh = () => Date.now() - weeklyClassesCacheTimestamp < CACHE_MS

const defaultAttendanceOptions = () => [
  { value: 'in-person' as const, label: 'In person' },
  { value: 'online' as const, label: 'Online' },
  { value: 'maybe' as const, label: 'Maybe' },
  { value: 'cannot-attend' as const, label: 'Cannot attend' },
]

type SupabaseErrorLike = {
  message: string
  details?: string | null
  hint?: string | null
  code?: string | null
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
  if (q.type === 'attendance') return { ...base, type: 'attendance', options: defaultAttendanceOptions() }
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
    lyrics: trim(x.lyrics), lyricsEn: trim(x.lyrics_en), lyricsAm: trim(x.lyrics_am),
    noteEn: trim(x.note_en), noteAm: trim(x.note_am), youtubeUrl: trim(x.youtube_url), audioUrl: trim(x.audio_url),
  }))
  return {
    id: row.id, date: row.date,
    topic: pickLocalized(row.topic_en, row.topic_am, row.topic) ?? '',
    topicEn: trim(row.topic_en), topicAm: trim(row.topic_am), speaker: trim(row.speaker) ?? '',
    amharicSummary: row.amharic_summary ?? '', englishSummary: row.english_summary ?? '',
    keyPoints: toStrings(row.key_points), verses: toStrings(row.verses),
    youtubeUrl: trim(row.youtube_url), audioUrl: trim(row.audio_url),
    audioTitle: pickLocalized(row.audio_title_en, row.audio_title_am, row.audio_title),
    audioTitleEn: trim(row.audio_title_en), audioTitleAm: trim(row.audio_title_am),
    audioNote: trim(row.audio_note), lessonMediaEnabled: row.lesson_media_enabled ?? true,
    teachingNotes: pickLocalized(row.teaching_notes_en, row.teaching_notes_am, row.teaching_notes),
    teachingNotesEn: trim(row.teaching_notes_en), teachingNotesAm: trim(row.teaching_notes_am),
    mezmurs: [m[0] ?? { title: '' }, m[1] ?? { title: '' }],
    questions,
    feedbackSummary: trim(row.feedback_summary),
  }
}

export function getCachedWeeklyClasses(): WeeklyClass[] | null {
  return weeklyClassesCache && isFresh() ? weeklyClassesCache : null
}

export async function getWeeklyClasses(): Promise<WeeklyClass[]> {
  if (weeklyClassesCache && isFresh()) return weeklyClassesCache
  if (!supabase) return []
  const { data: classRows, error } = await supabase.from('weekly_classes').select('*').order('date', { ascending: false })
  if (error) throw error
  const rows = classRows ?? []
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
  const { data, error } = await supabase.from('upcoming_timirit').select('*').eq('is_active', true).order('scheduled_date', { ascending: true }).limit(1)
  if (error) throw error
  const row = data?.[0]
  if (!row) return null
  const { data: mezmurs } = await supabase.from('upcoming_mezmurs').select('*').eq('upcoming_timirit_id', row.id).order('order_index', { ascending: true })
  return {
    scheduledDate: row.scheduled_date,
    topicPreview: pickLocalized(row.topic_preview_en, row.topic_preview_am, row.topic_preview) ?? '',
    topicPreviewEn: trim(row.topic_preview_en), topicPreviewAm: trim(row.topic_preview_am),
    note: pickLocalized(row.note_en, row.note_am, row.note) ?? '', noteEn: trim(row.note_en), noteAm: trim(row.note_am),
    lessonYoutubeUrl: trim(row.lesson_youtube_url), lessonAudioUrl: trim(row.lesson_audio_url),
    lessonAudioTitle: pickLocalized(row.lesson_audio_title_en, row.lesson_audio_title_am, row.lesson_audio_title),
    lessonAudioTitleEn: trim(row.lesson_audio_title_en), lessonAudioTitleAm: trim(row.lesson_audio_title_am),
    lessonNote: pickLocalized(row.lesson_note_en, row.lesson_note_am, row.lesson_note),
    lessonNoteEn: trim(row.lesson_note_en), lessonNoteAm: trim(row.lesson_note_am),
    weeklyKnowledgeContent: pickLocalized(row.weekly_knowledge_content_en, row.weekly_knowledge_content_am, row.weekly_knowledge_content),
    weeklyKnowledgeContentEn: trim(row.weekly_knowledge_content_en), weeklyKnowledgeContentAm: trim(row.weekly_knowledge_content_am),
    weeklyKnowledgeImageUrl: trim(row.weekly_knowledge_image_url),
    keyVerse: trim(row.key_verse),
    organizerNote: pickLocalized(row.organizer_note_en, row.organizer_note_am, row.organizer_note), organizerNoteEn: trim(row.organizer_note_en), organizerNoteAm: trim(row.organizer_note_am),
    status: row.status === 'published' ? 'published' : 'draft',
    mezmurs: [
      { title: pickLocalized(mezmurs?.[0]?.title_en, mezmurs?.[0]?.title_am, mezmurs?.[0]?.title) ?? '', titleEn: trim(mezmurs?.[0]?.title_en), titleAm: trim(mezmurs?.[0]?.title_am), transliteration: trim(mezmurs?.[0]?.transliteration), lyrics: trim(mezmurs?.[0]?.lyrics), youtubeUrl: trim(mezmurs?.[0]?.youtube_url), audioUrl: trim(mezmurs?.[0]?.audio_url) },
      { title: pickLocalized(mezmurs?.[1]?.title_en, mezmurs?.[1]?.title_am, mezmurs?.[1]?.title) ?? '', titleEn: trim(mezmurs?.[1]?.title_en), titleAm: trim(mezmurs?.[1]?.title_am), transliteration: trim(mezmurs?.[1]?.transliteration), lyrics: trim(mezmurs?.[1]?.lyrics), youtubeUrl: trim(mezmurs?.[1]?.youtube_url), audioUrl: trim(mezmurs?.[1]?.audio_url) },
    ],
  }
}

function mapKnowledge(row: WeeklyKnowledgeRow): WeeklyKnowledgeItem {
  return {
    id: row.id, title: pickLocalized(row.title_en, row.title_am, row.title) ?? '', titleEn: trim(row.title_en), titleAm: trim(row.title_am),
    subtitle: pickLocalized(row.subtitle_en, row.subtitle_am, row.subtitle), subtitleEn: trim(row.subtitle_en), subtitleAm: trim(row.subtitle_am),
    content: pickLocalized(row.content_en, row.content_am, row.content) ?? '', contentEn: trim(row.content_en), contentAm: trim(row.content_am),
    extraNote: pickLocalized(row.extra_note_en, row.extra_note_am, row.extra_note), extraNoteEn: trim(row.extra_note_en), extraNoteAm: trim(row.extra_note_am),
    imageUrl: trim(row.image_url), buttonText: trim(row.button_text), buttonTextEn: trim(row.button_text), buttonTextAm: undefined,
    buttonLink: trim(row.button_link),
    status: (trim(row.status) as WeeklyKnowledgeStatus) ?? 'draft', startDate: trim(row.start_date), endDate: trim(row.end_date),
    isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at,
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
    button_text: trim(input.buttonTextEn) ?? trim(input.buttonTextAm) ?? trim(input.buttonText) ?? null,
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

export async function saveWeeklyClassEditor(data: WeeklyClassEditorInput): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const id = trim(data.id) ?? data.date ?? crypto.randomUUID()
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
    key_points: data.keyPoints.map((x) => x.trim()).filter(Boolean), verses: data.verses.map((x) => x.trim()).filter(Boolean),
    youtube_url: trim(data.youtubeUrl) ?? null, audio_url: trim(data.audioUrl) ?? null,
    audio_title: trim(data.audioTitle) ?? null, audio_title_en: trim(data.audioTitleEn) ?? null, audio_title_am: trim(data.audioTitleAm) ?? null,
    audio_note: trim(data.audioNote) ?? null, lesson_media_enabled: data.lessonMediaEnabled ?? true,
    teaching_notes: trim(data.teachingNotes) ?? null, teaching_notes_en: trim(data.teachingNotesEn) ?? null, teaching_notes_am: trim(data.teachingNotesAm) ?? null,
    feedback_summary: trim(data.feedbackSummary) ?? null,
  }
  const { error } = await supabase.from('weekly_classes').upsert(row)
  assertNoError('upsert weekly_classes', error, { weeklyClassId: id, payload: row })

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
      lyrics_en: trim(m.lyricsEn) ?? null,
      lyrics_am: trim(m.lyricsAm) ?? null,
      note_en: trim(m.noteEn) ?? null,
      note_am: trim(m.noteAm) ?? null,
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

  const qRows = data.questions.map((q, i) => ({
    id: trim(q.id) ?? `${id}-q-${i + 1}`,
    weekly_class_id: id,
    type: q.type,
    order_index: i,
    prompt: trim(q.prompt) ?? null,
    prompt_en: trim(q.promptEn) ?? null,
    prompt_am: trim(q.promptAm) ?? null,
    helper_text: trim(q.helperText) ?? null,
    helper_text_en: trim(q.helperTextEn) ?? null,
    helper_text_am: trim(q.helperTextAm) ?? null,
    placeholder: trim(q.placeholder) ?? null,
    placeholder_en: trim(q.placeholderEn) ?? null,
    placeholder_am: trim(q.placeholderAm) ?? null,
    correct_index: q.type === 'multiple-choice' ? (q.correctIndex ?? 0) : null,
    explanation: trim(q.explanation) ?? null,
    explanation_en: trim(q.explanationEn) ?? null,
    explanation_am: trim(q.explanationAm) ?? null,
  }))
  if (qRows.length > 0) {
    const { error: qInsertError } = await supabase.from('questions').insert(qRows)
    assertNoError('insert questions', qInsertError, { weeklyClassId: id, payloadCount: qRows.length })
  }
  for (const [i, q] of data.questions.entries()) {
    if (q.type !== 'multiple-choice') continue
    const qid = trim(q.id) ?? `${id}-q-${i + 1}`
    const oRows = (q.options ?? []).map((o, oi) => ({ question_id: qid, option_index: oi, option_text: trim(o.en) ?? trim(o.am) ?? null, option_text_en: trim(o.en) ?? null, option_text_am: trim(o.am) ?? null }))
    if (oRows.length > 0) {
      const { error: optionsInsertError } = await supabase.from('multiple_choice_options').insert(oRows)
      assertNoError('insert multiple_choice_options', optionsInsertError, {
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
  return (data ?? []).map((r) => ({ id: r.id, scheduledDate: r.scheduled_date, topicPreview: pickLocalized(r.topic_preview_en, r.topic_preview_am, r.topic_preview) ?? '', note: pickLocalized(r.note_en, r.note_am, r.note) ?? '', isActive: r.is_active ?? false, status: r.status === 'published' ? 'published' : 'draft' }))
}

export const listActiveUpcomingTimirit = async () => (await listUpcomingTimiritForAdmin()).filter((x) => x.isActive)

export async function getUpcomingTimirtForAdmin(id?: string): Promise<UpcomingTimirtEditorInput | null> {
  if (!supabase) return null
  let query = supabase.from('upcoming_timirit').select('*').order('scheduled_date', { ascending: true }).limit(1)
  query = id ? query.eq('id', id) : query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  const row = data?.[0]; if (!row) return null
  const { data: mez } = await supabase.from('upcoming_mezmurs').select('*').eq('upcoming_timirit_id', row.id).order('order_index', { ascending: true })
  return {
    id: row.id, scheduledDate: row.scheduled_date,
    topicPreview: pickLocalized(row.topic_preview_en, row.topic_preview_am, row.topic_preview) ?? '', topicPreviewEn: trim(row.topic_preview_en), topicPreviewAm: trim(row.topic_preview_am),
    note: pickLocalized(row.note_en, row.note_am, row.note) ?? '', noteEn: trim(row.note_en), noteAm: trim(row.note_am),
    lessonYoutubeUrl: trim(row.lesson_youtube_url), lessonAudioUrl: trim(row.lesson_audio_url), lessonAudioTitle: pickLocalized(row.lesson_audio_title_en, row.lesson_audio_title_am, row.lesson_audio_title), lessonAudioTitleEn: trim(row.lesson_audio_title_en), lessonAudioTitleAm: trim(row.lesson_audio_title_am),
    lessonNote: pickLocalized(row.lesson_note_en, row.lesson_note_am, row.lesson_note), lessonNoteEn: trim(row.lesson_note_en), lessonNoteAm: trim(row.lesson_note_am),
    weeklyKnowledgeContent: pickLocalized(row.weekly_knowledge_content_en, row.weekly_knowledge_content_am, row.weekly_knowledge_content), weeklyKnowledgeContentEn: trim(row.weekly_knowledge_content_en), weeklyKnowledgeContentAm: trim(row.weekly_knowledge_content_am), weeklyKnowledgeImageUrl: trim(row.weekly_knowledge_image_url),
    keyVerse: trim(row.key_verse),
    organizerNote: pickLocalized(row.organizer_note_en, row.organizer_note_am, row.organizer_note), organizerNoteEn: trim(row.organizer_note_en), organizerNoteAm: trim(row.organizer_note_am),
    isActive: row.is_active ?? true, status: row.status === 'published' ? 'published' : 'draft',
    mezmurs: [
      { title: pickLocalized(mez?.[0]?.title_en, mez?.[0]?.title_am, mez?.[0]?.title) ?? '', titleEn: trim(mez?.[0]?.title_en), titleAm: trim(mez?.[0]?.title_am), transliteration: trim(mez?.[0]?.transliteration), lyrics: trim(mez?.[0]?.lyrics), youtubeUrl: trim(mez?.[0]?.youtube_url), audioUrl: trim(mez?.[0]?.audio_url) },
      { title: pickLocalized(mez?.[1]?.title_en, mez?.[1]?.title_am, mez?.[1]?.title) ?? '', titleEn: trim(mez?.[1]?.title_en), titleAm: trim(mez?.[1]?.title_am), transliteration: trim(mez?.[1]?.transliteration), lyrics: trim(mez?.[1]?.lyrics), youtubeUrl: trim(mez?.[1]?.youtube_url), audioUrl: trim(mez?.[1]?.audio_url) },
    ],
  }
}

export async function saveUpcomingTimirtEditor(data: UpcomingTimirtEditorInput): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const row: Database['public']['Tables']['upcoming_timirit']['Insert'] = {
    id: data.id, scheduled_date: data.scheduledDate,
    topic_preview: trim(data.topicPreview) ?? null, topic_preview_en: trim(data.topicPreviewEn) ?? null, topic_preview_am: trim(data.topicPreviewAm) ?? null,
    note: trim(data.note) ?? null, note_en: trim(data.noteEn) ?? null, note_am: trim(data.noteAm) ?? null,
    lesson_youtube_url: trim(data.lessonYoutubeUrl) ?? null, lesson_audio_url: trim(data.lessonAudioUrl) ?? null,
    lesson_audio_title: trim(data.lessonAudioTitle) ?? null, lesson_audio_title_en: trim(data.lessonAudioTitleEn) ?? null, lesson_audio_title_am: trim(data.lessonAudioTitleAm) ?? null,
    lesson_note: trim(data.lessonNote) ?? null, lesson_note_en: trim(data.lessonNoteEn) ?? null, lesson_note_am: trim(data.lessonNoteAm) ?? null,
    weekly_knowledge_content: trim(data.weeklyKnowledgeContent) ?? null, weekly_knowledge_content_en: trim(data.weeklyKnowledgeContentEn) ?? null, weekly_knowledge_content_am: trim(data.weeklyKnowledgeContentAm) ?? null,
    weekly_knowledge_image_url: trim(data.weeklyKnowledgeImageUrl) ?? null,
    key_verse: trim(data.keyVerse) ?? null,
    organizer_note: trim(data.organizerNote) ?? null, organizer_note_en: trim(data.organizerNoteEn) ?? null, organizer_note_am: trim(data.organizerNoteAm) ?? null,
    is_active: data.isActive, status: data.status,
  }
  const { data: saved, error } = await supabase.from('upcoming_timirit').upsert(row).select('id').single()
  throwSupabaseWriteError('upsert', 'upcoming_timirit', error, row)
  if (!saved?.id) throw new Error('Supabase did not return upcoming_timirit id after upsert.')
  const { error: deleteUpcomingMezmursError } = await supabase.from('upcoming_mezmurs').delete().eq('upcoming_timirit_id', saved.id)
  throwSupabaseWriteError('delete by upcoming_timirit_id', 'upcoming_mezmurs', deleteUpcomingMezmursError, { upcoming_timirit_id: saved.id })
  const upcomingMezmurRows = data.mezmurs.map((m, i) => ({ upcoming_timirit_id: saved.id, order_index: i, title: pickLocalized(m.titleEn, m.titleAm, m.title) ?? '', title_en: trim(m.titleEn) ?? null, title_am: trim(m.titleAm) ?? null, transliteration: trim(m.transliteration) ?? null, lyrics: trim(m.lyrics) ?? null, lyrics_en: trim(m.lyricsEn) ?? null, lyrics_am: trim(m.lyricsAm) ?? null, note_en: trim(m.noteEn) ?? null, note_am: trim(m.noteAm) ?? null, youtube_url: trim(m.youtubeUrl) ?? null, audio_url: trim(m.audioUrl) ?? null }))
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

export async function createWeeklyClass(data: Omit<WeeklyClass, 'questions' | 'mezmurs' | 'feedbackSummary'>): Promise<string> { return saveWeeklyClassEditor({ ...data, keyPoints: data.keyPoints ?? [], verses: data.verses ?? [], mezmurs: [{ title: '' }, { title: '' }], questions: [] }) }
export async function updateWeeklyClass(id: string, data: Partial<Omit<WeeklyClass, 'questions' | 'mezmurs' | 'id'>>): Promise<void> { const existing = await getWeeklyClass(id); if (!existing) return; await saveWeeklyClassEditor({ ...existing, ...data, id, keyPoints: data.keyPoints ?? existing.keyPoints, verses: data.verses ?? existing.verses ?? [], mezmurs: existing.mezmurs, questions: existing.questions as EditorQuestionInput[] }) }
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

export async function getOrganizerAnalytics(): Promise<OrganizerSnapshot[]> { const weeks = await getWeeklyClasses(); return weeks.map((w, i) => ({ weekId: w.id, weekLabel: w.date, totalResponses: 0, reviewedOrWatched: 0, mostMissedQuestionId: w.questions[0]?.id ?? '', mostMissedQuestionLabel: w.questions[0]?.prompt ?? '', missRatePercent: 0, topUnclearTopics: w.feedbackSummary ? [w.feedbackSummary] : [], languageDifficultyAvg: i % 2 === 0 ? 2.8 : 3.1 })) }
export async function getAttendanceSummary(_weekId: string): Promise<AttendanceSlice[]> { return [{ label: 'In person', value: 0, fill: '#5c7c6a' }, { label: 'Online', value: 0, fill: '#6b8cae' }, { label: 'Maybe', value: 0, fill: '#c6a24a' }, { label: 'Cannot attend', value: 0, fill: '#a89b8f' }] }
export async function getRecapSuggestions(weekId: string): Promise<RecapSuggestion[]> { const w = await getWeeklyClass(weekId); if (!w) return []; const s: RecapSuggestion[] = []; if (w.feedbackSummary) s.push({ title: 'Review feedback summary', detail: w.feedbackSummary }); return s }
export async function getWeeklyQuestionStats(weekId: string): Promise<WeeklyQuestionStatsReport | null> { const w = await getWeeklyClass(weekId); if (!w) return null; const qs: WeeklyQuestionStat[] = w.questions.filter((q) => q.type === 'multiple-choice').map((q) => ({ questionId: q.id, prompt: q.prompt, totalResponses: 0, correctResponses: 0, incorrectResponses: 0, percentCorrect: 0, percentIncorrect: 0, correctOptionIndex: q.correctIndex, correctOptionText: q.options[q.correctIndex]?.en ?? q.options[q.correctIndex]?.am ?? 'Correct answer', optionDistribution: q.options.map((o, i) => ({ optionIndex: i, optionText: o.en ?? o.am ?? `Option ${i + 1}`, responses: 0, percentage: 0 })) })); return { weekId, totalRespondents: 0, totalAnswersSubmitted: 0, averagePerformance: 0, mostMissedQuestionId: qs[0]?.questionId ?? null, mostMissedQuestionPrompt: qs[0]?.prompt ?? null, mostMissedQuestionMissRate: 0, questionStats: qs, commonWeakAreas: [] } }
