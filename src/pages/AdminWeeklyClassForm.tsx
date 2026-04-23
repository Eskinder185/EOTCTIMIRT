import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import type { AttendanceChoice, LocalizedText, Question, QuestionType } from '../data/types'
import { extractErrorDebugDetails, formatUnknownError } from '../lib/formatError'
import {
  coerceLocalizedText,
  compactLocalizedOptionsForSave,
  emptyLocalizedText,
  normalizeLocalizedText,
} from '../lib/localizedText'
import { getWeeklyClass, saveWeeklyClassEditor, type EditorQuestionInput, type WeeklyClassEditorInput } from '../lib/supabaseData'

type FormState = WeeklyClassEditorInput
type SupabaseDebugError = {
  operation?: string
  message?: string
  details?: string | null
  hint?: string | null
  code?: string | null
  context?: unknown
}

function migrateWeeklyClassFormState(form: WeeklyClassEditorInput): WeeklyClassEditorInput {
  return {
    ...form,
    questions: form.questions.map((q) => {
      const baseCommon = {
        ...q,
        promptEn: q.promptEn ?? '',
        promptAm: q.promptAm ?? '',
        helperTextEn: q.helperTextEn ?? '',
        helperTextAm: q.helperTextAm ?? '',
      }
      if (q.type === 'multiple-choice') {
        return {
          ...baseCommon,
          type: 'multiple-choice' as const,
          explanation: q.explanation ?? '',
          explanationEn: q.explanationEn ?? '',
          explanationAm: q.explanationAm ?? '',
          correctIndex: q.correctIndex ?? 0,
          options: (q.options ?? []).map((opt) => coerceLocalizedText(opt)),
        } satisfies EditorQuestionInput
      }
      if (q.type === 'attendance') {
        return {
          ...baseCommon,
          type: 'attendance' as const,
          attendanceOptions: q.attendanceOptions ?? defaultAttendanceOptions,
        } satisfies EditorQuestionInput
      }
      return {
        ...baseCommon,
        type: q.type,
        placeholder: q.placeholder ?? '',
        placeholderEn: q.placeholderEn ?? '',
        placeholderAm: q.placeholderAm ?? '',
      } satisfies EditorQuestionInput
    }),
  }
}

function questionFromDomain(question: Question): EditorQuestionInput {
  if (question.type === 'multiple-choice') {
    return {
      id: question.id,
      type: 'multiple-choice',
      prompt: question.prompt,
      promptEn: question.promptEn ?? '',
      promptAm: question.promptAm ?? '',
      helperText: question.helperText ?? '',
      helperTextEn: question.helperTextEn ?? '',
      helperTextAm: question.helperTextAm ?? '',
      explanation: question.explanation,
      explanationEn: question.explanationEn ?? '',
      explanationAm: question.explanationAm ?? '',
      correctIndex: question.correctIndex,
      options: question.options.map((opt) => coerceLocalizedText(opt)),
    }
  }
  if (question.type === 'attendance') {
    return {
      id: question.id,
      type: 'attendance',
      prompt: question.prompt,
      promptEn: question.promptEn ?? '',
      promptAm: question.promptAm ?? '',
      helperText: question.helperText ?? '',
      helperTextEn: question.helperTextEn ?? '',
      helperTextAm: question.helperTextAm ?? '',
      attendanceOptions: question.options.map((o) => ({
        value: o.value,
        label: o.label,
        labelEn: o.labelEn,
        labelAm: o.labelAm,
      })),
    }
  }
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    promptEn: question.promptEn ?? '',
    promptAm: question.promptAm ?? '',
    helperText: question.helperText ?? '',
    helperTextEn: question.helperTextEn ?? '',
    helperTextAm: question.helperTextAm ?? '',
    placeholder: question.placeholder ?? '',
    placeholderEn: question.placeholderEn ?? '',
    placeholderAm: question.placeholderAm ?? '',
  }
}

