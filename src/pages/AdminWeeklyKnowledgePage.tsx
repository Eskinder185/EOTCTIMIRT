import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { useUiLanguage } from '../contexts/LanguageContext'
import { extractErrorDebugDetails, formatUnknownError } from '../lib/formatError'
import type {
  WeeklyKnowledgeEditorInput,
  WeeklyKnowledgeItem,
  WeeklyKnowledgeStatus,
} from '../data/weeklyKnowledge'
import { displayBilingualLine } from '../lib/localizedText'
import {
  deleteWeeklyKnowledge,
  getWeeklyKnowledgeForAdmin,
  listWeeklyKnowledgeForAdmin,
  saveWeeklyKnowledgeEditor,
  setWeeklyKnowledgeStatus,
} from '../lib/supabaseData'

function formatStatusLabel(status: WeeklyKnowledgeStatus, isAm: boolean) {
  const labels: Record<WeeklyKnowledgeStatus, string> = isAm
    ? { draft: 'ረቂቅ', published: 'ታትሟል', hidden: 'የተደበቀ' }
    : { draft: 'Draft', published: 'Published', hidden: 'Hidden' }
  return labels[status] ?? labels.draft
}

function createEmptyForm(): WeeklyKnowledgeEditorInput {
  const today = new Date().toISOString().slice(0, 10)
  return {
    title: '',
    titleEn: '',
    titleAm: '',
    subtitle: '',
    subtitleEn: '',
    subtitleAm: '',
    content: '',
    contentEn: '',
    contentAm: '',
    extraNote: '',
    extraNoteEn: '',
    extraNoteAm: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    status: 'draft',
    startDate: today,
    endDate: '',
    isActive: false,
  }
}

function buildSoftWarnings(form: WeeklyKnowledgeEditorInput) {
  const warnings: string[] = []
  const hasTitle =
    Boolean(form.titleEn?.trim()) || Boolean(form.titleAm?.trim()) || Boolean(form.title?.trim())
  const hasContent =
    Boolean(form.contentEn?.trim()) || Boolean(form.contentAm?.trim()) || Boolean(form.content?.trim())
  if (!hasTitle && !hasContent) warnings.push('Title and content are both empty (both languages).')
  if (!form.imageUrl?.trim()) warnings.push('No image link added yet.')
  if (!form.buttonLink?.trim()) warnings.push('No button link added yet.')
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    warnings.push('Date range looks reversed (saved anyway).')
  }
  return warnings
}

