import { useState } from 'react'
import {
  anonymousFeedbackCategories,
  buildAnonymousFeedbackMailto,
  type AnonymousFeedbackCategory,
} from '../lib/anonymousFeedback'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface FormState {
  category: AnonymousFeedbackCategory
  subject: string
  message: string
}

const initialState: FormState = {
  category: 'Website feedback',
  subject: '',
  message: '',
}

export function AnonymousFeedbackForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.category) {
      setError('Please choose a category before submitting.')
      return
    }

    if (!form.message.trim()) {
      setError('Please enter a message before submitting.')
      return
    }

    try {
      const mailtoUrl = buildAnonymousFeedbackMailto({
        category: form.category,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      })
      window.location.href = mailtoUrl
      setForm(initialState)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to open your email app right now.',
      )
    }
  }

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        FEEDBACK
      </p>
      <h3 className="mt-1 text-lg font-semibold text-brand-900">Send feedback by email</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-800">
        Share feedback, prayer/support notes, or topic suggestions for future Timirt classes.
      </p>
      <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3 text-sm text-brand-700">
        This will open your email app with your message prefilled before you send it.
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

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-relaxed text-red-900">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full sm:w-auto">
          Open Email Draft
        </Button>
        <p className="text-xs text-brand-700">
          This will open your email app with your message prefilled.
        </p>
      </form>
    </Card>
  )
}