const defaultAttendanceOptions: Array<{
  value: AttendanceChoice
  label: string
  labelEn?: string
  labelAm?: string
}> = [
  { value: 'in-person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'cannot-attend', label: 'Cannot attend' },
]

function getNextTuesday() {
  const today = new Date()
  const daysUntilTuesday = (2 - today.getDay() + 7) % 7
  const nextTuesday = new Date(today)
  nextTuesday.setDate(today.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday))
  return nextTuesday.toISOString().split('T')[0]
}

function createEmptyQuestion(type: QuestionType): EditorQuestionInput {
  if (type === 'multiple-choice') {
    return {
      type,
      prompt: '',
      promptEn: '',
      promptAm: '',
      helperText: '',
      helperTextEn: '',
      helperTextAm: '',
      correctIndex: 0,
      explanation: '',
      explanationEn: '',
      explanationAm: '',
      options: [
        emptyLocalizedText(),
        emptyLocalizedText(),
        emptyLocalizedText(),
        emptyLocalizedText(),
      ],
    }
  }

  if (type === 'attendance') {
    return {
      type,
      prompt: '',
      promptEn: '',
      promptAm: '',
      helperText: '',
      helperTextEn: '',
      helperTextAm: '',
      attendanceOptions: defaultAttendanceOptions,
    }
  }

  return {
    type,
    prompt: '',
    promptEn: '',
    promptAm: '',
    helperText: '',
    helperTextEn: '',
    helperTextAm: '',
    placeholder: '',
    placeholderEn: '',
    placeholderAm: '',
  }
}

