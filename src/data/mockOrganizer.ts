import type {
  AttendanceSlice,
  OrganizerSnapshot,
  RecapSuggestion,
} from './types'
import { CURRENT_TOPIC } from '../site/constants'

/** Mock weekly rollups — replace with SQL aggregates later. */
export const MOCK_ORGANIZER_WEEKS: OrganizerSnapshot[] = [
  {
    weekId: '2026-04-01',
    weekLabel: 'Apr 1',
    totalResponses: 11,
    reviewedOrWatched: 8,
    mostMissedQuestionId: 'q2',
    mostMissedQuestionLabel: 'Psalm 23 tone',
    missRatePercent: 42,
    topUnclearTopics: [
      'Difference between hearing and obeying',
      'How late arrival still fits the flock image',
    ],
    languageDifficultyAvg: 2.4,
  },
  {
    weekId: '2026-04-08',
    weekLabel: 'Apr 8',
    totalResponses: 13,
    reviewedOrWatched: 10,
    mostMissedQuestionId: 'q1',
    mostMissedQuestionLabel: 'Matthew 6 habit link',
    missRatePercent: 35,
    topUnclearTopics: [
      'Forgiving someone not sorry',
      'Fasting without pride',
    ],
    languageDifficultyAvg: 2.7,
  },
  {
    weekId: '2026-04-15',
    weekLabel: 'Apr 15',
    totalResponses: 9,
    reviewedOrWatched: 7,
    mostMissedQuestionId: 'q1',
    mostMissedQuestionLabel: `${CURRENT_TOPIC.english} definition`,
    missRatePercent: 38,
    topUnclearTopics: [
      `${CURRENT_TOPIC.english} in daily Orthodox life`,
      `How to guard ${CURRENT_TOPIC.amharic} with humility`,
    ],
    languageDifficultyAvg: 3.1,
  },
]

export const MOCK_ATTENDANCE_NEXT: AttendanceSlice[] = [
  { label: 'In person', value: 5, fill: '#5c7c6a' },
  { label: 'Online', value: 3, fill: '#6b8cae' },
  { label: 'Maybe', value: 4, fill: '#c6a24a' },
  { label: 'Cannot attend', value: 2, fill: '#a89b8f' },
]

/** Example “lowest comprehension” signals for the latest published class. */
export const MOCK_QUESTION_MISS_LATEST = [
  { label: `MC: ${CURRENT_TOPIC.english} meaning`, missed: 5 },
  { label: `MC: guarding ${CURRENT_TOPIC.amharic}`, missed: 2 },
  { label: 'Reflection prompts', missed: 1 },
]

export const MOCK_RECAP_SUGGESTIONS: RecapSuggestion[] = [
  {
    title: `Revisit ${CURRENT_TOPIC.english} clearly`,
    detail:
      `Several notes asked what ${CURRENT_TOPIC.english} (${CURRENT_TOPIC.amharic}) means in ordinary Orthodox life — a short clarification next Tuesday would help.`,
  },
  {
    title: 'Quick Psalm 23 refresher',
    detail: 'Still a comfort anchor for people catching up mid-week.',
  },
  {
    title: 'Invite questions in English after Amharic section',
    detail: 'Language difficulty ticked up; a short bilingual pause lowers pressure.',
  },
]
