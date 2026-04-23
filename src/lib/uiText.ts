import { useUiLanguage } from '../contexts/LanguageContext'

const uiText = {
  home: { en: 'Home', am: 'መነሻ' },
  about: { en: 'About', am: 'ስለ እኛ' },
  mezmurs: { en: 'Mezmurs', am: 'መዝሙሮች' },
  pastClasses: { en: 'Past Classes', am: 'ያለፉ ትምህርቶች' },
  nextClass: { en: 'Next Class', am: 'የሚቀጥለው ትምህርት' },
  viewSummary: { en: 'View Summary', am: 'ማጠቃለያ ይመልከቱ' },
  watchReplay: { en: 'Watch Replay', am: 'ድጋሚ ይመልከቱ' },
  presentationMode: { en: 'Presentation Mode', am: 'የማቅረቢያ ሁኔታ' },
  prayer: { en: 'Prayer', am: 'ጸሎት' },
  calendar: { en: 'Calendar', am: 'የቀን መቁጠሪያ' },
  theme: { en: 'Theme', am: 'ገጽታ' },
  day: { en: 'Day', am: 'ቀን' },
  night: { en: 'Night', am: 'ማታ' },
  anonymousFeedback: { en: 'Anonymous Feedback', am: 'ስም ያልተጠቀሰ አስተያየት' },
  organizers: { en: 'Organizers', am: 'አስተባባሪዎች' },
  upcomingMezmurs: { en: 'Upcoming Mezmurs', am: 'የሚቀጥሉ መዝሙሮች' },
  mezmurPractice: { en: 'Mezmur Practice', am: 'የመዝሙር ልምምድ' },
  openYouTube: { en: 'Open YouTube', am: 'YouTube ይክፈቱ' },
  openPractice: { en: 'Open Practice', am: 'ልምምድ ይክፈቱ' },
  watchOnYouTube: { en: 'Watch on YouTube', am: 'በ YouTube ይመልከቱ' },
  practiceOnTewahedoDaily: {
    en: 'Practice on Tewahedo Daily',
    am: 'በ Tewahedo Daily ልምምድ',
  },
  youtubeComingSoon: { en: 'YouTube link coming soon', am: 'የ YouTube አገናኝ በቅርቡ ይመጣል' },
  contextUpcoming: { en: 'Upcoming', am: 'የሚመጣ' },
  contextLastWeek: { en: 'Last week', am: 'ያለፈ ሳምንት' },
  loading: { en: 'Loading...', am: 'በመጫን ላይ...' },
  language: { en: 'Language', am: 'ቋንቋ' },
} as const

type UiTextKey = keyof typeof uiText

export function useUiText() {
  const { language } = useUiLanguage()

  return (key: UiTextKey) => uiText[key][language]
}
