/** Full weekday + date; pass `am` for Amharic locale (homepage, mezmurs, etc.). */
export function formatClassDate(iso: string, language: 'en' | 'am' = 'en') {
  const d = new Date(`${iso}T12:00:00`)
  const locale = language === 'am' ? 'am-ET' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}
