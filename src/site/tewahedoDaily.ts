/** External reference links used as optional mezmur support. */
export const TEWAHEDO_DAILY_BASE = 'https://tewahedodaily.pages.dev'

export const TEWAHEDO_DAILY_PRAYERS_URL = `${TEWAHEDO_DAILY_BASE}/prayers`
export const TEWAHEDO_DAILY_CALENDAR_URL = `${TEWAHEDO_DAILY_BASE}/calendar`
export const TEWAHEDO_DAILY_MEZMURS_URL = `${TEWAHEDO_DAILY_BASE}/mezmurs`

export const tewahedoDailyLinks = [
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Quiet calendar lookup for fasts, feasts, and commemorations.',
    href: TEWAHEDO_DAILY_CALENDAR_URL,
  },
  {
    id: 'mezmur-practice',
    label: 'Mezmur Practice',
    description: 'Extra practice support when the weekly mezmur is already available there.',
    href: TEWAHEDO_DAILY_MEZMURS_URL,
  },
  {
    id: 'orthodox-resources',
    label: 'Orthodox Resources',
    description: 'A small set of additional Orthodox references from Tewahedo Daily.',
    href: TEWAHEDO_DAILY_BASE,
  },
] as const
