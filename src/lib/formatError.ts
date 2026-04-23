/**
 * Turn Supabase Postgrest errors (plain objects) and other throws into a readable string.
 */
export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const o = error as Record<string, unknown>
    const msg = typeof o.message === 'string' ? o.message : ''
    const code = typeof o.code === 'string' ? o.code : ''
    const details = typeof o.details === 'string' ? o.details : ''
    const hint = typeof o.hint === 'string' ? o.hint : ''
    const parts = [msg, code ? `[${code}]` : '', details, hint].filter((p) => p.length > 0)
    if (parts.length > 0) {
      return parts.join(' · ')
    }
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

export interface ErrorDebugDetails {
  message?: string
  details?: string
  hint?: string
  code?: string
  full: unknown
}

export function extractErrorDebugDetails(error: unknown): ErrorDebugDetails {
  if (typeof error === 'object' && error !== null) {
    const o = error as Record<string, unknown>
    return {
      message: typeof o.message === 'string' ? o.message : undefined,
      details: typeof o.details === 'string' ? o.details : undefined,
      hint: typeof o.hint === 'string' ? o.hint : undefined,
      code: typeof o.code === 'string' ? o.code : undefined,
      full: error,
    }
  }

  if (typeof error === 'string') {
    return { message: error, full: error }
  }

  return { full: error }
}
