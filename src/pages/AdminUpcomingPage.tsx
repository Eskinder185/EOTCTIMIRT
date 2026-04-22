import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { getUpcomingTimirtForAdmin, saveUpcomingTimirtEditor, type UpcomingTimirtEditorInput } from '../lib/supabaseData'

type FormState = UpcomingTimirtEditorInput

function getNextTuesday() {
  const today = new Date()
  const daysUntilTuesday = (2 - today.getDay() + 7) % 7
  const nextTuesday = new Date(today)
  nextTuesday.setDate(today.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday))
  return nextTuesday.toISOString().split('T')[0]
}

function createEmptyForm(): FormState {
  return {
    scheduledDate: getNextTuesday(),
    topicPreview: '',
    note: '',
    isActive: true,
    mezmurs: [
      { title: '', transliteration: '', lyrics: '' },
      { title: '', transliteration: '', lyrics: '' },
    ],
  }
}

export function AdminUpcomingPage() {
  const draftKey = useMemo(() => 'admin-upcoming-draft', [])
  const [form, setForm] = useState<FormState>(createEmptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey)

    const loadUpcoming = async () => {
      try {
        const upcoming = await getUpcomingTimirtForAdmin()
        if (savedDraft) {
          setForm(JSON.parse(savedDraft) as FormState)
          setNotice('A local upcoming draft was restored on this device.')
          return
        }
        if (upcoming) {
          setForm(upcoming)
        }
      } catch (loadError) {
        console.error('Failed to load upcoming editor:', loadError)
        setError('The upcoming Timirit form could not be loaded.')
      } finally {
        setLoading(false)
      }
    }

    loadUpcoming()
  }, [draftKey])

  const saveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify(form))
    setNotice('Upcoming preview draft saved on this device.')
  }

  const publishUpcoming = async () => {
    if (!form.topicPreview || !form.note || !form.mezmurs[0].title || !form.mezmurs[1].title) {
      setError('Please complete the topic, preview note, and both upcoming mezmur titles before publishing.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      await saveUpcomingTimirtEditor(form)
      localStorage.removeItem(draftKey)
      setNotice('Upcoming Timirit published successfully.')
    } catch (publishError) {
      console.error('Failed to publish upcoming Timirit:', publishError)
      setError(publishError instanceof Error ? publishError.message : 'Could not publish the upcoming Timirit.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-accent-600"></div>
        <p className="text-sm text-brand-700">Loading the upcoming Timirit editor...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Organizer editor</p>
        <h1 className="text-2xl font-bold text-brand-900">4. Upcoming Timirt form</h1>
        <p className="text-sm leading-relaxed text-brand-700">
          Prepare the next Tuesday preview so organizers can update the public homepage without touching code or raw tables.
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</div> : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            Next session date
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Next topic
            <input
              type="text"
              value={form.topicPreview}
              onChange={(event) => setForm({ ...form, topicPreview: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="The Mother of God in the life of the Church"
            />
          </label>
        </div>

        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-brand-200 px-4 text-sm font-medium text-brand-900">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Mark this preview as active on the public site
        </label>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          Preview note
          <textarea
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            rows={5}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">Next week mezmurs</h2>
        <div className="mt-4 space-y-4">
          {form.mezmurs.map((mezmur, index) => (
            <div key={`upcoming-mezmur-${index}`} className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <h3 className="text-base font-semibold text-brand-900">Upcoming mezmur {index + 1}</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  value={mezmur.title}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, title: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                  placeholder="Mezmur title"
                />
                <input
                  type="text"
                  value={mezmur.transliteration || ''}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, transliteration: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                  placeholder="Transliteration"
                />
              </div>
              <textarea
                value={mezmur.lyrics || ''}
                onChange={(event) => {
                  const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                  mezmurs[index] = { ...mezmur, lyrics: event.target.value }
                  setForm({ ...form, mezmurs })
                }}
                rows={4}
                className="mt-4 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                placeholder="Upcoming mezmur lyrics or rehearsal notes"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">5. Publish / save flow</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Save a local draft while preparing the next topic, then publish when the preview is ready for the parish site.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving}>
            Save as draft
          </Button>
          <Button type="button" onClick={publishUpcoming} disabled={saving}>
            {saving ? 'Publishing...' : 'Publish update'}
          </Button>
        </div>
      </section>
    </div>
  )
}
