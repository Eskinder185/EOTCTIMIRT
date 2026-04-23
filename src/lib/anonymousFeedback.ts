export const anonymousFeedbackCategories = [
  'Website feedback',
  'Teaching feedback',
  'Topic suggestion',
  'Prayer / support note',
  'General message',
] as const

export type AnonymousFeedbackCategory = (typeof anonymousFeedbackCategories)[number]

export interface AnonymousFeedbackInput {
  category: AnonymousFeedbackCategory
  subject?: string
  message: string
}

const FEEDBACK_EMAIL_TO = 'eskewabe185@gmail.com'

export function buildAnonymousFeedbackMailto(input: AnonymousFeedbackInput): string {
  const category = input.category.trim()
  const subjectLine = input.subject?.trim()
  const message = input.message.trim()

  const emailSubject = `EOTC Timirt Feedback - ${category}`
  const bodyLines = [
    `Category: ${category}`,
    ...(subjectLine ? [`Subject: ${subjectLine}`] : []),
    '',
    'Message:',
    message,
  ]
  const body = bodyLines.join('\n')
  return `mailto:${FEEDBACK_EMAIL_TO}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`
}