/**
 * Parish facts and support contacts — single source of truth for UI + footer.
 * Update here when schedules or links change.
 */

export const CHURCH_FULL_NAME =
  'EOTC Timirt — Mekane Selam St. Michael Ethiopian Orthodox Tewahedo Church'

/** Hero / home church line (Amharic). */
export const CHURCH_FULL_NAME_AM =
  'EOTC Timirt — መካነ ሰላም ቅዱስ ሚካኤል የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን'

/** Footer church name without the Timirt prefix (bilingual). */
export const CHURCH_FOOTER_LINE_EN =
  'Mekane Selam St. Michael Ethiopian Orthodox Tewahedo Church'

export const CHURCH_FOOTER_LINE_AM =
  'መካነ ሰላም ቅዱስ ሚካኤል የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን'

export const CHURCH_SHORT_NAME = 'Mekane Selam St. Michael Church'

export const CHURCH_ADDRESS = '260 N Clarendon Ave, Scottdale, GA 30079'

/** Current priest and church leadership */
export const PRIEST_INFO = {
  name: 'Melake Selam Kesis Efrem Kebede',
  nameAmharic: 'መላከሰላም ቀሲስ ኤፍሬም ከበደ',
} as const

/** Current teacher information */
export const TEACHER_INFO = {
  name: 'Bekure Sebakian Mehretab Assefa',
  nameAmharic: 'በኩረ ሰባክያን ምህረተአብ አሰፋ',
} as const

/** Official public teaching channel for the Timirt teacher */
export const TEACHER_YOUTUBE_CHANNEL = {
  url: 'https://youtube.com/@orthodoxbiblestudy?si=cbzq6Og9yQv94-6Z',
  title: 'Orthodox Bible Study Channel',
  titleAm: 'የኦርቶዶክስ የመጽሐፍ ቅዱስ ጥናት ቻናል',
  description: 'Watch teachings and Bible study videos from the main teacher channel.',
  descriptionAm: 'ከዋናው የመምህሩ ቻናል ትምህርቶችን እና የመጽሐፍ ቅዱስ ጥናት ቪዲዮዎችን ይመልከቱ።',
} as const

/** Current Timirt topic */
export const CURRENT_TOPIC = {
  english: 'Ekebete Emnet',
  amharic: 'እቅበተ እምነት',
} as const

/** Opens in maps apps; query matches mailing address above. */
export const CHURCH_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=260+N+Clarendon+Ave%2C+Scottdale%2C+GA+30079'

export const TIMIRT_SCHEDULE_LABEL = 'Tuesday · 7:30 PM – 9:00 PM'

/** Same weekly time; Amharic weekday label for home and public UI. */
export const TIMIRT_SCHEDULE_LABEL_AM = 'ማክሰኞ · 7:30 PM – 9:00 PM'

export const TELEGRAM_GROUP_NAME =
  'EOTC Timirt by Mekane Selam St. Michael Church'

/** Public organizer contacts for Timirit logistics (Telegram-capable numbers). */
export const ORGANIZER_SUPPORT = {
  primary: {
    name: 'Eskinder Kassahun',
    phoneDisplay: '+1 (321) 236-2079',
    phoneTel: '+13212362079',
  },
  secondary: {
    name: 'Teddy',
    phoneDisplay: '+1 (770) 330-9364',
    phoneTel: '+17703309364',
  },
} as const

// Google Meet removed from public website per user requirements
// Meeting links are for organizer use only
