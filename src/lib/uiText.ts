import { useUiLanguage } from '../contexts/LanguageContext'

const uiText = {
  home: { en: 'Home', am: 'መነሻ' },
  about: { en: 'About', am: 'ስለ እኛ' },
  mezmurs: { en: 'Mezmurs', am: 'መዝሙሮች' },
  pastClasses: { en: 'Past Classes', am: 'ያለፉ ትምህርቶች' },
  nextClass: { en: 'Next Class', am: 'የሚቀጥለው ትምህርት' },
  viewSummary: { en: 'View Summary', am: 'ማጠቃለያ ይመልከቱ' },
  watchReplay: { en: 'Watch Replay', am: 'ድጋሚ ይመልከቱ' },
  presentationMode: { en: 'Open Presentation Mode', am: 'የፕሬዘንቴሽን ሁኔታን ይክፈቱ' },
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
  watchOnYouTube: { en: 'Watch on YouTube', am: 'በዩቲዩብ ይመልከቱ' },
  practiceOnTewahedoDaily: {
    en: 'Practice on Tewahedo Daily',
    am: 'በተዋሕዶ ዴይሊ ይለማመዱ',
  },
  youtubeComingSoon: { en: 'YouTube link coming soon', am: 'የዩቲዩብ አገናኝ በቅርቡ ይመጣል' },
  contextUpcoming: { en: 'Upcoming', am: 'የሚቀጥለው' },
  contextLastWeek: { en: 'Last week', am: 'ያለፈው ሳምንት' },
  loading: { en: 'Loading...', am: 'በመጫን ላይ...' },
  language: { en: 'Language', am: 'ቋንቋ' },
  footerFeedback: { en: 'Feedback', am: 'ግብረመልስ' },
  footerTeacherYouTube: { en: 'Teacher YouTube', am: 'አስተማሪ ዩቲዩብ' },
  menu: { en: 'Menu', am: 'ዝርዝር' },
  mobileNavHint: {
    en: 'Use the bar below to open the next class, past classes, and mezmurs.',
    am: 'የሚቀጥለውን ክፍል፣ ያለፉ ትምህርቶች እና መዝሙሮች ከታች ካለው አሞሌ ይክፈቱ።',
  },
} as const

type UiTextKey = keyof typeof uiText

export function useUiText() {
  const { language } = useUiLanguage()

  return (key: UiTextKey) => uiText[key][language]
}
