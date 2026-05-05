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
import { useUiLanguage } from '../contexts/LanguageContext'

type FormState = WeeklyClassEditorInput
type SupabaseDebugError = {
  operation?: string
  message?: string
  details?: string | null
  hint?: string | null
  code?: string | null
  context?: unknown
}

function toMainPointSlots(points?: Array<{ en?: string; am?: string }>) {
  return Array.from({ length: 4 }, (_, index) => ({
    en: points?.[index]?.en ?? '',
    am: points?.[index]?.am ?? '',
  }))
}

function migrateWeeklyClassFormState(form: WeeklyClassEditorInput): WeeklyClassEditorInput {
  return {
    ...form,
    mainPoints: toMainPointSlots(form.mainPoints),
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
          attendanceOptions: (q.attendanceOptions ?? defaultAttendanceOptions).map((o) => ({
            ...o,
            labelEn: o.labelEn ?? o.label,
            labelAm: o.labelAm ?? '',
          })),
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
        labelEn: o.labelEn ?? o.label,
        labelAm: o.labelAm ?? '',
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
  { value: 'in-person', label: 'In person', labelEn: 'In person', labelAm: '' },
  { value: 'online', label: 'Online', labelEn: 'Online', labelAm: '' },
  { value: 'maybe', label: 'Maybe', labelEn: 'Maybe', labelAm: '' },
  { value: 'cannot-attend', label: 'Cannot attend', labelEn: 'Cannot attend', labelAm: '' },
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
    mainPoints: toMainPointSlots(),
    youtubeUrl: '',
    audioUrl: '',
    audioTitle: '',
    audioNote: '',
    keyVerse: '',
    organizerNote: '',
    advancedPracticeUrl: '',
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
    warnings.push('Short summary is empty.')
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
  const { language } = useUiLanguage()
  const isAm = language === 'am'
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

  const addQuestionButtonLabel = (type: QuestionType) => {
    if (isAm) {
      switch (type) {
        case 'multiple-choice':
          return 'ባለብዙ ምርጫ ያክሉ'
        case 'short-answer':
          return 'አጭር መልስ ያክሉ'
        case 'reflection':
          return 'የማሰላሰል ጥያቄ ያክሉ'
        case 'feedback-open':
          return 'ክፍት ግብረ መልስ ያክሉ'
        case 'attendance':
          return 'መገኘት ያክሉ'
        default:
          return type
      }
    }
    switch (type) {
      case 'multiple-choice':
        return 'Add Multiple-Choice'
      case 'short-answer':
        return 'Add Short-Answer'
      case 'reflection':
        return 'Add Reflection'
      case 'feedback-open':
        return 'Add Open Feedback'
      case 'attendance':
        return 'Add Attendance'
      default:
        return type
    }
  }

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
          setError(isAm ? 'ይህ ሳምንታዊ ትምህርት አልተገኘም።' : 'This weekly Timirt could not be found.')
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
          mainPoints: toMainPointSlots(weeklyClass.mainPoints),
          youtubeUrl: weeklyClass.youtubeUrl || '',
          audioUrl: weeklyClass.audioUrl || '',
          audioTitle: weeklyClass.audioTitle || '',
          audioNote: weeklyClass.audioNote || '',
          keyVerse: weeklyClass.keyVerse || '',
          organizerNote: weeklyClass.organizerNote || '',
          advancedPracticeUrl: weeklyClass.advancedPracticeUrl || '',
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
  }, [draftKey, id, isEditing, isAm])

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
                attendanceOptions: (question.attendanceOptions ?? defaultAttendanceOptions).map((option) => {
                  const labelEn = option.labelEn?.trim() || option.label?.trim() || ''
                  const labelAm = option.labelAm?.trim() || ''
                  const merged = labelEn || labelAm ? `${labelEn}${labelEn && labelAm ? ' · ' : ''}${labelAm}` : option.label.trim()
                  return {
                    value: option.value,
                    label: merged || option.label.trim(),
                    labelEn: labelEn || undefined,
                    labelAm: labelAm || undefined,
                  }
                }),
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
        <p className="text-sm text-brand-700">
          {isAm ? 'ሳምንታዊ አርታዒ በመጫን ላይ...' : 'Loading the weekly editor...'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? 'የአደራጅ አርታዒ' : 'Organizer Editor'}
        </p>
        <h1 className="text-2xl font-bold text-brand-900">
          {isEditing
            ? isAm
              ? 'ሳምንታዊ ትምህርት ያርትሉ'
              : 'Edit Weekly Timirt'
            : isAm
              ? 'ሳምንታዊ ትምህርት ይፍጠሩ'
              : 'Create Weekly Timirt'}
        </h1>
        <p className="text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'የፓሪሽ ትምህርት ገጹን፣ ሁለቱን የሳምንቱ መዝሙሮች እና የተከታታይ ጥያቄዎችን በአንድ ቦታ ያዘጋጁ።'
            : 'Prepare the parish teaching page, the two weekly mezmurs, and the follow-up questions in one place.'}
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
        <h2 className="text-lg font-semibold text-brand-900">{isAm ? '1. ሳምንታዊ ክፍል ቅጽ' : '1. Weekly Class Form'}</h2>
        <p className="mt-1 text-xs text-brand-600">
          {isAm ? 'ሁሉም መስኮች አማራጭ ናቸው። በዚህ ሳምንት ዝግጁ የሆነውን ብቻ ያስገቡ።' : 'All fields are optional. Fill in only what is ready this week.'}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የክፍል መለያ' : 'Class ID'}
            <input type="text" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="2026-04-22" />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ቀን' : 'Date'}
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ተናጋሪ (አማራጭ)' : 'Speaker (optional)'}
            <input type="text" value={form.speaker} onChange={(event) => setForm({ ...form, speaker: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Dn. Daniel T., Memhir Kidan, Fr. Michael Z." />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ርእስ — እንግሊዝኛ (ሌሎች መስኮች ከተሞሉ አማራጭ)' : 'Topic — English (optional if other fields are filled)'}
            <input type="text" value={form.topicEn || ''} onChange={(event) => setForm({ ...form, topicEn: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Theosis through liturgical life" />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ርእስ — አማርኛ (አማራጭ)' : 'Topic — Amharic (optional)'}
            <input type="text" value={form.topicAm || ''} onChange={(event) => setForm({ ...form, topicAm: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'የዩቲዩብ የድጋሚ እይታ አገናኝ (አማራጭ)' : 'YouTube Replay Link (optional)'}
          <input type="url" value={form.youtubeUrl || ''} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="https://www.youtube.com/watch?v=..." />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የድምጽ ትምህርት አገናኝ (አማራጭ)' : 'Audio Lesson Link (optional)'}
            <input type="url" value={form.audioUrl || ''} onChange={(event) => setForm({ ...form, audioUrl: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="https://example.com/lesson.mp3" />
          </label>
        </div>
        <label className="mt-3 block text-sm font-medium text-brand-900">
          {isAm ? 'የድምጽ ርእስ (አማራጭ)' : 'Audio Title (optional)'}
          <input type="text" value={form.audioTitle || ''} onChange={(event) => setForm({ ...form, audioTitle: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Week 12 audio lesson" />
        </label>
        <label className="mt-3 block text-sm font-medium text-brand-900">
          {isAm ? 'የድምጽ ማስታወሻ (አማራጭ)' : 'Audio Note (optional)'}
          <textarea value={form.audioNote || ''} onChange={(event) => setForm({ ...form, audioNote: event.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'አጭር ማጠቃለያ (አማርኛ) (አማራጭ፣ 2–4 መስመሮች)' : 'Short Summary (Amharic) (optional, 2–4 lines)'}
          <textarea value={form.amharicSummary} onChange={(event) => setForm({ ...form, amharicSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'አጭር ማጠቃለያ (እንግሊዝኛ) (አማራጭ፣ 2–4 መስመሮች)' : 'Short Summary (English) (optional, 2–4 lines)'}
          <textarea value={form.englishSummary} onChange={(event) => setForm({ ...form, englishSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {isAm ? 'ዋና ነጥቦች (እስከ 4፣ አማራጭ)' : 'Main Points (up to 4, optional)'}
          </h3>
          <p className="mt-1 text-xs text-brand-700">
            {isAm
              ? 'የእንግሊዝኛና የአማርኛ ድብልቅ ማስገባት ይችላሉ። በዚህ ሳምንት የማያስፈልጉዎትን ነጥቦች ባዶ ይተዉ።'
              : 'Add any mix of English and Amharic. Leave blank any points you do not need this week.'}
          </p>
          <div className="mt-3 space-y-3">
            {toMainPointSlots(form.mainPoints).map((point, index) => (
              <div key={`weekly-main-point-${index}`} className="rounded-xl border border-brand-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {isAm ? `ዋና ነጥብ ${index + 1}` : `Main Point ${index + 1}`}
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-brand-900">
                    {isAm ? 'እንግሊዝኛ' : 'English'}
                    <textarea
                      value={point.en ?? ''}
                      onChange={(event) => {
                        const mainPoints = toMainPointSlots(form.mainPoints)
                        mainPoints[index] = { ...mainPoints[index], en: event.target.value }
                        setForm({ ...form, mainPoints })
                      }}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                    />
                  </label>
                  <label className="text-sm font-medium text-brand-900">
                    {isAm ? 'አማርኛ' : 'Amharic'}
                    <textarea
                      value={point.am ?? ''}
                      onChange={(event) => {
                        const mainPoints = toMainPointSlots(form.mainPoints)
                        mainPoints[index] = { ...mainPoints[index], am: event.target.value }
                        setForm({ ...form, mainPoints })
                      }}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ቁልፍ ጥቅስ (አማራጭ)' : 'Key Verse (optional)'}
            <input type="text" value={form.keyVerse || ''} onChange={(event) => setForm({ ...form, keyVerse: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="John 3:16" />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ሁኔታ' : 'Status'}
            <input
              type="text"
              value={form.status === 'published' ? (isAm ? 'ታትሟል' : 'Published') : isAm ? 'ረቂቅ' : 'Draft'}
              readOnly
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 text-base text-brand-700 outline-none"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'የአደራጅ ማስታወሻ (አማራጭ)' : 'Organizer Note (optional)'}
          <textarea value={form.organizerNote || ''} onChange={(event) => setForm({ ...form, organizerNote: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">{isAm ? '2. ሳምንታዊ መዝሙሮች ቅጽ' : '2. Weekly Mezmurs Form'}</h2>
        <div className="mt-4 space-y-4">
          {form.mezmurs.map((mezmur, index) => (
            <div key={`mezmur-${index}`} className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <h3 className="text-base font-semibold text-brand-900">{isAm ? `መዝሙር ${index + 1}` : `Mezmur ${index + 1}`}</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-brand-900">
                  {isAm ? 'ርእስ — እንግሊዝኛ (አማራጭ)' : 'Title — English (optional)'}
                  <input type="text" value={mezmur.titleEn || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, titleEn: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                </label>
                <label className="text-sm font-medium text-brand-900">
                  {isAm ? 'ርእስ — አማርኛ (አማራጭ)' : 'Title — Amharic (optional)'}
                  <input type="text" value={mezmur.titleAm || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, titleAm: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium text-brand-900">
                {isAm ? 'ትርጉም ፊደል አጻጻፍ (አማራጭ)' : 'Transliteration (optional)'}
                <input type="text" value={mezmur.transliteration || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, transliteration: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
              </label>
              <label className="mt-4 block text-sm font-medium text-brand-900">
                {isAm ? 'ዩቲዩብ (አማራጭ)' : 'YouTube (optional)'}
                <input
                  type="url"
                  value={mezmur.youtubeUrl || ''}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, youtubeUrl: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-brand-900">
                {isAm ? 'የድምጽ አገናኝ (አማራጭ)' : 'Audio Link (optional)'}
                <input
                  type="url"
                  value={mezmur.audioUrl || ''}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, audioUrl: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                  placeholder="https://..."
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-brand-900">
                {isAm ? 'የመዝሙር ግጥም' : 'Mezmur Lyrics'}
                <textarea
                  value={mezmur.lyrics || ''}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, lyrics: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                  placeholder={isAm ? 'የመዝሙር ግጥም ወይም ለልምምድ ማስታወሻ' : 'Mezmur lyrics or rehearsal notes'}
                />
              </label>
            </div>
          ))}
        </div>
        <label className="mt-6 block text-sm font-medium text-brand-900">
          {isAm
            ? 'የላቀ ልምምድ አገናኝ (አማራጭ) — ለዚህ ሳምንት መዝሙር ገጽ'
            : 'Advanced practice link (optional) — for this week’s mezmur page'}
          <input
            type="url"
            value={form.advancedPracticeUrl || ''}
            onChange={(event) => setForm({ ...form, advancedPracticeUrl: event.target.value })}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            placeholder="https://tewahedodaily.pages.dev/..."
          />
          <p className="mt-1 text-xs text-brand-600">
            {isAm
              ? 'ለ«ያለፈው ሳምንት» መዝሙሮች በመዝሙር ገጹ ላይ ይጠቀማል።'
              : 'Used on the public Mezmurs page for “Last week’s mezmurs” when that week is shown.'}
          </p>
        </label>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">{isAm ? '3. ሳምንታዊ ጥያቄዎች ቅጽ' : '3. Weekly Questions Form'}</h2>
            <p className="text-sm text-brand-700">
              {isAm ? 'ለፓሪሹ የተከታታይ ጥያቄዎችን ያክሉ፣ ያደራጁ እና ያሻሽሉ።' : 'Add, arrange, and refine the follow-up questions for the parish.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(['multiple-choice', 'short-answer', 'reflection', 'feedback-open'] as QuestionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, questions: [...form.questions, createEmptyQuestion(type)] })}
                className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900 shadow-sm"
              >
                {addQuestionButtonLabel(type)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {form.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-sm text-brand-700">
              {isAm
                ? 'እስካሁን ምንም ጥያቄ የለም። ለማጠቃለያ፣ ለማሰላሰል፣ ለመገኘት ወይም ለማብራራት የሚያስፈልጉትን ያክሉ።'
                : 'No questions yet. Add the ones needed for recap, reflection, attendance, or clarification.'}
            </div>
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {isAm ? 'የመገኘት ምርጫዎች' : 'Attendance choice labels'}
                    </p>
                    {(question.attendanceOptions ?? defaultAttendanceOptions).map((option, optionIndex) => (
                      <div key={option.value} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                        <input
                          type="text"
                          value={option.value}
                          readOnly
                          className="min-h-10 w-full rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm text-brand-700 outline-none"
                        />
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-brand-600">
                            {isAm ? 'መለያ — እንግሊዝኛ' : 'Label — English'}
                            <input
                              type="text"
                              value={option.labelEn ?? option.label ?? ''}
                              onChange={(event) => {
                                const attendanceOptions = [...(question.attendanceOptions ?? defaultAttendanceOptions)]
                                const v = event.target.value
                                attendanceOptions[optionIndex] = {
                                  ...option,
                                  labelEn: v,
                                  label: v || option.labelAm?.trim() || option.label,
                                }
                                updateQuestion(index, { ...question, attendanceOptions })
                              }}
                              className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                            />
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-brand-600">
                            {isAm ? 'መለያ — አማርኛ' : 'Label — Amharic'}
                            <input
                              type="text"
                              value={option.labelAm ?? ''}
                              onChange={(event) => {
                                const attendanceOptions = [...(question.attendanceOptions ?? defaultAttendanceOptions)]
                                const v = event.target.value
                                attendanceOptions[optionIndex] = {
                                  ...option,
                                  labelAm: v,
                                  label: option.labelEn?.trim() || v || option.label,
                                }
                                updateQuestion(index, { ...question, attendanceOptions })
                              }}
                              className="mt-1 min-h-12 w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                            />
                          </label>
                        </div>
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
        <h2 className="text-lg font-semibold text-brand-900">{isAm ? '5. የማስቀመጥ / የማተም ሂደት' : '5. Publish / Save Flow'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ረቂቆች ለስራ ክፍለ ጊዜዎች በዚህ መሣሪያ ላይ ይቀመጣሉ። ማተም ደግሞ የሕዝብ ጣቢያው የሚጠቀምበትን የአካባቢ የአደራጅ ማከማቻ ያዘምናል።'
            : 'Drafts are saved on this device for working sessions. Publishing updates the local organizer repository used by the public site.'}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving}>
            {isAm ? 'እንደ ረቂቅ አስቀምጥ' : 'Save as Draft'}
          </Button>
          <Link
            to="/admin/weekly-classes"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-base font-semibold text-brand-900 shadow-sm"
          >
            {isAm ? 'ወደ ቀደሙት ሳምንታት ተመለስ' : 'Back to Previous Weeks'}
          </Link>
          <Button type="button" onClick={publishUpdate} disabled={saving}>
            {saving
              ? isAm
                ? 'በማተም ላይ...'
                : 'Publishing...'
              : isEditing
                ? isAm
                  ? 'ዝማኔውን ያትሙ'
                  : 'Publish Update'
                : isAm
                  ? 'ሳምንታዊ ክፍል ያትሙ'
                  : 'Publish Weekly Class'}
          </Button>
        </div>
      </section>
    </div>
  )
}