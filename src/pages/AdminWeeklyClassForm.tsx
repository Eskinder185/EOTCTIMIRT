import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { getWeeklyClass, saveWeeklyClassEditor, type EditorQuestionInput, type WeeklyClassEditorInput } from '../lib/supabaseData'
import type { AttendanceChoice, QuestionType } from '../data/types'

type FormState = WeeklyClassEditorInput

const defaultAttendanceOptions: Array<{ value: AttendanceChoice; label: string }> = [
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
      helperText: '',
      correctIndex: 0,
      explanation: '',
      options: ['', '', '', ''],
    }
  }

  if (type === 'attendance') {
    return {
      type,
      prompt: '',
      helperText: '',
      attendanceOptions: defaultAttendanceOptions,
    }
  }

  return {
    type,
    prompt: '',
    helperText: '',
    placeholder: '',
  }
}

function createEmptyForm(): FormState {
  return {
    id: '',
    date: getNextTuesday(),
    topic: '',
    speaker: '',
    amharicSummary: '',
    englishSummary: '',
    keyPoints: ['', '', ''],
    verses: ['', ''],
    youtubeUrl: '',
    audioUrl: '',
    audioTitle: '',
    audioNote: '',
    lessonMediaEnabled: true,
    teachingNotes: '',
    mezmurs: [
      { title: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
      { title: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
    ],
    questions: [],
    feedbackSummary: '',
    attendanceSummary: '',
  }
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
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

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey)

    if (!isEditing) {
      if (savedDraft) {
        setForm(JSON.parse(savedDraft) as FormState)
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
          speaker: weeklyClass.speaker,
          amharicSummary: weeklyClass.amharicSummary,
          englishSummary: weeklyClass.englishSummary,
          keyPoints: [...weeklyClass.keyPoints, '', '', ''].slice(0, 3),
          verses: [...(weeklyClass.verses ?? []), '', ''].slice(0, 2),
          youtubeUrl: weeklyClass.youtubeUrl || '',
          audioUrl: weeklyClass.audioUrl || '',
          audioTitle: weeklyClass.audioTitle || '',
          audioNote: weeklyClass.audioNote || '',
          lessonMediaEnabled: weeklyClass.lessonMediaEnabled ?? true,
          teachingNotes: weeklyClass.teachingNotes || '',
          mezmurs: [
            {
              title: weeklyClass.mezmurs[0]?.title || '',
              transliteration: weeklyClass.mezmurs[0]?.transliteration || '',
              lyrics: weeklyClass.mezmurs[0]?.lyrics || '',
              youtubeUrl: weeklyClass.mezmurs[0]?.youtubeUrl || '',
              audioUrl: weeklyClass.mezmurs[0]?.audioUrl || '',
            },
            {
              title: weeklyClass.mezmurs[1]?.title || '',
              transliteration: weeklyClass.mezmurs[1]?.transliteration || '',
              lyrics: weeklyClass.mezmurs[1]?.lyrics || '',
              youtubeUrl: weeklyClass.mezmurs[1]?.youtubeUrl || '',
              audioUrl: weeklyClass.mezmurs[1]?.audioUrl || '',
            },
          ],
          questions: weeklyClass.questions.map((question) => {
            if (question.type === 'multiple-choice') {
              return {
                id: question.id,
                type: question.type,
                prompt: question.prompt,
                helperText: question.helperText || '',
                correctIndex: question.correctIndex,
                explanation: question.explanation,
                options: [...question.options],
              }
            }

            if (question.type === 'attendance') {
              return {
                id: question.id,
                type: question.type,
                prompt: question.prompt,
                helperText: question.helperText || '',
                attendanceOptions: [...question.options],
              }
            }

            return {
              id: question.id,
              type: question.type,
              prompt: question.prompt,
              helperText: question.helperText || '',
              placeholder: question.placeholder || '',
            }
          }),
          feedbackSummary: weeklyClass.feedbackSummary || '',
          attendanceSummary: weeklyClass.attendanceSummary || '',
        }

        if (savedDraft) {
          setForm(JSON.parse(savedDraft) as FormState)
          setNotice('A local draft override was restored for this week.')
        } else {
          setForm(nextForm)
        }
      } catch (loadError) {
        console.error('Failed to load weekly class editor:', loadError)
        setError('The weekly editor could not be loaded. Please try again.')
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

  const saveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify(form))
    setNotice('Draft saved on this device. Publish when the text is ready for the parish site.')
  }

  const publishUpdate = async () => {
    if (!form.date || !form.topic || !form.speaker || !form.amharicSummary || !form.englishSummary) {
      setError('Please complete the date, topic, speaker, and both summaries before publishing.')
      return
    }

    if (!form.mezmurs[0].title || !form.mezmurs[1].title) {
      setError('Please enter both weekly mezmur titles before publishing.')
      return
    }

    if (!isValidUrl(form.youtubeUrl || '') || !isValidUrl(form.audioUrl || '')) {
      setError('Please enter valid YouTube/audio links or leave them empty.')
      return
    }
    const hasInvalidMezmurLink = form.mezmurs.some(
      (mezmur) => !isValidUrl(mezmur.youtubeUrl || '') || !isValidUrl(mezmur.audioUrl || ''),
    )
    if (hasInvalidMezmurLink) {
      setError('Please enter valid mezmur audio/video links or leave them empty.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setNotice(null)

      const normalized: WeeklyClassEditorInput = {
        ...form,
        id: form.id.trim() || form.date,
        keyPoints: form.keyPoints.map((point) => point.trim()).filter(Boolean),
        verses: form.verses.map((verse) => verse.trim()).filter(Boolean),
        audioTitle: form.audioTitle?.trim() || '',
        audioNote: form.audioNote?.trim() || '',
        teachingNotes: form.teachingNotes?.trim() || '',
        questions: form.questions
          .map((question) => {
            if (question.type === 'multiple-choice') {
              return {
                ...question,
                options: (question.options ?? []).map((option) => option.trim()).filter(Boolean),
                explanation: question.explanation?.trim() || '',
              }
            }

            if (question.type === 'attendance') {
              return {
                ...question,
                attendanceOptions: (question.attendanceOptions ?? defaultAttendanceOptions).map((option) => ({
                  value: option.value,
                  label: option.label.trim(),
                })),
              }
            }

            return {
              ...question,
              placeholder: question.placeholder?.trim() || '',
            }
          })
          .filter((question) => question.prompt.trim()),
      }

      const savedId = await saveWeeklyClassEditor(normalized)
      localStorage.removeItem(draftKey)
      navigate(`/admin/weekly-classes/${savedId}`)
    } catch (publishError) {
      console.error('Failed to publish weekly class:', publishError)
      setError(
        publishError instanceof Error
          ? publishError.message
          : 'The weekly content could not be published. Please try again.',
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

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</div> : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">1. Weekly class form</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">Class ID
            <input type="text" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="2026-04-22" />
          </label>
          <label className="text-sm font-medium text-brand-900">Date
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
          </label>
          <label className="text-sm font-medium text-brand-900">Speaker
            <input type="text" value={form.speaker} onChange={(event) => setForm({ ...form, speaker: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Dn. Daniel T., Memhir Kidan, Fr. Michael Z." />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">Topic
          <input type="text" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Theosis through liturgical life" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">YouTube replay link
          <input type="url" value={form.youtubeUrl || ''} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="https://www.youtube.com/watch?v=..." />
        </label>
        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-brand-200 px-4 text-sm font-medium text-brand-900">
          <input
            type="checkbox"
            checked={form.lessonMediaEnabled ?? true}
            onChange={(event) => setForm({ ...form, lessonMediaEnabled: event.target.checked })}
          />
          Enable lesson media on the public lesson page
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">Audio lesson link
            <input type="url" value={form.audioUrl || ''} onChange={(event) => setForm({ ...form, audioUrl: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="https://example.com/lesson.mp3" />
          </label>
          <label className="text-sm font-medium text-brand-900">Audio title (optional)
            <input type="text" value={form.audioTitle || ''} onChange={(event) => setForm({ ...form, audioTitle: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Week 12 audio lesson" />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">Audio note (optional)
          <textarea value={form.audioNote || ''} onChange={(event) => setForm({ ...form, audioNote: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Use headphones for clearer listening in public spaces." />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">Teaching notes / transcript (optional)
          <textarea value={form.teachingNotes || ''} onChange={(event) => setForm({ ...form, teachingNotes: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Optional transcript highlights or teaching notes for catch-up readers." />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">Amharic summary
          <textarea value={form.amharicSummary} onChange={(event) => setForm({ ...form, amharicSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">English summary
          <textarea value={form.englishSummary} onChange={(event) => setForm({ ...form, englishSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" />
        </label>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-900">Key points</p>
            {form.keyPoints.map((point, index) => (
              <textarea key={`point-${index}`} value={point} onChange={(event) => { const keyPoints = [...form.keyPoints]; keyPoints[index] = event.target.value; setForm({ ...form, keyPoints }) }} rows={2} className="w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder={`Key point ${index + 1}`} />
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-900">Bible verses</p>
            {form.verses.map((verse, index) => (
              <input key={`verse-${index}`} type="text" value={verse} onChange={(event) => { const verses = [...form.verses]; verses[index] = event.target.value; setForm({ ...form, verses }) }} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder={`Verse ${index + 1}`} />
            ))}
          </div>
        </div>
        <label className="mt-4 block text-sm font-medium text-brand-900">Feedback summary
          <textarea value={form.feedbackSummary || ''} onChange={(event) => setForm({ ...form, feedbackSummary: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Short organizer summary of unclear points or follow-up needs" />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">Attendance summary
          <textarea value={form.attendanceSummary || ''} onChange={(event) => setForm({ ...form, attendanceSummary: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Short organizer summary of attendance signals" />
        </label>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">2. Weekly mezmurs form</h2>
        <div className="mt-4 space-y-4">
          {form.mezmurs.map((mezmur, index) => (
            <div key={`mezmur-${index}`} className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <h3 className="text-base font-semibold text-brand-900">Mezmur {index + 1}</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <input type="text" value={mezmur.title} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, title: event.target.value }; setForm({ ...form, mezmurs }) }} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Mezmur title" />
                <input type="text" value={mezmur.transliteration || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, transliteration: event.target.value }; setForm({ ...form, mezmurs }) }} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Transliteration" />
              </div>
              <input type="url" value={mezmur.youtubeUrl || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, youtubeUrl: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-4 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="YouTube practice link" />
              <input type="url" value={mezmur.audioUrl || ''} onChange={(event) => { const mezmurs = [...form.mezmurs] as FormState['mezmurs']; mezmurs[index] = { ...mezmur, audioUrl: event.target.value }; setForm({ ...form, mezmurs }) }} className="mt-4 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Audio practice link" />
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
            {(['multiple-choice', 'short-answer', 'reflection', 'feedback-open', 'attendance'] as QuestionType[]).map((type) => (
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
                    <select value={question.type} onChange={(event) => updateQuestion(index, createEmptyQuestion(event.target.value as QuestionType))} className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30">
                      <option value="multiple-choice">multiple-choice</option>
                      <option value="short-answer">short-answer</option>
                      <option value="reflection">reflection</option>
                      <option value="feedback-open">feedback-open</option>
                      <option value="attendance">attendance</option>
                    </select>
                  </label>
                </div>

                <textarea value={question.prompt} onChange={(event) => updateQuestion(index, { ...question, prompt: event.target.value })} rows={2} className="mt-4 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Question prompt" />
                <input type="text" value={question.helperText || ''} onChange={(event) => updateQuestion(index, { ...question, helperText: event.target.value })} className="mt-3 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Helper text for parish readers" />

                {question.type === 'multiple-choice' ? (
                  <div className="mt-4 space-y-3">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <div key={`option-${optionIndex}`} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input type="text" value={option} onChange={(event) => { const options = [...(question.options ?? [])]; options[optionIndex] = event.target.value; updateQuestion(index, { ...question, options }) }} className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder={`Answer choice ${optionIndex + 1}`} />
                        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-brand-200 px-3 text-sm text-brand-800">
                          <input type="radio" name={`correct-${index}`} checked={(question.correctIndex ?? 0) === optionIndex} onChange={() => updateQuestion(index, { ...question, correctIndex: optionIndex })} />
                          Correct
                        </label>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateQuestion(index, { ...question, options: [...(question.options ?? []), ''] })} className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900">Add choice</button>
                      {(question.options?.length ?? 0) > 2 ? (
                        <button type="button" onClick={() => updateQuestion(index, { ...question, options: (question.options ?? []).slice(0, -1) })} className="min-h-11 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900">Remove last choice</button>
                      ) : null}
                    </div>
                    <textarea value={question.explanation || ''} onChange={(event) => updateQuestion(index, { ...question, explanation: event.target.value })} rows={3} className="w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Explanation shown in recap analytics" />
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
                  <input type="text" value={question.placeholder || ''} onChange={(event) => updateQuestion(index, { ...question, placeholder: event.target.value })} className="mt-4 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30" placeholder="Optional response placeholder" />
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">5. Publish / save flow</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">Drafts are saved on this device for working sessions. Publishing writes the weekly content to Supabase for the organizer portal and public site.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving}>Save as draft</Button>
          <Link to="/admin/weekly-classes" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-base font-semibold text-brand-900 shadow-sm">Back to previous weeks</Link>
          <Button type="button" onClick={publishUpdate} disabled={saving}>{saving ? 'Publishing...' : isEditing ? 'Publish update' : 'Publish weekly class'}</Button>
        </div>
      </section>
    </div>
  )
}