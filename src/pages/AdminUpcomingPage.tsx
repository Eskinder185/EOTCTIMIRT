import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { extractErrorDebugDetails, formatUnknownError } from '../lib/formatError'
import {
  deactivateUpcomingTimirt,
  deleteUpcomingTimirt,
  getUpcomingTimirtForAdmin,
  listUpcomingTimiritForAdmin,
  saveUpcomingTimirtEditor,
  setUpcomingTimiritActive,
  type UpcomingTimirtListItem,
  type UpcomingTimirtEditorInput,
} from '../lib/supabaseData'
import { parseOptionalUuid } from '../lib/uuid'

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
    classSummary: '',
    youtubeUrl: '',
    audioUrl: '',
    audioTitle: '',
    keyVerse: '',
    organizerNote: '',
    isActive: true,
    status: 'draft',
    mezmurs: [
      { title: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
      { title: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
    ],
  }
}

function normalizeDraftFromStorage(parsed: Partial<FormState>): Partial<FormState> {
  const copy = { ...parsed }
  if (copy.id != null && String(copy.id).trim() !== '' && !parseOptionalUuid(copy.id)) {
    delete copy.id
  }
  return copy
}

function buildSoftWarnings(form: FormState): string[] {
  const warnings: string[] = []
  if (!form.topicPreview?.trim() && !form.topicPreviewEn?.trim() && !form.topicPreviewAm?.trim()) {
    warnings.push('No topic added yet.')
  }
  if (!form.note?.trim() && !form.noteEn?.trim() && !form.noteAm?.trim()) {
    warnings.push('Preview note is empty.')
  }
  if (!form.classSummary?.trim() && !form.classSummaryEn?.trim() && !form.classSummaryAm?.trim()) {
    warnings.push('Class summary is empty.')
  }
  if (!form.mezmurs[0]?.title?.trim() && !form.mezmurs[0]?.titleEn?.trim() && !form.mezmurs[0]?.titleAm?.trim()) {
    warnings.push('First mezmur title is empty.')
  }
  if (!form.mezmurs[1]?.title?.trim() && !form.mezmurs[1]?.titleEn?.trim() && !form.mezmurs[1]?.titleAm?.trim()) {
    warnings.push('Second mezmur not filled yet.')
  }
  if (!form.youtubeUrl?.trim() && !form.audioUrl?.trim()) {
    warnings.push('No lesson media link added yet.')
  }
  return warnings
}

function formatDevSupabaseError(error: unknown): string {
  const human = formatUnknownError(error)
  if (!import.meta.env.DEV) return human
  const supabaseDetails = (error as { supabase?: Record<string, unknown> } | null)?.supabase
  if (!supabaseDetails) return human
  const parts = [
    human,
    typeof supabaseDetails.table === 'string' ? `Table: ${supabaseDetails.table}` : null,
    typeof supabaseDetails.operation === 'string' ? `Operation: ${supabaseDetails.operation}` : null,
    typeof supabaseDetails.code === 'string' ? `Code: ${supabaseDetails.code}` : null,
    typeof supabaseDetails.details === 'string' ? `Details: ${supabaseDetails.details}` : null,
    typeof supabaseDetails.hint === 'string' ? `Hint: ${supabaseDetails.hint}` : null,
  ]
  return parts.filter(Boolean).join('\n')
}