function createEmptyForm(): FormState {
  return {
    id: '',
    date: getNextTuesday(),
    topic: '',
    topicEn: '',
    topicAm: '',
    speaker: '',
    amharicSummary: '',
    englishSummary: '',
    youtubeUrl: '',
    audioUrl: '',
    audioTitle: '',
    audioNote: '',
    keyVerse: '',
    organizerNote: '',
    status: 'draft',
    mezmurs: [
      { title: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
      { title: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
    ],
    questions: [],
  }
}

function buildSoftWarnings(form: FormState): string[] {
  const warnings: string[] = []
  if (!form.topic?.trim() && !form.topicEn?.trim() && !form.topicAm?.trim()) {
    warnings.push('No topic added yet.')
  }
  if (!form.englishSummary?.trim() && !form.amharicSummary?.trim()) {
    warnings.push('Summaries are empty.')
  }
  if (!form.youtubeUrl?.trim() && !form.audioUrl?.trim()) {
    warnings.push('No lesson media link added yet.')
  }
  const hasSecondMezmur = Boolean(
    form.mezmurs[1]?.title?.trim() || form.mezmurs[1]?.titleEn?.trim() || form.mezmurs[1]?.titleAm?.trim(),
  )
  if (!hasSecondMezmur) {
    warnings.push('Second mezmur not filled yet.')
  }
  if (form.questions.length === 0) {
    warnings.push('No questions added yet.')
  }
  return warnings
}

export function AdminWeeklyClassForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const draftKey = useMemo(() => `admin-weekly-class-draft:${id ?? 'new'}`, [id])

  const [form, setForm] = useState<FormState>(createEmptyForm)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [devDiagnostics, setDevDiagnostics] = useState<{
    action: string
    validationRule?: string
    rawFormState?: unknown
    normalizedPayload?: unknown
    errorDetails?: unknown
  } | null>(null)

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey)

    if (!isEditing) {
      if (savedDraft) {
        setForm(migrateWeeklyClassFormState(JSON.parse(savedDraft) as FormState))
        setNotice('A local draft was restored on this device.')
      }
      return
    }

    if (!id) {
      return
    }

    const loadClass = async () => {
      try {
        setLoading(true)
        setError(null)
        const weeklyClass = await getWeeklyClass(id)

        if (!weeklyClass) {
          setError('This weekly Timirit could not be found.')
          return
        }

        const nextForm: FormState = {
          id: weeklyClass.id,
          date: weeklyClass.date,
          topic: weeklyClass.topic,
          topicEn: weeklyClass.topicEn || '',
          topicAm: weeklyClass.topicAm || '',
          speaker: weeklyClass.speaker,
          amharicSummary: weeklyClass.amharicSummary,
          englishSummary: weeklyClass.englishSummary,
          youtubeUrl: weeklyClass.youtubeUrl || '',
          audioUrl: weeklyClass.audioUrl || '',
          audioTitle: weeklyClass.audioTitle || '',
          audioNote: weeklyClass.audioNote || '',
          keyVerse: weeklyClass.keyVerse || '',
          organizerNote: weeklyClass.organizerNote || '',
          status: weeklyClass.status || 'draft',
          mezmurs: [
            {
              title: weeklyClass.mezmurs[0]?.title || '',
              titleEn: weeklyClass.mezmurs[0]?.titleEn || '',
              titleAm: weeklyClass.mezmurs[0]?.titleAm || '',
              transliteration: weeklyClass.mezmurs[0]?.transliteration || '',
              lyrics: weeklyClass.mezmurs[0]?.lyrics || '',
              youtubeUrl: weeklyClass.mezmurs[0]?.youtubeUrl || '',
              audioUrl: weeklyClass.mezmurs[0]?.audioUrl || '',
            },
            {
              title: weeklyClass.mezmurs[1]?.title || '',
              titleEn: weeklyClass.mezmurs[1]?.titleEn || '',
              titleAm: weeklyClass.mezmurs[1]?.titleAm || '',
              transliteration: weeklyClass.mezmurs[1]?.transliteration || '',
              lyrics: weeklyClass.mezmurs[1]?.lyrics || '',
              youtubeUrl: weeklyClass.mezmurs[1]?.youtubeUrl || '',
              audioUrl: weeklyClass.mezmurs[1]?.audioUrl || '',
            },
          ],
          questions: weeklyClass.questions.map(questionFromDomain),
        }

        if (savedDraft) {
          setForm(migrateWeeklyClassFormState(JSON.parse(savedDraft) as FormState))
          setNotice('A local draft override was restored for this week.')
        } else {
          setForm(nextForm)
        }
      } catch (loadError) {
        if (import.meta.env.DEV) {
          console.error('[AdminWeeklyClassForm] load failed', loadError)
        }
        setError(`The weekly editor could not be loaded. ${formatUnknownError(loadError)}`)
      } finally {
        setLoading(false)
      }
    }

    loadClass()
  }, [draftKey, id, isEditing])

  const updateQuestion = (index: number, nextQuestion: EditorQuestionInput) => {
    setForm((current) => {
      const questions = [...current.questions]
      questions[index] = nextQuestion
      return { ...current, questions }
    })
  }

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.questions.length) {
        return current
      }

      const questions = [...current.questions]
      const [question] = questions.splice(index, 1)
      questions.splice(nextIndex, 0, question)
      return { ...current, questions }
    })
  }

  const saveDraft = async () => {
    const action = isEditing ? 'save_draft_update' : 'save_draft_create'
    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      const normalized: WeeklyClassEditorInput = {
        ...form,
        id: form.id.trim() || form.date || crypto.randomUUID(),
        topic: form.topic?.trim() || form.topicEn?.trim() || form.topicAm?.trim() || '',
        topicEn: form.topicEn?.trim() || undefined,
        topicAm: form.topicAm?.trim() || undefined,
        englishSummary: form.englishSummary?.trim() || '',
        amharicSummary: form.amharicSummary?.trim() || '',
        speaker: form.speaker?.trim() || '',
        keyVerse: form.keyVerse?.trim() || undefined,
        organizerNote: form.organizerNote?.trim() || undefined,
        status: 'draft',
        questions: form.questions,
      }
      if (import.meta.env.DEV) {
        setDevDiagnostics({ action, rawFormState: structuredClone(form), normalizedPayload: structuredClone(normalized) })
      }
      const savedId = await saveWeeklyClassEditor(normalized)
      setForm((current) => ({ ...current, id: savedId, status: 'draft' }))
      localStorage.setItem(draftKey, JSON.stringify({ ...form, id: savedId, status: 'draft' }))
      setNotice('Draft saved to backend and on this device.')
    } catch (saveError) {
      const supabaseDebug = (
        saveError as { supabase?: SupabaseDebugError; message?: string; details?: string; hint?: string; code?: string }
      )?.supabase ?? {
        message: (saveError as { message?: string })?.message,
        details: (saveError as { details?: string })?.details,
        hint: (saveError as { hint?: string })?.hint,
        code: (saveError as { code?: string })?.code,
      }
      if (import.meta.env.DEV) {
        setDevDiagnostics((current) => ({
          action,
          validationRule: current?.validationRule,
          normalizedPayload: current?.normalizedPayload,
          errorDetails: {
            ...extractErrorDebugDetails(saveError),
            supabase: supabaseDebug,
          },
        }))
      }
      const human = formatUnknownError(saveError)
      setError(
        import.meta.env.DEV
          ? [
              human,
              supabaseDebug?.operation ? `Operation: ${supabaseDebug.operation}` : null,
              supabaseDebug?.code ? `Code: ${supabaseDebug.code}` : null,
              supabaseDebug?.message ? `Message: ${supabaseDebug.message}` : null,
              supabaseDebug?.details ? `Details: ${supabaseDebug.details}` : null,
              supabaseDebug?.hint ? `Hint: ${supabaseDebug.hint}` : null,
            ]
              .filter(Boolean)
              .join('\n')
          : human,
      )
    } finally {
      setSaving(false)
    }
  }

  const publishUpdate = async () => {
    const action = isEditing ? 'publish_update' : 'publish_create'
    try {
      setSaving(true)
      setError(null)
      setNotice(null)

      const normalized: WeeklyClassEditorInput = {
        ...form,
        id: form.id.trim() || form.date || crypto.randomUUID(),
        topic: form.topic?.trim() || form.topicEn?.trim() || form.topicAm?.trim() || '',
        topicEn: form.topicEn?.trim() || undefined,
        topicAm: form.topicAm?.trim() || undefined,
        englishSummary: form.englishSummary?.trim() || '',
        amharicSummary: form.amharicSummary?.trim() || '',
        speaker: form.speaker?.trim() || '',
        audioTitle: form.audioTitle?.trim() || undefined,
        audioNote: form.audioNote?.trim() || undefined,
        keyVerse: form.keyVerse?.trim() || undefined,
        organizerNote: form.organizerNote?.trim() || undefined,
        status: 'published',
        questions: form.questions.map((question) => {
            if (question.type === 'multiple-choice') {
              const rawOptions = (question.options ?? []).map((opt) => ({
                ...emptyLocalizedText(),
                ...opt,
              }))
              const { options: compacted, correctIndex: nextCorrect } = compactLocalizedOptionsForSave(
                rawOptions,
                question.correctIndex ?? 0,
              )
              return {
                ...question,
                options: compacted.map((opt) => normalizeLocalizedText(opt)),
                correctIndex: nextCorrect,
                prompt: question.prompt?.trim() || '',
                promptEn: question.promptEn?.trim() || undefined,
                promptAm: question.promptAm?.trim() || undefined,
                helperText: question.helperText?.trim() || undefined,
                helperTextEn: question.helperTextEn?.trim() || undefined,
                helperTextAm: question.helperTextAm?.trim() || undefined,
                explanation: question.explanation?.trim() || '',
                explanationEn: question.explanationEn?.trim() || undefined,
                explanationAm: question.explanationAm?.trim() || undefined,
              }
            }

            if (question.type === 'attendance') {
              return {
                ...question,
                prompt: question.prompt?.trim() || '',
                promptEn: question.promptEn?.trim() || undefined,
                promptAm: question.promptAm?.trim() || undefined,
                helperText: question.helperText?.trim() || undefined,
                helperTextEn: question.helperTextEn?.trim() || undefined,
                helperTextAm: question.helperTextAm?.trim() || undefined,
                attendanceOptions: (question.attendanceOptions ?? defaultAttendanceOptions).map((option) => ({
                  value: option.value,
                  label: option.label.trim(),
                  labelEn: option.labelEn?.trim() || undefined,
                  labelAm: option.labelAm?.trim() || undefined,
                })),
              }
            }

            return {
              ...question,
              prompt: question.prompt?.trim() || '',
              promptEn: question.promptEn?.trim() || undefined,
              promptAm: question.promptAm?.trim() || undefined,
              helperText: question.helperText?.trim() || undefined,
              helperTextEn: question.helperTextEn?.trim() || undefined,
              helperTextAm: question.helperTextAm?.trim() || undefined,
              placeholder: question.placeholder?.trim() || undefined,
              placeholderEn: question.placeholderEn?.trim() || undefined,
              placeholderAm: question.placeholderAm?.trim() || undefined,
            }
          }),
      }

      if (import.meta.env.DEV) {
        console.info('[AdminWeeklyClassForm] publish → saveWeeklyClassEditor', structuredClone(normalized))
        setDevDiagnostics({ action, rawFormState: structuredClone(form), normalizedPayload: structuredClone(normalized) })
      }

      const savedId = await saveWeeklyClassEditor(normalized)
      setForm((current) => ({ ...current, id: savedId, status: 'published' }))
      localStorage.removeItem(draftKey)
      const warnings = buildSoftWarnings(form)
      if (warnings.length > 0) {
        setNotice(`Published with optional fields still empty: ${warnings.join(' ')}`)
      }
      navigate(`/admin/weekly-classes/${savedId}`)
    } catch (publishError) {
      const supabaseDebug = (
        publishError as { supabase?: SupabaseDebugError; message?: string; details?: string; hint?: string; code?: string }
      )?.supabase ?? {
        message: (publishError as { message?: string })?.message,
        details: (publishError as { details?: string })?.details,
        hint: (publishError as { hint?: string })?.hint,
        code: (publishError as { code?: string })?.code,
      }

      if (import.meta.env.DEV) {
        console.error('[AdminWeeklyClassForm] publish failed', publishError)
        console.error('[AdminWeeklyClassForm] Supabase publish debug', {
          message: supabaseDebug?.message,
          details: supabaseDebug?.details,
          hint: supabaseDebug?.hint,
          code: supabaseDebug?.code,
          operation: supabaseDebug?.operation,
          context: supabaseDebug?.context,
          fullError: publishError,
        })
        setDevDiagnostics((current) => ({
          action,
          validationRule: current?.validationRule,
          normalizedPayload: current?.normalizedPayload,
          errorDetails: {
            ...extractErrorDebugDetails(publishError),
            supabase: supabaseDebug,
          },
        }))
      }
      const human = formatUnknownError(publishError)
      setError(
        import.meta.env.DEV
          ? [
              human,
              supabaseDebug?.operation ? `Operation: ${supabaseDebug.operation}` : null,
              supabaseDebug?.code ? `Code: ${supabaseDebug.code}` : null,
              supabaseDebug?.message ? `Message: ${supabaseDebug.message}` : null,
              supabaseDebug?.details ? `Details: ${supabaseDebug.details}` : null,
              supabaseDebug?.hint ? `Hint: ${supabaseDebug.hint}` : null,
            ]
              .filter(Boolean)
              .join('\n')
          : human,
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-accent-600"></div>
        <p className="text-sm text-brand-700">Loading the weekly editor...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Organizer editor</p>
        <h1 className="text-2xl font-bold text-brand-900">
          {isEditing ? 'Edit weekly Timirit' : 'Create weekly Timirit'}
        </h1>
        <p className="text-sm leading-relaxed text-brand-700">
          Prepare the parish teaching page, the two weekly mezmurs, and the follow-up questions in one place.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm wrap-break-word text-red-700">{error}</div>
      ) : null}
      {notice ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</div> : null}
      {import.meta.env.DEV && devDiagnostics ? (
        <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-800">
          <p className="font-semibold">Dev diagnostics</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(devDiagnostics, null, 2)}</pre>
        </div>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">1. Weekly class form</h2>
        <p className="mt-1 text-xs text-brand-600">All fields are optional. Fill only what is ready this week.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">Class ID
            <input type="text" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="2026-04-22" />
          </label>
          <label className="text-sm font-medium text-brand-900">Date
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
          </label>
          <label className="text-sm font-medium text-brand-900">Speaker <span className="font-normal text-brand-500">(optional)</span>
            <input type="text" value={form.speaker} onChange={(event) => setForm({ ...form, speaker: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Dn. Daniel T., Memhir Kidan, Fr. Michael Z." />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">Topic — English <span className="font-normal text-brand-500">(optional if other filled)</span>
            <input type="text" value={form.topicEn || ''} onChange={(event) => setForm({ ...form, topicEn: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Theosis through liturgical life" />
          </label>
          <label className="text-sm font-medium text-brand-900">Topic — Amharic <span className="font-normal text-brand-500">(optional)</span>
            <input type="text" value={form.topicAm || ''} onChange={(event) => setForm({ ...form, topicAm: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">YouTube replay link <span className="font-normal text-brand-500">(optional)</span>
          <input type="url" value={form.youtubeUrl || ''} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="https://www.youtube.com/watch?v=..." />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">Audio lesson link <span className="font-normal text-brand-500">(optional)</span>
            <input type="url" value={form.audioUrl || ''} onChange={(event) => setForm({ ...form, audioUrl: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="https://example.com/lesson.mp3" />
          </label>
        </div>
        <label className="mt-3 block text-sm font-medium text-brand-900">Audio title <span className="font-normal text-brand-500">(optional)</span>
          <input type="text" value={form.audioTitle || ''} onChange={(event) => setForm({ ...form, audioTitle: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Week 12 audio lesson" />
        </label>
        <label className="mt-3 block text-sm font-medium text-brand-900">Audio note <span className="font-normal text-brand-500">(optional)</span>
          <textarea value={form.audioNote || ''} onChange={(event) => setForm({ ...form, audioNote: event.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">Amharic summary <span className="font-normal text-brand-500">(optional)</span>
          <textarea value={form.amharicSummary} onChange={(event) => setForm({ ...form, amharicSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">English summary <span className="font-normal text-brand-500">(optional)</span>
          <textarea value={form.englishSummary} onChange={(event) => setForm({ ...form, englishSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">Key verse <span className="font-normal text-brand-500">(optional)</span>
            <input type="text" value={form.keyVerse || ''} onChange={(event) => setForm({ ...form, keyVerse: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="John 3:16" />
          </label>
          <label className="text-sm font-medium text-brand-900">Status
            <input type="text" value={form.status === 'published' ? 'published' : 'draft'} readOnly className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 text-base text-brand-700 outline-none" />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">Organizer note <span className="font-normal text-brand-500">(optional)</span>
          <textarea value={form.organizerNote || ''} onChange={(event) => setForm({ ...form, organizerNote: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">2. Weekly mezmurs form</h2>
        <div className="mt-4 space-y-4">
          {form.mezmurs.map((mezmur, index) => (
            <div key={`mezmur-${index}`} className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <h3 className="text-base font-semibold text-brand-900">Mezmur {index + 1}</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-brand-900">Title — English <span className="font-normal text-brand-500">(optional)</span>
                  <input type="text" value={mezmur.titleEn || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, titleEn: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                </label>
                <label className="text-sm font-medium text-brand-900">Title — Amharic <span className="font-normal text-brand-500">(optional)</span>
                  <input type="text" value={mezmur.titleAm || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, titleAm: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium text-brand-900">Transliteration <span className="font-normal text-brand-500">(optional)</span>
                <input type="text" value={mezmur.transliteration || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, transliteration: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
              </label>
              <input type="url" value={mezmur.youtubeUrl || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, youtubeUrl: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-4 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="YouTube (optional)" />
              <input type="url" value={mezmur.audioUrl || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, audioUrl: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-4 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Audio link (optional)" />
              <textarea value={mezmur.lyrics || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, lyrics: event.target.value }; setForm({ ...form, mezmurs }) }} rows={4} className="mt-4 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Mezmur lyrics" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">3. Weekly questions form</h2>
            <p className="text-sm text-brand-700">Add, arrange, and refine the follow-up questions for the parish.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(['multiple-choice', 'short-answer', 'reflection', 'feedback-open'] as QuestionType[]).map((type) => (
              <button key={type} type="button" onClick={() => setForm({ ...form, questions: [...form.questions, createEmptyQuestion(type)] })} className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900 shadow-sm">Add {type}</button>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {form.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-sm text-brand-700">No questions yet. Add the ones needed for recap, reflection, attendance, or clarification.</div>
          ) : (
            form.questions.map((question, index) => (
              <div key={question.id ?? `question-${index}`} className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Question {index + 1}</p>
                    <p className="text-sm font-medium text-brand-900">{question.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moveQuestion(index, -1)} className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900">Up</button>
                    <button type="button" onClick={() => moveQuestion(index, 1)} className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900">Down</button>
                    <button type="button" onClick={() => setForm({ ...form, questions: form.questions.filter((_, questionIndex) => questionIndex !== index) })} className="min-h-11 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700">Remove</button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-brand-900">Question ID
                    <input type="text" value={question.id || ''} onChange={(event) => updateQuestion(index, { ...question, id: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder={`${form.id || form.date}-q-1`} />
                  </label>
                  <label className="text-sm font-medium text-brand-900">Question type
                    <select value={question.type} onChange={(event) => updateQuestion(index, { ...createEmptyQuestion(event.target.value as QuestionType), id: question.id })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30">
                      <option value="multiple-choice">multiple-choice</option>
                      <option value="short-answer">short-answer</option>
                      <option value="reflection">reflection</option>
                      <option value="feedback-open">feedback-open</option>
                    </select>
                  </label>
                </div>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-600">Question text</p>
                <div className="mt-1 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-brand-900">Prompt — English <span className="font-normal text-brand-500">(optional)</span>
                    <textarea value={question.promptEn || ''} onChange={(event) => updateQuestion(index, { ...question, promptEn: event.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                  </label>
                  <label className="text-sm font-medium text-brand-900">Prompt — Amharic <span className="font-normal text-brand-500">(optional)</span>
                    <textarea value={question.promptAm || ''} onChange={(event) => updateQuestion(index, { ...question, promptAm: event.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                  </label>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">Helper text <span className="font-normal text-brand-500">(optional)</span></p>
                <div className="mt-1 grid gap-3 sm:grid-cols-2">
                  <textarea value={question.helperTextEn || ''} onChange={(event) => updateQuestion(index, { ...question, helperTextEn: event.target.value })} rows={2} className="w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="English" />
                  <textarea value={question.helperTextAm || ''} onChange={(event) => updateQuestion(index, { ...question, helperTextAm: event.target.value })} rows={2} className="w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Amharic" />
                </div>

                {question.type === 'multiple-choice' ? (
                  <div className="mt-4 space-y-4">
                    <p className="text-xs text-brand-600">
                      Each choice can use English only, Amharic only, both, or stay empty while drafting.
                    </p>
                    {(question.options ?? []).map((option, optionIndex) => (
                      <div key={`option-${optionIndex}`} className="space-y-2 rounded-xl border border-brand-100 bg-white/80 p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-medium text-brand-900">
                            English
                            <input
                              type="text"
                              value={option.en ?? ''}
                              onChange={(event) => {
                                const options: LocalizedText[] = [...(question.options ?? [])]
                                const base = { ...emptyLocalizedText(), ...options[optionIndex] }
                                options[optionIndex] = { ...base, en: event.target.value }
                                updateQuestion(index, { ...question, options })
                              }}
                              className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                              placeholder={`Choice ${optionIndex + 1} (English)`}
                            />
                          </label>
                          <label className="text-sm font-medium text-brand-900">
                            Amharic
                            <input
                              type="text"
                              value={option.am ?? ''}
                              onChange={(event) => {
                                const options: LocalizedText[] = [...(question.options ?? [])]
                                const base = { ...emptyLocalizedText(), ...options[optionIndex] }
                                options[optionIndex] = { ...base, am: event.target.value }
                                updateQuestion(index, { ...question, options })
                              }}
                              className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                              placeholder={`Choice ${optionIndex + 1} (Amharic)`}
                            />
                          </label>
                        </div>
                        <label className="flex min-h-11 items-center gap-2 text-sm text-brand-800">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={(question.correctIndex ?? 0) === optionIndex}
                            onChange={() => updateQuestion(index, { ...question, correctIndex: optionIndex })}
                          />
                          Correct answer
                        </label>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateQuestion(index, { ...question, options: [...(question.options ?? []), emptyLocalizedText()] })} className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900">Add choice</button>
                      {(question.options?.length ?? 0) > 2 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = (question.options ?? []).slice(0, -1)
                            const maxIdx = Math.max(0, next.length - 1)
                            updateQuestion(index, {
                              ...question,
                              options: next,
                              correctIndex: Math.min(question.correctIndex ?? 0, maxIdx),
                            })
                          }}
                          className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900"
                        >
                          Remove last choice
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Explanation <span className="font-normal text-brand-500">(optional)</span></p>
                    <div className="mt-1 grid gap-3 sm:grid-cols-2">
                      <textarea value={question.explanationEn || ''} onChange={(event) => updateQuestion(index, { ...question, explanationEn: event.target.value })} rows={3} className="w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="English" />
                      <textarea value={question.explanationAm || ''} onChange={(event) => updateQuestion(index, { ...question, explanationAm: event.target.value })} rows={3} className="w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Amharic" />
                    </div>
                  </div>
                ) : null}

                {question.type === 'attendance' ? (
                  <div className="mt-4 space-y-3">
                    {(question.attendanceOptions ?? defaultAttendanceOptions).map((option, optionIndex) => (
                      <div key={option.value} className="grid gap-2 sm:grid-cols-2">
                        <input type="text" value={option.value} readOnly className="min-h-12 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 text-base text-brand-700 outline-none" />
                        <input type="text" value={option.label} onChange={(event) => { const attendanceOptions = [...(question.attendanceOptions ?? defaultAttendanceOptions)]; attendanceOptions[optionIndex] = { ...option, label: event.target.value }; updateQuestion(index, { ...question, attendanceOptions }) }} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {question.type !== 'multiple-choice' && question.type !== 'attendance' ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Response placeholder <span className="font-normal text-brand-500">(optional)</span></p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input type="text" value={question.placeholderEn || ''} onChange={(event) => updateQuestion(index, { ...question, placeholderEn: event.target.value })} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="English" />
                      <input type="text" value={question.placeholderAm || ''} onChange={(event) => updateQuestion(index, { ...question, placeholderAm: event.target.value })} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Amharic" />
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">5. Publish / save flow</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">Drafts are saved on this device for working sessions. Publishing updates the local organizer repository used by the public site.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving}>Save as draft</Button>
          <Link to="/admin/weekly-classes" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-base font-semibold text-brand-900 shadow-sm">Back to previous weeks</Link>
          <Button type="button" onClick={publishUpdate} disabled={saving}>{saving ? 'Publishing...' : isEditing ? 'Publish update' : 'Publish weekly class'}</Button>
        </div>
      </section>
    </div>
  )
}