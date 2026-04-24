import type { WeeklyClass } from '../data/types'
import { CURRENT_TOPIC, TEACHER_INFO } from '../site/constants'

const LEGACY_TOPIC_ENGLISH = 'Ekebete Ement'

function topicMatchesCanonicalEnglish(topic: string | undefined, topicEn: string | undefined): boolean {
  const t = topic?.trim() ?? ''
  const te = topicEn?.trim() ?? ''
  return (
    t === CURRENT_TOPIC.english ||
    te === CURRENT_TOPIC.english ||
    t === LEGACY_TOPIC_ENGLISH ||
    te === LEGACY_TOPIC_ENGLISH
  )
}

/** Topic line for public UI: Amharic UI prefers `topicAm`, then known English → Amharic title. */
export function displayWeeklyClassTopic(week: WeeklyClass, language: 'en' | 'am'): string {
  if (language === 'am') {
    const am = week.topicAm?.trim()
    if (am) return am
    if (topicMatchesCanonicalEnglish(week.topic, week.topicEn)) {
      return CURRENT_TOPIC.amharic
    }
    return week.topic
  }
  const en = week.topicEn?.trim()
  if (en) return en
  return week.topic
}

/** Speaker line: use Amharic name when it matches the primary teacher. */
export function displayWeeklyClassSpeaker(week: WeeklyClass, language: 'en' | 'am'): string {
  if (language === 'am' && week.speaker?.trim() === TEACHER_INFO.name) {
    return TEACHER_INFO.nameAmharic
  }
  return week.speaker
}

export function recapCardFieldLabels(language: 'en' | 'am'): { date: string; topic: string; teacher: string } {
  if (language === 'am') {
    return { date: 'ቀን:', topic: 'ርእስ:', teacher: 'መምህር:' }
  }
  return { date: 'Date:', topic: 'Topic:', teacher: 'Teacher:' }
}
