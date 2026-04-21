/** External reference links used as optional mezmur support. */
export const TEWAHEDO_DAILY_BASE = 'https://tewahedodaily.pages.dev'

export const TEWAHEDO_DAILY_PRAYERS_URL = `${TEWAHEDO_DAILY_BASE}/prayers`
export const TEWAHEDO_DAILY_CALENDAR_URL = `${TEWAHEDO_DAILY_BASE}/calendar`
export const TEWAHEDO_DAILY_MEZMURS_URL = `${TEWAHEDO_DAILY_BASE}/mezmurs`

export const tewahedoDailyLinks = [
  {
    id: 'prayer-resources',
    label: 'Prayer references',
    description: 'Optional prayer texts if a mezmur review leads you back to daily prayer.',
    href: TEWAHEDO_DAILY_PRAYERS_URL,
  },
  {
    id: 'calendar',
    label: 'Calendar reference',
    description: 'Quiet calendar lookup for fasts, feasts, and commemorations.',
    href: TEWAHEDO_DAILY_CALENDAR_URL,
  },
  {
    id: 'mezmur-practice',
    label: 'Mezmur practice help',
    description: 'Extra practice support when the weekly mezmur is already available there.',
    href: TEWAHEDO_DAILY_MEZMURS_URL,
  },
  {
    id: 'mezmur-lyrics',
    label: 'Mezmur lyrics help',
    description: 'Optional lyrics lookup for the same weekly hymn when needed.',
    href: TEWAHEDO_DAILY_MEZMURS_URL,
  },
] as const