export function AdminUpcomingPage() {
  const draftKey = useMemo(() => 'admin-upcoming-draft', [])
  const [form, setForm] = useState<FormState>(createEmptyForm)
  const [upcomingList, setUpcomingList] = useState<UpcomingTimirtListItem[]>([])
  const [selectedUpcomingId, setSelectedUpcomingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

    const loadUpcoming = async () => {
      try {
        const allUpcoming = await listUpcomingTimiritForAdmin()
        setUpcomingList(allUpcoming)

        const defaultId = selectedUpcomingId ?? allUpcoming[0]?.id ?? null
        const upcoming = defaultId ? await getUpcomingTimirtForAdmin(defaultId) : null
        setSelectedUpcomingId(defaultId)
        if (savedDraft) {
          const parsed = normalizeDraftFromStorage(JSON.parse(savedDraft) as Partial<FormState>)
          setForm({
            ...createEmptyForm(),
            ...parsed,
            mezmurs: [
              parsed.mezmurs?.[0] ?? createEmptyForm().mezmurs[0],
              parsed.mezmurs?.[1] ?? createEmptyForm().mezmurs[1],
            ],
          })
          setNotice('A local upcoming draft was restored on this device.')
          return
        }
        if (upcoming) {
          setForm(upcoming)
        }
      } catch (loadError) {
        if (import.meta.env.DEV) {
          console.error('[AdminUpcomingPage] loadUpcoming failed', loadError)
        }
        setError(`The upcoming Timirit form could not be loaded. ${formatUnknownError(loadError)}`)
      } finally {
        setLoading(false)
      }
    }

    loadUpcoming()
  }, [draftKey, selectedUpcomingId])

  const saveDraft = async () => {
    const action = 'save_draft'
    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      const draftToSave: FormState = {
        ...form,
        id: parseOptionalUuid(form.id),
        isActive: false,
        status: 'draft',
      }
      if (import.meta.env.DEV) {
        console.info('[AdminUpcomingPage] saveDraft → saveUpcomingTimirtEditor', structuredClone(draftToSave))
        setDevDiagnostics({ action, rawFormState: structuredClone(form), normalizedPayload: structuredClone(draftToSave) })
      }
      const savedId = await saveUpcomingTimirtEditor(draftToSave)
      setForm((current) => ({
        ...current,
        id: savedId,
        isActive: false,
        status: 'draft',
      }))
      setSelectedUpcomingId(savedId)
      setUpcomingList(await listUpcomingTimiritForAdmin())
      localStorage.removeItem(draftKey)
      const warnings = buildSoftWarnings(form)
      setNotice(
        warnings.length > 0
          ? `Draft saved. It is private until you publish. ${warnings.join(' ')}`
          : 'Draft saved. It is private until you publish.',
      )
    } catch (saveError) {
      if (import.meta.env.DEV) {
        console.error('[AdminUpcomingPage] saveDraft failed', saveError)
        setDevDiagnostics((current) => ({
          action,
          validationRule: current?.validationRule,
          normalizedPayload: current?.normalizedPayload,
          errorDetails: extractErrorDebugDetails(saveError),
        }))
      }
      setError(formatDevSupabaseError(saveError))
    } finally {
      setSaving(false)
    }
  }

  const publishUpcoming = async () => {
    const action = 'publish'
    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      const payload: FormState = {
        ...form,
        id: parseOptionalUuid(form.id),
        isActive: true,
        status: 'published',
      }
      if (import.meta.env.DEV) {
        console.info('[AdminUpcomingPage] publishUpcoming → saveUpcomingTimirtEditor', structuredClone(payload))
        setDevDiagnostics({ action, rawFormState: structuredClone(form), normalizedPayload: structuredClone(payload) })
      }
      const savedId = await saveUpcomingTimirtEditor(payload)
      setForm((current) => ({
        ...current,
        id: savedId,
        isActive: true,
        status: 'published',
      }))
      setSelectedUpcomingId(savedId)
      setUpcomingList(await listUpcomingTimiritForAdmin())
      localStorage.removeItem(draftKey)
      const warnings = buildSoftWarnings(form)
      setNotice(
        warnings.length > 0
          ? `Upcoming Timirit published and now live. ${warnings.join(' ')}`
          : 'Upcoming Timirit published and now live.',
      )
    } catch (publishError) {
      if (import.meta.env.DEV) {
        console.error('[AdminUpcomingPage] publishUpcoming failed', publishError)
        setDevDiagnostics((current) => ({
          action,
          validationRule: current?.validationRule,
          normalizedPayload: current?.normalizedPayload,
          errorDetails: extractErrorDebugDetails(publishError),
        }))
      }
      setError(formatDevSupabaseError(publishError))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    try {
      setDeactivating(true)
      setError(null)
      setNotice(null)
      await deactivateUpcomingTimirt(form.id)
      setForm((current) => ({ ...current, isActive: false }))
      setUpcomingList(await listUpcomingTimiritForAdmin())
      setNotice('Upcoming preview moved back to draft and is no longer public.')
    } catch (deactivateError) {
      if (import.meta.env.DEV) {
        console.error('[AdminUpcomingPage] deactivate failed', deactivateError)
      }
      setError(formatDevSupabaseError(deactivateError))
    } finally {
      setDeactivating(false)
    }
  }

  const handleDelete = async () => {
    const action = 'delete_upcoming_timirit'
    try {
      setDeleting(true)
      setError(null)
      setNotice(null)
      if (import.meta.env.DEV) {
        setDevDiagnostics({
          action,
          rawFormState: structuredClone(form),
          normalizedPayload: { id: form.id },
        })
      }
      await deleteUpcomingTimirt(form.id)
      localStorage.removeItem(draftKey)
      setForm(createEmptyForm())
      setSelectedUpcomingId(null)
      setUpcomingList(await listUpcomingTimiritForAdmin())
      setShowDeleteConfirm(false)
      setNotice('Upcoming preview and linked mezmurs were deleted permanently.')
    } catch (deleteError) {
      const supabaseDetails = (deleteError as { supabase?: Record<string, unknown> } | null)?.supabase
      if (import.meta.env.DEV) {
        console.error('[AdminUpcomingPage] delete failed', deleteError)
        setDevDiagnostics((current) => ({
          action,
          validationRule: current?.validationRule,
          normalizedPayload: { id: form.id },
          errorDetails: {
            ...extractErrorDebugDetails(deleteError),
            supabase: supabaseDetails,
          },
        }))
      }
      setError(formatDevSupabaseError(deleteError))
    } finally {
      setDeleting(false)
    }
  }

  const handleActivate = async () => {
    if (!form.id) {
      return
    }
    try {
      setActivating(true)
      setError(null)
      setNotice(null)
      await setUpcomingTimiritActive(form.id, true)
      setForm((current) => ({ ...current, isActive: true }))
      setUpcomingList(await listUpcomingTimiritForAdmin())
      setNotice('Upcoming preview is now active on the public site.')
    } catch (activateError) {
      if (import.meta.env.DEV) {
        console.error('[AdminUpcomingPage] activate failed', activateError)
      }
      setError(formatDevSupabaseError(activateError))
    } finally {
      setActivating(false)
    }
  }

  const handleCreateNewUpcoming = () => {
    setSelectedUpcomingId(null)
    setForm(createEmptyForm())
    setNotice('Creating a new upcoming class preview.')
    setError(null)
  }

  const handleSelectUpcoming = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const selected = await getUpcomingTimirtForAdmin(id)
      if (selected) {
        setForm(selected)
      }
      setSelectedUpcomingId(id)
    } catch (loadError) {
      if (import.meta.env.DEV) {
        console.error('[AdminUpcomingPage] load selected failed', loadError)
      }
      setError(formatUnknownError(loadError))
    } finally {
      setLoading(false)
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-brand-900">Upcoming classes</h2>
          <Button type="button" variant="secondary" onClick={handleCreateNewUpcoming}>
            Add new upcoming class
          </Button>
        </div>
        <div className="mt-3 grid gap-2">
          {upcomingList.length === 0 ? (
            <p className="text-sm text-brand-700">No upcoming classes yet.</p>
          ) : (
            upcomingList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectUpcoming(item.id)}
                className={`rounded-xl border px-3 py-3 text-left ${
                  form.id === item.id
                    ? 'border-accent-600 bg-brand-50'
                    : 'border-brand-200 bg-white hover:bg-brand-50'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {item.scheduledDate} {item.status === 'published' ? '· Published' : '· Draft'}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-900">{item.topicPreview}</p>
              </button>
            ))
          )}
        </div>
      </section>

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
        <p className="mt-2 text-xs text-brand-700">
          Status: <span className="font-semibold">{form.status === 'published' ? 'Published' : 'Draft'}</span>
        </p>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          Preview note
          <textarea
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            rows={5}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            YouTube link
            <input
              type="url"
              value={form.youtubeUrl || ''}
              onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="https://youtube.com/watch?v=..."
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Audio link
            <input
              type="url"
              value={form.audioUrl || ''}
              onChange={(event) => setForm({ ...form, audioUrl: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="https://..."
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Audio title (optional)
            <input
              type="text"
              value={form.audioTitle || ''}
              onChange={(event) => setForm({ ...form, audioTitle: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="Audio lesson title"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Key verse (optional)
            <input
              type="text"
              value={form.keyVerse || ''}
              onChange={(event) => setForm({ ...form, keyVerse: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="John 3:16"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          Class summary
          <textarea
            value={form.classSummary || ''}
            onChange={(event) => setForm({ ...form, classSummary: event.target.value })}
            rows={4}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            placeholder="Share a summary for the upcoming class"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          Organizer note (optional)
          <textarea
            value={form.organizerNote || ''}
            onChange={(event) => setForm({ ...form, organizerNote: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            placeholder="Internal or public organizer note"
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
                <input
                  type="url"
                  value={mezmur.youtubeUrl || ''}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, youtubeUrl: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30 sm:col-span-2"
                  placeholder="YouTube link (optional)"
                />
                <input
                  type="url"
                  value={mezmur.audioUrl || ''}
                  onChange={(event) => {
                    const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                    mezmurs[index] = { ...mezmur, audioUrl: event.target.value }
                    setForm({ ...form, mezmurs })
                  }}
                  className="min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30 sm:col-span-2"
                  placeholder="Audio link (optional)"
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

        <div className="mt-6 border-t border-brand-100 pt-4">
          <p className="text-sm font-semibold text-brand-900">Preview visibility controls</p>
          <p className="mt-1 text-sm text-brand-700">
            Deactivate hides the preview from public pages without deleting it. Delete removes the preview and related upcoming mezmurs permanently.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={handleActivate}
              disabled={activating || deactivating || deleting || !form.id || form.isActive}
            >
              {activating ? 'Activating...' : 'Activate'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDeactivate}
              disabled={deactivating || deleting || !form.id}
            >
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deactivating || deleting || !form.id}
            >
              Delete Upcoming Class
            </Button>
          </div>
        </div>
      </section>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-brand-900">Delete upcoming class preview?</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              This will permanently remove the next class preview. Any linked upcoming mezmurs will also be removed.
            </p>
            <p className="mt-2 text-sm font-medium text-red-700">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
