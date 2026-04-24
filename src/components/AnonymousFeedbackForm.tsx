import { useState } from 'react'
import {
  anonymousFeedbackCategories,
  buildAnonymousFeedbackMailto,
  type AnonymousFeedbackCategory,
} from '../lib/anonymousFeedback'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { useUiLanguage } from '../contexts/LanguageContext'

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
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.category) {
      setError(isAm ? 'እባክዎ ከመላክዎ በፊት ምድብ ይምረጡ።' : 'Please choose a category before submitting.')
      return
    }

    if (!form.message.trim()) {
      setError(isAm ? 'እባክዎ ከመላክዎ በፊት መልእክት ያስገቡ።' : 'Please enter a message before submitting.')
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
          : isAm
            ? 'በአሁኑ ጊዜ የኢሜይል መተግበሪያዎን መክፈት አልተቻለም።'
            : 'Unable to open your email app right now.',
      )
    }
  }

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        {isAm ? 'ግብረ መልስ' : 'FEEDBACK'}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-brand-900">{isAm ? 'ግብረ መልስዎን በኢሜይል ይላኩ' : 'Send feedback by email'}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-800">
        {isAm
          ? 'የድር ጣቢያ ግብረ መልስ፣ የርእስ ጥቆማዎች ወይም ለወደፊቱ የትምህርት ክፍሎች ጠቃሚ ማስታወሻዎችን በኢሜይል ያጋሩ።'
          : 'Share feedback, prayer/support notes, or topic suggestions for future Timirt classes by email.'}
      </p>
      <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3 text-sm text-brand-700">
        {isAm
          ? 'ይህ ከመላክዎ በፊት በተሞላ ረቂቅ የኢሜይል መተግበሪያዎን ይከፍታል።'
          : 'This will open your email app with your message prefilled before you send it.'}
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-brand-900">
          {isAm ? 'ምድብ' : 'Category'}
          <select
            value={form.category}
            onChange={(event) => updateField('category', event.target.value as AnonymousFeedbackCategory)}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            required
          >
            {anonymousFeedbackCategories.map((category) => (
              <option key={category} value={category}>
                {isAm && category === 'Website feedback' ? 'የድር ጣቢያ ግብረ መልስ' : category}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-brand-900">
          {isAm ? 'ርእሰ ጉዳይ' : 'Subject'} <span className="font-normal text-brand-700">{isAm ? '(አማራጭ)' : '(optional)'}</span>
          <input
            type="text"
            value={form.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            placeholder={isAm ? 'ካስፈለገ አጭር ርእሰ ጉዳይ ያክሉ' : 'A short subject if helpful'}
            maxLength={120}
          />
        </label>

        <label className="block text-sm font-semibold text-brand-900">
          {isAm ? 'መልእክት' : 'Message'}
          <textarea
            value={form.message}
            onChange={(event) => updateField('message', event.target.value)}
            className="mt-2 min-h-36 w-full rounded-xl border border-brand-200 bg-white px-3 py-3 text-base text-brand-900 outline-none ring-accent-600/30 focus:ring-2"
            placeholder={isAm ? 'ግብረ መልስዎን፣ የርእስ ጥቆማዎን ወይም ጠቃሚ ማስታወሻዎን ያጋሩ' : 'Share your feedback, topic idea, or helpful note'}
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
          {isAm ? 'የኢሜይል ረቂቅ ይክፈቱ' : 'Open Email Draft'}
        </Button>
        <p className="text-xs text-brand-700">
          {isAm
            ? 'ይህ አስቀድሞ ተሞልቶ የተዘጋጀ መልእክት ጋር የኢሜይል መተግበሪያዎን ይከፍታል።'
            : 'This will open your email app with your message prefilled.'}
        </p>
      </form>
    </Card>
  )
}