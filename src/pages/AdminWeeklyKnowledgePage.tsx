import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import type {
  WeeklyKnowledgeContentType,
  WeeklyKnowledgeEditorInput,
  WeeklyKnowledgeItem,
  WeeklyKnowledgeStatus,
} from '../data/weeklyKnowledge'
import {
  getWeeklyKnowledgeForAdmin,
  listWeeklyKnowledgeForAdmin,
  saveWeeklyKnowledgeEditor,
  setWeeklyKnowledgeStatus,
} from '../lib/supabaseData'

const contentTypes: WeeklyKnowledgeContentType[] = [
  'Knowledge',
  'Fun Fact',
  'Church Reminder',
  'Weekly Greeting',
  'Important Note',
  'Vocabulary / Term of the Week',
]

const statusOptions: Array<{ value: WeeklyKnowledgeStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
]

function formatStatusLabel(status: WeeklyKnowledgeStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? 'Draft'
}

function createEmptyForm(): WeeklyKnowledgeEditorInput {
  const today = new Date().toISOString().slice(0, 10)
  return {
    title: '',
    subtitle: '',
    content: '',
    extraNote: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    contentType: 'Knowledge',
    status: 'draft',
    startDate: today,
    endDate: '',
    isActive: false,
  }
}

function isValidUrl(value: string | undefined) {
  if (!value?.trim()) {
    return true
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function AdminWeeklyKnowledgePage() {
  const [items, setItems] = useState<WeeklyKnowledgeItem[]>([])
  const [form, setForm] = useState<WeeklyKnowledgeEditorInput>(createEmptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      setItems(await listWeeklyKnowledgeForAdmin())
    } catch (loadError) {
      console.error('Failed to load weekly knowledge:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Could not load weekly knowledge entries.')
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
        subtitle: selected.subtitle || '',
        content: selected.content,
        extraNote: selected.extraNote || '',
        imageUrl: selected.imageUrl || '',
        buttonText: selected.buttonText || '',
        buttonLink: selected.buttonLink || '',
        contentType: selected.contentType,
        status: selected.status,
        startDate: selected.startDate || '',
        endDate: selected.endDate || '',
        isActive: selected.isActive,
      })
    } catch (selectError) {
      console.error('Failed to load selected weekly knowledge:', selectError)
      setError(selectError instanceof Error ? selectError.message : 'Could not load this entry.')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Please provide a title and main content.')
      return false
    }
    if (!isValidUrl(form.imageUrl) || !isValidUrl(form.buttonLink)) {
      setError('Please enter valid image/button links or leave them empty.')
      return false
    }
    if (form.buttonLink?.trim() && !form.buttonText?.trim()) {
      setError('Please add button text when using a button link.')
      return false
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setError('End date should be on or after the start date.')
      return false
    }
    return true
  }

  const saveAs = async (status: WeeklyKnowledgeStatus, forceActive = false) => {
    if (!validate()) {
      return
    }
    try {
      setSaving(true)
      setError(null)
      setNotice(null)
      const id = await saveWeeklyKnowledgeEditor({
        ...form,
        status,
        isActive: status === 'published' ? (forceActive ? true : form.isActive) : false,
      })
      setForm((current) => ({
        ...current,
        id,
        status,
        isActive: status === 'published' ? (forceActive ? true : current.isActive) : false,
      }))
      await loadItems()
      setNotice(
        status === 'published'
          ? 'Weekly knowledge published successfully.'
          : 'Weekly knowledge draft saved.',
      )
    } catch (saveError) {
      console.error('Failed to save weekly knowledge:', saveError)
      setError(saveError instanceof Error ? saveError.message : 'Could not save this entry.')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (status: WeeklyKnowledgeStatus) => {
    if (!form.id) {
      setError('Save this entry first before changing its status.')
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
      setError(statusError instanceof Error ? statusError.message : 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Organizer editor</p>
        <h1 className="text-2xl font-bold text-brand-900">Weekly Knowledge</h1>
        <p className="text-sm leading-relaxed text-brand-700">
          Create one short weekly Orthodox insight card and publish it to the public site.
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</div> : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-brand-900">Entries</h2>
          <Button type="button" variant="secondary" onClick={() => setForm(createEmptyForm())}>
            Create new entry
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
                    {item.contentType} · {formatStatusLabel(item.status)}
                    {item.isActive ? ' · Active' : ''}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">{item.title}</p>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            Title
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
              placeholder="This Week's Knowledge"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Subtitle (optional)
            <input
              type="text"
              value={form.subtitle || ''}
              onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          Main content
          <textarea
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            rows={4}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-brand-900">
          Extra note (optional)
          <textarea
            value={form.extraNote || ''}
            onChange={(event) => setForm({ ...form, extraNote: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-brand-900">
            Image URL (optional)
            <input
              type="url"
              value={form.imageUrl || ''}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Content type
            <select
              value={form.contentType}
              onChange={(event) => setForm({ ...form, contentType: event.target.value as WeeklyKnowledgeContentType })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            >
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-brand-900">
            Status
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
            Set as active (used on public pages)
          </label>
          <label className="text-sm font-medium text-brand-900">
            Button text (optional)
            <input
              type="text"
              value={form.buttonText || ''}
              onChange={(event) => setForm({ ...form, buttonText: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Button link (optional)
            <input
              type="url"
              value={form.buttonLink || ''}
              onChange={(event) => setForm({ ...form, buttonLink: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            Start date (optional)
            <input
              type="date"
              value={form.startDate || ''}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
          <label className="text-sm font-medium text-brand-900">
            End date (optional)
            <input
              type="date"
              value={form.endDate || ''}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-brand-200 px-3 text-base text-brand-900 outline-none focus:ring-2 focus:ring-accent-600/30"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-900">Publish workflow</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Save drafts while preparing text. Publish when ready to make this week&apos;s knowledge visible.
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
        </div>
      </section>
    </div>
  )
}
