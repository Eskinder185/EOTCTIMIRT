import { MOCK_UPCOMING } from './mockUpcoming'
import { MOCK_WEEKS } from './mockWeeks'
import type { WeeklyClass } from './types'

export type UpcomingTimirtPreview = typeof MOCK_UPCOMING

let weeklyClassesCache: WeeklyClass[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000

function byDateDesc(a: WeeklyClass, b: WeeklyClass) {
  return new Date(b.date).getTime() - new Date(a.date).getTime()
}

function getMockWeeks() {
  return [...MOCK_WEEKS].sort(byDateDesc)
}

export async function listWeeks(): Promise<WeeklyClass[]> {
  const now = Date.now()

  if (weeklyClassesCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return weeklyClassesCache
  }

  const sorted = getMockWeeks()
  weeklyClassesCache = sorted
  cacheTimestamp = now

  return sorted
}

export async function getWeekById(id: string): Promise<WeeklyClass | undefined> {
  return getMockWeeks().find((week) => week.id === id)
}

export async function getCurrentWeek(): Promise<WeeklyClass | null> {
  const weeks = await listWeeks()
  return weeks[0] || null
}

export async function getUpcomingPreview(): Promise<UpcomingTimirtPreview | null> {
  return MOCK_UPCOMING
}

export function clearWeeksCache(): void {
  weeklyClassesCache = null
  cacheTimestamp = 0
}
