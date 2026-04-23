import type { Mezmur } from './types'

/**
 * Preview for the *next* Tuesday Timirit (mock).
 * In production this would come from the same CMS row as the published “next” session.
 */
export interface UpcomingTimirtPreview {
  /** ISO date for the upcoming Tuesday session */
  scheduledDate: string
  topicPreview: string
  topicPreviewEn?: string
  topicPreviewAm?: string
  /** Short note for the parish bulletin tone — Holy Tradition, not hype */
  note: string
  noteEn?: string
  noteAm?: string
  lessonYoutubeUrl?: string
  lessonAudioUrl?: string
  lessonAudioTitle?: string
  lessonAudioTitleEn?: string
  lessonAudioTitleAm?: string
  lessonNote?: string
  lessonNoteEn?: string
  lessonNoteAm?: string
  weeklyKnowledgeContent?: string
  weeklyKnowledgeContentEn?: string
  weeklyKnowledgeContentAm?: string
  weeklyKnowledgeImageUrl?: string
  keyVerse?: string
  organizerNote?: string
  organizerNoteEn?: string
  organizerNoteAm?: string
  status?: 'draft' | 'published'
  mezmurs: [Mezmur, Mezmur]
}

export const MOCK_UPCOMING: UpcomingTimirtPreview = {
  scheduledDate: '2026-04-22',
  topicPreview: 'The Mother of God in the teaching of the Ethiopian Orthodox Tewahedo Church',
  note:
    'We will hear from the Divine Liturgy, the Synaxarium, and the Fathers on how the Theotokos is honored rightly in our Church.',
  mezmurs: [
    {
      title: 'ወላዲተ አምላክ',
      transliteration: 'Waladite Amlak',
      lyrics: 'Lyrics to be confirmed with your mezmur leaders.',
    },
    {
      title: 'ዘድንግል ማርያም',
      transliteration: 'Ze-Dengel Mariyam',
      lyrics: 'Lyrics to be confirmed with your mezmur leaders.',
    },
  ],
}
