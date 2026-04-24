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
import { displayBilingualLine } from '../lib/localizedText'
import { parseOptionalUuid } from '../lib/uuid'
import { useUiLanguage } from '../contexts/LanguageContext'

type FormState = UpcomingTimirtEditorInput

function toMainPointSlots(points?: Array<{ en?: string; am?: string }>) {
  return Array.from({ length: 4 }, (_, index) => ({
    en: points?.[index]?.en ?? '',
    am: points?.[index]?.am ?? '',
  }))
}

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
    topicPreviewEn: '',
    topicPreviewAm: '',
    note: '',
    noteEn: '',
    noteAm: '',
    classSummary: '',
    classSummaryEn: '',
    classSummaryAm: '',
    mainPoints: toMainPointSlots(),
    youtubeUrl: '',
    audioUrl: '',
    audioTitle: '',
    keyVerse: '',
    organizerNote: '',
    isActive: true,
    status: 'draft',
    mezmurs: [
      { title: '', titleEn: '', titleAm: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
      { title: '', titleEn: '', titleAm: '', transliteration: '', lyrics: '', youtubeUrl: '', audioUrl: '' },
    ],
  }
}

function normalizeMezmurSlotsFromDraft(
  slots: Partial<FormState['mezmurs']> | FormState['mezmurs'] | undefined,
): FormState['mezmurs'] {
  const empty = createEmptyForm().mezmurs
  return ([0, 1] as const).map((i) => {
    const slot = slots?.[i]
    const merged = { ...empty[i], ...(slot ?? {}) }
    let out = merged
    if (!merged.titleEn?.trim() && !merged.titleAm?.trim() && merged.title?.trim()) {
      out = { ...merged, titleEn: merged.title }
    }
    const title = (out.titleEn || out.titleAm || out.title || '').trim()
    return { ...out, title }
  }) as FormState['mezmurs']
}

