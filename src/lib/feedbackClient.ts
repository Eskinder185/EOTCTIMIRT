/**
 * Client boundary for learner submissions.
 * Today: localStorage draft for demos offline.
 * Tomorrow: swap implementation for Supabase/Firebase insert + RLS rules.
 */

export interface ClassSubmissionPayload {
  weekId: string
  answers: Record<string, string>
  submittedAt: string
}

const STORAGE_KEY = 'eotc_timirt_submissions_v1'

function readAll(): ClassSubmissionPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClassSubmissionPayload[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveClassSubmission(payload: ClassSubmissionPayload) {
  const next = [...readAll().filter((s) => s.weekId !== payload.weekId), payload]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function getSubmissionForWeek(
  weekId: string,
): ClassSubmissionPayload | undefined {
  return readAll().find((s) => s.weekId === weekId)
}
