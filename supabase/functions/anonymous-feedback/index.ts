import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const allowedCategories = new Set([
  'Website feedback',
  'Teaching feedback',
  'Future topic suggestion',
  'General note',
])

const FEEDBACK_LIMIT = 5
const WINDOW_MINUTES = 60
const BLOCK_MINUTES = 120

type FeedbackPayload = {
  category?: string
  subject?: string
  message?: string
  website?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sendEmail(params: {
  toEmail: string
  fromEmail: string
  resendApiKey: string
  category: string
  subject: string
  message: string
}) {
  const emailSubject = `[EOTC Timirt] ${params.category}${params.subject ? ` - ${params.subject}` : ''}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('email-timeout'), 12000)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.fromEmail,
      to: [params.toEmail],
      subject: emailSubject,
      text: [
        'Anonymous Feedback & Topic Suggestions',
        '',
        `Category: ${params.category}`,
        `Subject: ${params.subject || '(none)'}`,
        '',
        params.message,
      ].join('\n'),
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Email provider error: ${errorText}`)
  }
}

Deno.serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const toEmail = Deno.env.get('FEEDBACK_TO_EMAIL')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FEEDBACK_FROM_EMAIL')
    const missingConfig = [
      !supabaseUrl ? 'SUPABASE_URL' : null,
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
      !toEmail ? 'FEEDBACK_TO_EMAIL' : null,
      !resendApiKey ? 'RESEND_API_KEY' : null,
      !fromEmail ? 'FEEDBACK_FROM_EMAIL' : null,
    ].filter((item): item is string => item !== null)

    if (missingConfig.length > 0) {
      return jsonResponse(
        {
          error:
            `Server configuration for anonymous feedback is incomplete. Missing: ${missingConfig.join(', ')}.`,
        },
        500,
      )
    }

    let payload: FeedbackPayload
    try {
      payload = (await request.json()) as FeedbackPayload
    } catch {
      return jsonResponse({ error: 'Invalid request body. Please submit the form again.' }, 400)
    }

    const category = payload.category?.trim() || ''
    const subject = payload.subject?.trim() || ''
    const message = payload.message?.trim() || ''
    const honeypot = payload.website?.trim() || ''

    if (honeypot) {
      return jsonResponse({ ok: true })
    }

    if (!allowedCategories.has(category)) {
      return jsonResponse({ error: 'Please choose a valid category.' }, 400)
    }

    if (!message || message.length < 8) {
      return jsonResponse({ error: 'Please enter a fuller message before submitting.' }, 400)
    }

    if (message.length > 3000 || subject.length > 120) {
      return jsonResponse({ error: 'Please shorten the submission and try again.' }, 400)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown-ip'
    const userAgent = request.headers.get('user-agent') || 'unknown-agent'
    const identifierHash = await sha256(`${forwardedFor}|${userAgent}`)
    const now = new Date()

    const { data: existingRateLimit, error: rateLimitReadError } = await supabase
      .from('anonymous_feedback_rate_limits')
      .select('identifier_hash, window_started_at, submission_count, blocked_until')
      .eq('identifier_hash', identifierHash)
      .maybeSingle()

    if (rateLimitReadError) {
      console.error(rateLimitReadError)
      return jsonResponse({ error: 'Unable to process the submission right now.' }, 500)
    }

    if (existingRateLimit?.blocked_until && new Date(existingRateLimit.blocked_until) > now) {
      return jsonResponse({ error: 'Too many submissions from this device right now. Please try again later.' }, 429)
    }

    const windowStart = existingRateLimit?.window_started_at
      ? new Date(existingRateLimit.window_started_at)
      : now
    const windowExpired = now.getTime() - windowStart.getTime() > WINDOW_MINUTES * 60 * 1000
    const submissionCount = windowExpired ? 0 : existingRateLimit?.submission_count ?? 0
    const nextCount = submissionCount + 1
    const blockedUntil = nextCount > FEEDBACK_LIMIT
      ? new Date(now.getTime() + BLOCK_MINUTES * 60 * 1000).toISOString()
      : null

    const { error: rateLimitWriteError } = await supabase
      .from('anonymous_feedback_rate_limits')
      .upsert({
        identifier_hash: identifierHash,
        window_started_at: windowExpired ? now.toISOString() : windowStart.toISOString(),
        submission_count: nextCount,
        blocked_until: blockedUntil,
      })

    if (rateLimitWriteError) {
      console.error(rateLimitWriteError)
      return jsonResponse({ error: 'Unable to process the submission right now.' }, 500)
    }

    if (blockedUntil) {
      return jsonResponse({ error: 'Too many submissions from this device right now. Please try again later.' }, 429)
    }

    const { error: insertError } = await supabase.from('anonymous_feedback_submissions').insert({
      category,
      subject: subject || null,
      message,
    })

    if (insertError) {
      console.error(insertError)
      return jsonResponse({ error: 'Unable to save the submission right now.' }, 500)
    }

    try {
      await sendEmail({
        toEmail,
        fromEmail,
        resendApiKey,
        category,
        subject,
        message,
      })
    } catch (emailError) {
      console.error(emailError)
      return jsonResponse({ error: 'Your note was saved, but email delivery is not configured correctly yet.' }, 500)
    }

    return jsonResponse({ ok: true })
  } catch (unexpectedError) {
    console.error('Unexpected anonymous feedback handler error:', unexpectedError)
    return jsonResponse({ error: 'Unexpected server error while submitting feedback.' }, 500)
  }
})