function normalizeDraftFromStorage(parsed: Partial<FormState>): Partial<FormState> {
  const copy = { ...parsed }
  if (copy.id != null && String(copy.id).trim() !== '' && !parseOptionalUuid(copy.id)) {
    delete copy.id
  }
  if (!copy.noteEn?.trim() && !copy.noteAm?.trim() && copy.note?.trim()) {
    copy.noteEn = copy.note
  }
  if (!copy.topicPreviewEn?.trim() && !copy.topicPreviewAm?.trim() && copy.topicPreview?.trim()) {
    copy.topicPreviewEn = copy.topicPreview
  }
  if (!copy.classSummaryEn?.trim() && !copy.classSummaryAm?.trim() && copy.classSummary?.trim()) {
    copy.classSummaryEn = copy.classSummary
  }
  copy.mezmurs = normalizeMezmurSlotsFromDraft(copy.mezmurs)
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
    warnings.push('Short summary is empty (both languages).')
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
  const { language } = useUiLanguage()
  const isAm = language === 'am'
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
            mainPoints: toMainPointSlots(parsed.mainPoints),
          })
          setNotice('A local upcoming draft was restored on this device.')
          return
        }
        if (upcoming) {
          setForm({
            ...upcoming,
            mainPoints: toMainPointSlots(upcoming.mainPoints),
            mezmurs: normalizeMezmurSlotsFromDraft(upcoming.mezmurs),
          })
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
        setForm({
          ...selected,
          mainPoints: toMainPointSlots(selected.mainPoints),
          mezmurs: normalizeMezmurSlotsFromDraft(selected.mezmurs),
        })
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
        <p className="text-sm text-brand-700">
          {isAm ? 'የሚቀጥለው ትምህርት አርታዒ በመጫን ላይ...' : 'Loading the upcoming Timirt editor...'}
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
          {isAm ? '4. የቀጣይ ትምህርት ቅጽ' : '4. Upcoming Timirt Form'}
        </h1>
        <p className="text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'አዘጋጆች ኮድ ወይም ጥሬ የውሂብ ጎታ ሰንጠረዦችን ሳይነኩ የሕዝብ መነሻ ገጽን ማዘመን እንዲችሉ የሚቀጥለውን የማክሰኞ ቅድመ እይታ ያዘጋጁ።'
            : 'Prepare the next Tuesday preview so organizers can update the public homepage without touching code or raw database tables.'}
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
          <h2 className="text-lg font-semibold text-brand-900">{isAm ? 'የሚቀጥሉ ክፍሎች' : 'Upcoming Classes'}</h2>
          <Button type="button" variant="secondary" onClick={handleCreateNewUpcoming}>
            {isAm ? 'አዲስ የሚቀጥል ክፍል ያክሉ' : 'Add New Upcoming Class'}
          </Button>
        </div>
        <div className="mt-3 grid gap-2">
          {upcomingList.length === 0 ? (
            <p className="text-sm text-brand-700">{isAm ? 'የሚቀጥሉ ክፍሎች እስካሁን የሉም።' : 'No upcoming classes yet.'}</p>
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
                  {item.scheduledDate} {item.status === 'published' ? (isAm ? '· ታትሟል' : '· Published') : isAm ? '· ረቂቅ' : '· Draft'}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-900">
                  {displayBilingualLine(language, item.topicPreviewEn, item.topicPreviewAm, item.topicPreview).trim() ||
                    item.topicPreview}
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <label className="block text-sm font-medium text-brand-900">
          {isAm ? 'የሚቀጥለው ክፍለ ጊዜ ቀን' : 'Next Session Date'}
          <input
            type="date"
            value={form.scheduledDate}
            onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30 sm:max-w-xs"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brand-900">
            {isAm ? 'ቀጣይ ርእስ — እንግሊዝኛ' : 'Next Topic — English'}
            <input
              type="text"
              value={form.topicPreviewEn ?? ''}
              onChange={(event) => setForm({ ...form, topicPreviewEn: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={isAm ? 'The Mother of God in the life of the Church' : 'The Mother of God in the life of the Church'}
            />
          </label>
          <label className="block text-sm font-medium text-brand-900">
            {isAm ? 'ቀጣይ ርእስ — አማርኛ' : 'Next Topic — Amharic'}
            <input
              type="text"
              value={form.topicPreviewAm ?? ''}
              onChange={(event) => setForm({ ...form, topicPreviewAm: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={isAm ? 'በቤተ ክርስቲያን ሕይወት ውስጥ እመቤታችን' : 'Optional Amharic title'}
            />
          </label>
        </div>

        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-brand-200 px-4 text-sm font-medium text-brand-900">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          {isAm ? 'ይህን ቅድመ እይታ በሕዝብ ጣቢያ ላይ ንቁ አድርግ' : 'Mark this preview as active on the public site'}
        </label>
        <p className="mt-2 text-xs text-brand-700">
          {isAm ? 'ሁኔታ፡' : 'Status:'}{' '}
          <span className="font-semibold">{form.status === 'published' ? (isAm ? 'ታትሟል' : 'Published') : isAm ? 'ረቂቅ' : 'Draft'}</span>
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-1">
          <label className="block text-sm font-medium text-brand-900">
            {isAm ? 'የቅድመ እይታ ማስታወሻ — እንግሊዝኛ' : 'Preview Note — English'}
            <textarea
              value={form.noteEn ?? ''}
              onChange={(event) => setForm({ ...form, noteEn: event.target.value })}
              rows={5}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="block text-sm font-medium text-brand-900">
            {isAm ? 'የቅድመ እይታ ማስታወሻ — አማርኛ' : 'Preview Note — Amharic'}
            <textarea
              value={form.noteAm ?? ''}
              onChange={(event) => setForm({ ...form, noteAm: event.target.value })}
              rows={5}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የዩቲዩብ አገናኝ' : 'YouTube Link'}
            <input
              type="url"
              value={form.youtubeUrl || ''}
              onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="https://youtube.com/watch?v=..."
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የድምጽ አገናኝ' : 'Audio Link'}
            <input
              type="url"
              value={form.audioUrl || ''}
              onChange={(event) => setForm({ ...form, audioUrl: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="https://..."
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የድምጽ ርእስ (አማራጭ)' : 'Audio Title (optional)'}
            <input
              type="text"
              value={form.audioTitle || ''}
              onChange={(event) => setForm({ ...form, audioTitle: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={isAm ? 'የድምጽ ትምህርት ርእስ' : 'Audio lesson title'}
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ቁልፍ ጥቅስ (አማራጭ)' : 'Key Verse (optional)'}
            <input
              type="text"
              value={form.keyVerse || ''}
              onChange={(event) => setForm({ ...form, keyVerse: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="John 3:16"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-1">
          <label className="block text-sm font-medium text-brand-900">
            {isAm ? 'አጭር ማጠቃለያ — እንግሊዝኛ' : 'Short Summary — English'}
            <textarea
              value={form.classSummaryEn ?? ''}
              onChange={(event) => setForm({ ...form, classSummaryEn: event.target.value })}
              rows={4}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={
                isAm
                  ? 'ለሚቀጥለው ክፍል አጭር መግቢያ ያጋሩ (2–4 መስመሮች)።'
                  : 'Share a short introduction for the upcoming class (2–4 lines).'
              }
            />
          </label>
          <label className="block text-sm font-medium text-brand-900">
            {isAm ? 'አጭር ማጠቃለያ — አማርኛ' : 'Short Summary — Amharic'}
            <textarea
              value={form.classSummaryAm ?? ''}
              onChange={(event) => setForm({ ...form, classSummaryAm: event.target.value })}
              rows={4}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={isAm ? '(አማራጭ)' : 'Optional Amharic summary'}
            />
          </label>
        </div>
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {isAm ? 'ዋና ነጥቦች (እስከ 4፣ አማራጭ)' : 'Main Points (up to 4, optional)'}
          </h3>
          <p className="mt-1 text-xs text-brand-700">
            {isAm
              ? 'እያንዳንዱን ነጥብ አንድ በአንድ ያክሉ። እንግሊዝኛም ሆነ አማርኛ ለእያንዳንዱ ነጥብ አማራጭ ናቸው።'
              : 'Add each point one at a time. English and Amharic are both optional for every point.'}
          </p>
          <div className="mt-3 space-y-3">
            {toMainPointSlots(form.mainPoints).map((point, index) => (
              <div key={`upcoming-main-point-${index}`} className="rounded-xl border border-brand-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {isAm ? `ዋና ነጥብ ${index + 1}` : `Main Point ${index + 1}`}
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-brand-900">
                    {isAm ? `ዋና ነጥብ ${index + 1} — እንግሊዝኛ` : `Main Point ${index + 1} — English`}
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
                    {isAm ? `ዋና ነጥብ ${index + 1} — አማርኛ` : `Main Point ${index + 1} — Amharic`}
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

        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'የአደራጅ ማስታወሻ (አማራጭ)' : 'Organizer Note (optional)'}
          <textarea
            value={form.organizerNote || ''}
            onChange={(event) => setForm({ ...form, organizerNote: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            placeholder={isAm ? 'ውስጣዊ ወይም ለሕዝብ የሚታይ የአደራጅ ማስታወሻ' : 'Internal or public organizer note'}
          />
        </label>

        
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">{isAm ? 'የሚቀጥለው ሳምንት መዝሙሮች' : 'Next Week’s Mezmurs'}</h2>
        <div className="mt-4 space-y-4">
          {form.mezmurs.map((mezmur, index) => (
            <div key={`upcoming-mezmur-${index}`} className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <h3 className="text-base font-semibold text-brand-900">
                {isAm ? `የሚቀጥል መዝሙር ${index + 1}` : `Upcoming Mezmur ${index + 1}`}
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-brand-900 sm:col-span-2">
                  {isAm ? `የመዝሙር ርእስ — እንግሊዝኛ (${index + 1})` : `Mezmur Title — English (${index + 1})`}
                  <input
                    type="text"
                    value={mezmur.titleEn ?? ''}
                    onChange={(event) => {
                      const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                      const next = { ...mezmur, titleEn: event.target.value }
                      mezmurs[index] = { ...next, title: next.titleEn || next.titleAm || next.title || '' }
                      setForm({ ...form, mezmurs })
                    }}
                    className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                    placeholder={isAm ? 'Optional English title' : 'English title (optional if Amharic only)'}
                  />
                </label>
                <label className="block text-sm font-medium text-brand-900 sm:col-span-2">
                  {isAm ? `የመዝሙር ርእስ — አማርኛ (${index + 1})` : `Mezmur Title — Amharic (${index + 1})`}
                  <input
                    type="text"
                    value={mezmur.titleAm ?? ''}
                    onChange={(event) => {
                      const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                      const next = { ...mezmur, titleAm: event.target.value }
                      mezmurs[index] = { ...next, title: next.titleEn || next.titleAm || next.title || '' }
                      setForm({ ...form, mezmurs })
                    }}
                    className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                    placeholder={isAm ? 'የመዝሙር ርእስ' : 'Amharic title'}
                  />
                </label>
                <label className="block text-sm font-medium text-brand-900 sm:col-span-2">
                  {isAm ? 'የቋንቋ ልይነት (ሮምን)' : 'Transliteration'}
                  <input
                    type="text"
                    value={mezmur.transliteration || ''}
                    onChange={(event) => {
                      const mezmurs = [...form.mezmurs] as FormState['mezmurs']
                      mezmurs[index] = { ...mezmur, transliteration: event.target.value }
                      setForm({ ...form, mezmurs })
                    }}
                    className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
                    placeholder="Transliteration"
                  />
                </label>
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
        <h2 className="text-lg font-semibold text-brand-900">{isAm ? '5. የማስቀመጥ / የማተም ሂደት' : '5. Publish / Save Flow'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ቀጣዩን ርእስ እያዘጋጁ ረቂቅ በአካባቢው ያስቀምጡ፤ ከዚያም ቅድመ እይታው ለፓሪሽ ድር ጣቢያ ዝግጁ ሲሆን ያትሙ።'
            : 'Save a local draft while preparing the next topic, then publish when the preview is ready for the parish website.'}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving}>
            {isAm ? 'እንደ ረቂቅ አስቀምጥ' : 'Save as Draft'}
          </Button>
          <Button type="button" onClick={publishUpcoming} disabled={saving}>
            {saving ? (isAm ? 'በማተም ላይ...' : 'Publishing...') : isAm ? 'ዝማኔውን ያትሙ' : 'Publish Update'}
          </Button>
        </div>

        <div className="mt-6 border-t border-brand-100 pt-4">
          <p className="text-sm font-semibold text-brand-900">
            {isAm ? 'የቅድመ እይታ ታይነት መቆጣጠሪያዎች' : 'Preview Visibility Controls'}
          </p>
          <p className="mt-1 text-sm text-brand-700">
            {isAm
              ? 'ያቦዝኑ ቅድመ እይታውን ከሕዝብ ገጾች ሳይሰርዝ ይደብቃል። ሰርዝ ደግሞ ቅድመ እይታውን እና ተዛማጅ የሚቀጥሉ መዝሙሮችን በቋሚነት ያስወግዳል።'
              : 'Deactivate hides the preview from public pages without deleting it. Delete removes the preview and related upcoming mezmurs permanently.'}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={handleActivate}
              disabled={activating || deactivating || deleting || !form.id || form.isActive}
            >
              {activating ? (isAm ? 'በማግበር ላይ...' : 'Activating...') : isAm ? 'አግብር' : 'Activate'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDeactivate}
              disabled={deactivating || deleting || !form.id}
            >
              {deactivating ? (isAm ? 'በማቦዘን ላይ...' : 'Deactivating...') : isAm ? 'ያቦዝን' : 'Deactivate'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deactivating || deleting || !form.id}
            >
              {isAm ? 'የሚቀጥል ክፍል ሰርዝ' : 'Delete Upcoming Class'}
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
