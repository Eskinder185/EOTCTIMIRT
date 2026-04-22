import { useState } from 'react'
import {
  anonymousFeedbackCategories,
  submitAnonymousFeedback,
  type AnonymousFeedbackCategory,
} from '../lib/anonymousFeedback'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface FormState {
  category: AnonymousFeedbackCategory
  subject: string
  message: string
  website: string
}

const initialState: FormState = {
  category: 'Website feedback',
  subject: '',
  message: '',
  website: '',
}

export function AnonymousFeedbackForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(null)
    setError(null)

    if (!form.message.trim()) {
      setError('Please enter a message before submitting.')
      return
    }

    try {
      setSubmitting(true)
      await submitAnonymousFeedback({
        category: form.category,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
        website: form.website,
      })
      setForm(initialState)
      setNotice('Your anonymous note was received. Thank you for helping the community grow together in the faith.')
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to submit the anonymous note right now.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Anonymous Feedback & Topic Suggestions
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brand-800">
        Share anonymous feedback about the website, the teaching, or future topics so that we can grow together in the faith.
      </p>
      <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3 text-sm text-brand-700">
        This form is anonymous. You do not need to enter your name or contact information.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-brand-900">
          Category
          <select
            value={form.category}
            onChange={(event) => updateField('category', event.target.value as AnonymousFeedbackCategory)}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            required
          >
            {anonymousFeedbackCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-brand-900">
          Subject <span className="font-normal text-brand-700">(optional)</span>
          <input
            type="text"
            value={form.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            placeholder="A short subject if helpful"
            maxLength={120}
          />
        </label>

        <label className="block text-sm font-semibold text-brand-900">
          Message
          <textarea
            value={form.message}
            onChange={(event) => updateField('message', event.target.value)}
            className="mt-2 min-h-36 w-full rounded-xl border border-brand-200 bg-white px-3 py-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            placeholder="Share your feedback, topic idea, or helpful note"
            required
            maxLength={3000}
          />
        </label>

        <label className="hidden" aria-hidden="true">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField('website', event.target.value)}
            name="website"
          />
        </label>

        {notice ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-950">
            {notice}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-relaxed text-red-900">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Submitting...' : 'Submit Anonymous Note'}
        </Button>
      </form>
    </Card>
  )
}