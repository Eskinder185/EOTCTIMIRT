import type { WeeklyClass } from './types'
import type { UpcomingTimirtPreview } from './mockUpcoming'
import { getUpcomingTimirt, getWeeklyClass, getWeeklyClasses } from '../lib/supabaseData'

let weeklyClassesCache: WeeklyClass[] | null = null
let currentWeekCache: WeeklyClass | null | undefined
let upcomingPreviewCache: UpcomingTimirtPreview | null | undefined
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000

export async function listWeeks(): Promise<WeeklyClass[]> {
  const now = Date.now()

  if (weeklyClassesCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return weeklyClassesCache
  }

  const weeks = await getWeeklyClasses()
  weeklyClassesCache = weeks
  cacheTimestamp = now

  return weeks
}

export async function getWeekById(id: string): Promise<WeeklyClass | undefined> {
  if (weeklyClassesCache) {
    const cached = weeklyClassesCache.find((week) => week.id === id)
    if (cached) {
      return cached
    }
  }

  const week = await getWeeklyClass(id)
  return week ?? undefined
}

export async function getCurrentWeek(): Promise<WeeklyClass | null> {
  const now = Date.now()

  if (currentWeekCache !== undefined && (now - cacheTimestamp < CACHE_DURATION)) {
    return currentWeekCache
  }

  const weeks = await listWeeks()
  currentWeekCache = weeks[0] || null
  return currentWeekCache
}

export async function getUpcomingPreview(): Promise<UpcomingTimirtPreview | null> {
  const now = Date.now()

  if (upcomingPreviewCache !== undefined && (now - cacheTimestamp < CACHE_DURATION)) {
    return upcomingPreviewCache
  }

  const preview = await getUpcomingTimirt()
  upcomingPreviewCache = preview
  return preview
}

export function clearWeeksCache(): void {
  weeklyClassesCache = null
  currentWeekCache = undefined
  upcomingPreviewCache = undefined
  cacheTimestamp = 0
}
