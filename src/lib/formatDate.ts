/** Tuesday cards read cleaner with a short English label + ISO backup for screen readers. */
export function formatClassDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}
