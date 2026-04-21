import { getWeeklyClasses, getWeeklyClass, getUpcomingTimirt } from '../lib/supabaseData'
import { MOCK_UPCOMING } from './mockUpcoming'
import { MOCK_WEEKS } from './mockWeeks'
import type { UpcomingTimirtPreview, WeeklyClass } from './types'

// Cache for performance - data doesn't change frequently
let weeklyClassesCache: WeeklyClass[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function byDateDesc(a: WeeklyClass, b: WeeklyClass) {
  return new Date(b.date).getTime() - new Date(a.date).getTime()
}

function getMockWeeks() {
  return [...MOCK_WEEKS].sort(byDateDesc)
}

/** All weeks, newest first — good for archives and dashboards. */
export async function listWeeks(): Promise<WeeklyClass[]> {
  const now = Date.now()
  
  // Use cache if available and not expired
  if (weeklyClassesCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return weeklyClassesCache
  }

  try {
    const classes = await getWeeklyClasses()
    const sorted = classes.length > 0 ? [...classes].sort(byDateDesc) : getMockWeeks()
    
    // Update cache
    weeklyClassesCache = sorted
    cacheTimestamp = now
    
    return sorted
  } catch (error) {
    console.error('Failed to fetch weekly classes:', error)

    // Return cached data if available, otherwise the local mock content.
    return weeklyClassesCache || getMockWeeks()
  }
}

export async function getWeekById(id: string): Promise<WeeklyClass | undefined> {
  try {
    const weeklyClass = await getWeeklyClass(id)
    if (weeklyClass) {
      return weeklyClass
    }
  } catch (error) {
    console.error(`Failed to fetch weekly class ${id}:`, error)
  }

  return getMockWeeks().find((week) => week.id === id)
}

/**
 * "Current" week for marketing CTAs: newest dated session.
 * Returns the most recently published weekly class.
 */
export async function getCurrentWeek(): Promise<WeeklyClass | null> {
  try {
    const weeks = await listWeeks()
    return weeks[0] || null
  } catch (error) {
    console.error('Failed to get current week:', error)
    return null
  }
}

export async function getUpcomingPreview(): Promise<UpcomingTimirtPreview | null> {
  try {
    const upcoming = await getUpcomingTimirt()
    return upcoming ?? MOCK_UPCOMING
  } catch (error) {
    console.error('Failed to get upcoming preview:', error)
    return MOCK_UPCOMING
  }
}

// Clear cache function for admin use
export function clearWeeksCache(): void {
  weeklyClassesCache = null
  cacheTimestamp = 0
}
