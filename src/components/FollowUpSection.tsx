import { useState } from 'react'
import { useUiLanguage } from '../contexts/LanguageContext'
import type { Question, WeeklyClass } from '../data/types'
import { displayBilingualLine, getLocalizedText } from '../lib/localizedText'
import { getSubmissionForWeek, saveClassSubmission } from '../lib/feedbackClient'
import { getUserFingerprint } from '../lib/anonymousIdentity'
import { submitUserResponses } from '../lib/supabaseData'
import { CURRENT_TOPIC } from '../site/constants'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

function isMultipleChoice(
  q: Question,
): q is Extract<Question, { type: 'multiple-choice' }> {
  return q.type === 'multiple-choice'
}

export function FollowUpSection({ week }: { week: WeeklyClass }) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const existing = getSubmissionForWeek(week.id)
    return existing?.answers ?? {}
  })
  const [saved, setSaved] = useState(() => Boolean(getSubmissionForWeek(week.id)))
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)

    saveClassSubmission({
      weekId: week.id,
      answers,
      submittedAt: new Date().toISOString(),
    })

    const responsePayload = week.questions
      .map((question) => {
        const answer = answers[question.id]
        if (!answer) {
          return null
        }

        if (question.type === 'multiple-choice') {
          const selectedOptionIndex = Number.parseInt(answer, 10)
          if (Number.isNaN(selectedOptionIndex)) {
            return null
          }
          return {
            questionId: question.id,
            selectedOptionIndex,
          }
        }

        if (question.type === 'attendance') {
          return {
            questionId: question.id,
            attendanceChoice: answer as 'in-person' | 'online' | 'maybe' | 'cannot-attend',
          }
        }

        return {
          questionId: question.id,
          responseText: answer,
        }
      })
      .filter((response): response is NonNullable<typeof response> => response !== null)

    try {
      if (responsePayload.length > 0) {
        await submitUserResponses(week.id, responsePayload, getUserFingerprint())
      }
      setSaved(true)
    } catch (error) {
      console.error('Failed to save responses to Supabase:', error)
      setSubmitError('Responses were saved locally, but syncing had a problem. Please try again soon.')
      setSaved(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card id="follow-up" className="scroll-mt-24">
      <details className="group" open={saved}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Timirit follow-up
            </p>
            <h2 className="text-xl font-semibold text-brand-900">Quiet questions after class</h2>
            {week.topic === CURRENT_TOPIC.english ? (
              <p className="mt-1 text-sm font-medium text-brand-800">
                {CURRENT_TOPIC.english} · {CURRENT_TOPIC.amharic}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              These prompts are not an exam — they help priests and teachers hear where the
              flock needs a little more explanation before the next Tuesday in the Ethiopian
              Orthodox Tewahedo Church.
            </p>
          </div>
          <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-800 group-open:rotate-180 motion-safe:transition-transform">
            ⌄
          </span>
        </summary>

        <div className="mt-4 space-y-5 border-t border-brand-100 pt-4">
          {week.questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ))}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saving...'
                : saved
                  ? 'Update saved responses'
                  : 'Save anonymous responses'}
            </Button>
            <p className="text-xs leading-relaxed text-brand-700">
              Anonymous responses help organizers review common weak areas for next class recap.
            </p>
          </div>
          {submitError ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {submitError}
            </p>
          ) : null}
        </div>
      </details>
    </Card>
  )
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string
  onChange: (v: string) => void
}) {
  const { language } = useUiLanguage()
  const promptText = displayBilingualLine(language, question.promptEn, question.promptAm, question.prompt)
  const helperText = displayBilingualLine(
    language,
    question.helperTextEn,
    question.helperTextAm,
    question.helperText,
  )

  if (isMultipleChoice(question)) {
    const selected = value === '' ? undefined : Number.parseInt(value, 10)
    const showExplanation =
      selected !== undefined && !Number.isNaN(selected)

    return (
      <fieldset className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <legend className="px-1 text-base font-semibold text-brand-900">
          {promptText}
        </legend>
        {helperText ? (
          <p className="mb-3 text-sm text-brand-700">{helperText}</p>
        ) : (
          <p className="mb-3 text-sm text-brand-700">
            Choose the option that feels closest.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {question.options.map((opt, idx) => {
            const id = `${question.id}-${idx}`
            const active = selected === idx
            return (
              <label
                key={id}
                htmlFor={id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm sm:text-base ${
                  active
                    ? 'border-accent-600 bg-white shadow-sm'
                    : 'border-brand-200 bg-white hover:border-brand-300'
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name={question.id}
                  className="h-5 w-5 accent-accent-600"
                  checked={active}
                  onChange={() => onChange(String(idx))}
                />
                <span className="text-brand-900">{getLocalizedText(opt, language)}</span>
              </label>
            )
          })}
        </div>
        {showExplanation ? (() => {
          const isCorrect = selected === question.correctIndex
          const correctAnswer = question.options[question.correctIndex]
          return (
            <div
              className={`mt-3 rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                isCorrect
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold">{isCorrect ? 'Correct' : 'Not quite'}</p>
              <p className="mt-1">
                <span className="font-semibold">Correct answer:</span>{' '}
                {getLocalizedText(correctAnswer, language)}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Explanation:</span>{' '}
                {displayBilingualLine(language, question.explanationEn, question.explanationAm, question.explanation)}
              </p>
              {!isCorrect ? (
                <p className="mt-1 font-medium">Review this point again before next class.</p>
              ) : null}
            </div>
          )
        })() : null}
      </fieldset>
    )
  }

  if (question.type === 'attendance') {
    return (
      <fieldset className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <legend className="px-1 text-base font-semibold text-brand-900">
          {promptText}
        </legend>
        <p className="mb-3 text-sm text-brand-700">
          Helps stewards prepare chairs and technology — never a judgment on your soul.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {question.options.map((opt) => {
            const id = `${question.id}-${opt.value}`
            const active = value === opt.value
            const optionLabel = displayBilingualLine(language, opt.labelEn, opt.labelAm, opt.label)
            return (
              <label
                key={opt.value}
                htmlFor={id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold sm:text-base ${
                  active
                    ? 'border-accent-600 bg-white shadow-sm'
                    : 'border-brand-200 bg-white hover:border-brand-300'
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name={question.id}
                  className="h-5 w-5 accent-accent-600"
                  checked={active}
                  onChange={() => onChange(opt.value)}
                />
                {optionLabel}
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  const placeholder =
    question.type === 'reflection' ||
    question.type === 'short-answer' ||
    question.type === 'feedback-open'
      ? displayBilingualLine(
          language,
          question.placeholderEn,
          question.placeholderAm,
          question.placeholder,
        )
      : ''

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <label className="block text-base font-semibold text-brand-900" htmlFor={question.id}>
        {promptText}
      </label>
      {helperText ? (
        <p className="mt-1 text-sm text-brand-700">{helperText}</p>
      ) : null}
      <textarea
        id={question.id}
        name={question.id}
        rows={question.type === 'feedback-open' ? 4 : 3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full resize-y rounded-xl border border-brand-200 bg-white px-3 py-3 text-base text-brand-900 outline-none ring-accent-600/40 focus:ring-2"
      />
    </div>
  )
}