export function AdminWeeklyKnowledgePage() {
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const statusOptions: Array<{ value: WeeklyKnowledgeStatus; label: string }> = [
    { value: 'draft', label: isAm ? 'ረቂቅ' : 'Draft' },
    { value: 'published', label: isAm ? 'ታትሟል' : 'Published' },
    { value: 'hidden', label: isAm ? 'የተደበቀ' : 'Hidden' },
  ]
  const [items, setItems] = useState<WeeklyKnowledgeItem[]>([])
  const [form, setForm] = useState<WeeklyKnowledgeEditorInput>(createEmptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const formatDevSupabaseError = (error: unknown): string => {
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

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      setItems(await listWeeklyKnowledgeForAdmin())
    } catch (loadError) {
      console.error('Failed to load weekly knowledge:', loadError)
      setError(`Could not load weekly knowledge entries. ${formatUnknownError(loadError)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleSelect = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const selected = await getWeeklyKnowledgeForAdmin(id)
      if (!selected) {
        setError('Could not load this knowledge entry.')
        return
      }
      setForm({
        id: selected.id,
        title: selected.title,
        titleEn: selected.titleEn ?? selected.title ?? '',
        titleAm: selected.titleAm ?? '',
        subtitle: selected.subtitle,
        subtitleEn: selected.subtitleEn ?? selected.subtitle ?? '',
        subtitleAm: selected.subtitleAm ?? '',
        content: selected.content,
        contentEn: selected.contentEn ?? selected.content ?? '',
        contentAm: selected.contentAm ?? '',
        extraNote: selected.extraNote,
        extraNoteEn: selected.extraNoteEn ?? selected.extraNote ?? '',
        extraNoteAm: selected.extraNoteAm ?? '',
        imageUrl: selected.imageUrl || '',
        buttonText: selected.buttonText ?? '',
        buttonLink: selected.buttonLink || '',
        status: selected.status,
        startDate: selected.startDate || '',
        endDate: selected.endDate || '',
        isActive: selected.isActive,
      })
    } catch (selectError) {
      console.error('Failed to load selected weekly knowledge:', selectError)
      setError(`Could not load this entry. ${formatUnknownError(selectError)}`)
    } finally {
      setLoading(false)
    }
  }

  const saveAs = async (status: WeeklyKnowledgeStatus, forceActive = false) => {
    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      const payload: WeeklyKnowledgeEditorInput = {
        ...form,
        status,
        isActive: status === 'published' ? (forceActive ? true : form.isActive) : false,
      }
      if (import.meta.env.DEV) {
        setDevDiagnostics({ action: `save_${status}`, rawFormState: structuredClone(form), normalizedPayload: structuredClone(payload) })
      }
      const id = await saveWeeklyKnowledgeEditor(payload)
      setForm((current) => ({
        ...current,
        id,
        status,
        isActive: status === 'published' ? (forceActive ? true : current.isActive) : false,
      }))
      await loadItems()
      const warnings = buildSoftWarnings(form)
      setNotice(
        status === 'published'
          ? warnings.length > 0
            ? `Weekly knowledge published. ${warnings.join(' ')}`
            : 'Weekly knowledge published successfully.'
          : warnings.length > 0
            ? `Weekly knowledge draft saved. ${warnings.join(' ')}`
            : 'Weekly knowledge draft saved.',
      )
    } catch (saveError) {
      console.error('Failed to save weekly knowledge:', saveError)
      if (import.meta.env.DEV) {
        setDevDiagnostics((current) => ({
          action: current?.action ?? `save_${status}`,
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

  const changeStatus = async (status: WeeklyKnowledgeStatus) => {
    if (!form.id) {
      await saveAs(status, status === 'published')
      return
    }
    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      const active = status === 'published' ? form.isActive : false
      await setWeeklyKnowledgeStatus(form.id, status, active)
      setForm((current) => ({ ...current, status, isActive: active }))
      await loadItems()
      setNotice(
        status === 'hidden'
          ? 'Entry archived/hidden successfully.'
          : status === 'published'
            ? 'Entry published successfully.'
            : 'Entry moved back to draft.',
      )
    } catch (statusError) {
      console.error('Failed to update weekly knowledge status:', statusError)
      if (import.meta.env.DEV) {
        setDevDiagnostics({
          action: `status_change_${status}`,
          errorDetails: extractErrorDebugDetails(statusError),
        })
      }
      setError(formatDevSupabaseError(statusError))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!form.id) return
    try {
      setDeleting(true)
      setError(null)
      setNotice(null)
      if (import.meta.env.DEV) {
        setDevDiagnostics({
          action: 'delete_weekly_knowledge',
          rawFormState: structuredClone(form),
          normalizedPayload: { id: form.id },
        })
      }
      await deleteWeeklyKnowledge(form.id)
      setForm(createEmptyForm())
      setShowDeleteConfirm(false)
      await loadItems()
      setNotice('Weekly knowledge entry deleted permanently.')
    } catch (deleteError) {
      const supabaseDetails = (deleteError as { supabase?: Record<string, unknown> } | null)?.supabase
      if (import.meta.env.DEV) {
        setDevDiagnostics((current) => ({
          action: 'delete_weekly_knowledge',
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'የአደራጅ አርታዒ' : 'Organizer editor'}</p>
        <h1 className="text-2xl font-bold text-brand-900">{isAm ? 'ሳምንታዊ እውቀት' : 'Weekly Knowledge'}</h1>
        <p className="text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'አንድ አጭር ሳምንታዊ የኦርቶዶክስ እውቀት ካርድ ይፍጠሩ እና በሕዝብ ድር ጣቢያ ላይ ያትሙት።'
            : 'Create one short weekly Orthodox insight card and publish it to the public site.'}
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</div> : null}
      {import.meta.env.DEV && devDiagnostics ? (
        <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-800">
          <p className="font-semibold">Dev diagnostics</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(devDiagnostics, null, 2)}</pre>
        </div>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-brand-900">{isAm ? 'ግቤቶች' : 'Entries'}</h2>
          <Button type="button" variant="secondary" onClick={() => setForm(createEmptyForm())}>
            {isAm ? 'አዲስ ግቤት ይፍጠሩ' : 'Create New Entry'}
          </Button>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-brand-700">Loading weekly knowledge entries...</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {items.length === 0 ? (
              <p className="text-sm text-brand-700">No entries yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`rounded-xl border px-3 py-3 text-left ${
                    form.id === item.id ? 'border-accent-600 bg-brand-50' : 'border-brand-200 bg-white hover:bg-brand-50'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {formatStatusLabel(item.status, isAm)}
                    {item.isActive ? (isAm ? ' · ንቁ' : ' · Active') : ''}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {displayBilingualLine(language, item.titleEn, item.titleAm, item.title).trim() || item.title}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-brand-900">
          {isAm ? 'የካርድ ጽሑት (እንግሊዝኛ እና አማርኛ)' : 'Card text (English & Amharic)'}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-brand-600">
          {isAm
            ? 'ለእያንዳንዱ ቋንቋ የተለዩ መስኮች። አንዱ ባዶ ከሆነ ሌላው በሕዝብ ገጹ ላይ ይጠቀማል።'
            : 'Separate fields per language. If one side is empty, the public site uses the other as fallback.'}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ርእስ — እንግሊዝኛ' : 'Title — English'}
            <input
              type="text"
              value={form.titleEn ?? ''}
              onChange={(event) => setForm({ ...form, titleEn: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={isAm ? 'This Week’s Knowledge' : 'This Week’s Knowledge'}
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ርእስ — አማርኛ' : 'Title — Amharic'}
            <input
              type="text"
              value={form.titleAm ?? ''}
              onChange={(event) => setForm({ ...form, titleAm: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder={isAm ? 'የዚህ ሳምንት እውቀት' : 'የዚህ ሳምንት እውቀት'}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ንዑስ ርእስ — እንግሊዝኛ (አማራጭ)' : 'Subtitle — English (optional)'}
            <input
              type="text"
              value={form.subtitleEn ?? ''}
              onChange={(event) => setForm({ ...form, subtitleEn: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ንዑስ ርእስ — አማርኛ (አማራጭ)' : 'Subtitle — Amharic (optional)'}
            <input
              type="text"
              value={form.subtitleAm ?? ''}
              onChange={(event) => setForm({ ...form, subtitleAm: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'ዋና ይዘት — እንግሊዝኛ' : 'Main Content — English'}
          <textarea
            value={form.contentEn ?? ''}
            onChange={(event) => setForm({ ...form, contentEn: event.target.value })}
            rows={4}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'ዋና ይዘት — አማርኛ' : 'Main Content — Amharic'}
          <textarea
            value={form.contentAm ?? ''}
            onChange={(event) => setForm({ ...form, contentAm: event.target.value })}
            rows={4}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'ተጨማሪ ማስታወሻ — እንግሊዝኛ (አማራጭ)' : 'Extra Note — English (optional)'}
          <textarea
            value={form.extraNoteEn ?? ''}
            onChange={(event) => setForm({ ...form, extraNoteEn: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'ተጨማሪ ማስታወሻ — አማርኛ (አማራጭ)' : 'Extra Note — Amharic (optional)'}
          <textarea
            value={form.extraNoteAm ?? ''}
            onChange={(event) => setForm({ ...form, extraNoteAm: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          {isAm ? 'የአዝራር ጽሑት (አማራጭ)' : 'Button label (optional)'}
          <input
            type="text"
            value={form.buttonText ?? ''}
            onChange={(event) => setForm({ ...form, buttonText: event.target.value })}
            className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የምስል አገናኝ (አማራጭ)' : 'Image URL (optional)'}
            <input
              type="url"
              value={form.imageUrl || ''}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'ሁኔታ' : 'Status'}
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as WeeklyKnowledgeStatus })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/40 px-3 text-sm font-medium text-brand-900">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              disabled={form.status !== 'published'}
              className="h-4 w-4 rounded border-brand-300 text-accent-600 focus:ring-accent-600/40"
            />
            {isAm ? 'እንደ ንቁ ያዘጋጁ (በሕዝብ ገጾች ላይ የሚታይ)' : 'Set as Active (used on public pages)'}
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የአዝራር አገናኝ (አማራጭ)' : 'Button Link (optional)'}
            <input
              type="url"
              value={form.buttonLink || ''}
              onChange={(event) => setForm({ ...form, buttonLink: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የመጀመሪያ ቀን (አማራጭ)' : 'Start Date (optional)'}
            <input
              type="date"
              value={form.startDate || ''}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              placeholder={isAm ? 'ወወ/ቀቀ/ዓዓዓዓ' : 'MM/DD/YYYY'}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            {isAm ? 'የማብቂያ ቀን (አማራጭ)' : 'End Date (optional)'}
            <input
              type="date"
              value={form.endDate || ''}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              placeholder={isAm ? 'ወወ/ቀቀ/ዓዓዓዓ' : 'MM/DD/YYYY'}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">{isAm ? 'የማተሚያ ሂደት' : 'Publishing Workflow'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ጽሑፉን ሲያዘጋጁ ረቂቆችን ያስቀምጡ። የዚህ ሳምንት እውቀት በሕዝብ ድር ጣቢያ ላይ እንዲታይ ዝግጁ ሲሆኑ ያትሙ።'
            : 'Save drafts while preparing the text. Publish when ready to make this week’s knowledge visible on the public site.'}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => saveAs('draft')} disabled={saving}>
            Save Draft
          </Button>
          <Button type="button" onClick={() => saveAs('published', true)} disabled={saving}>
            {saving ? 'Saving...' : 'Publish'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => changeStatus('draft')} disabled={saving || !form.id}>
            Unpublish
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            onClick={() => changeStatus('hidden')}
            disabled={saving || !form.id}
          >
            Archive
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving || deleting || !form.id}
          >
            Delete
          </Button>
        </div>
      </section>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-brand-900">Delete weekly knowledge entry?</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              This permanently removes the selected weekly knowledge item from organizer and public views.
            </p>
            <p className="mt-2 text-sm font-medium text-red-700">This action cannot be undone.</p>
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
