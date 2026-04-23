import { CURRENT_TOPIC, TEACHER_INFO } from '../site/constants'
import type { WeeklyClass } from './types'

/**
 * Example content only — swap for CMS/DB later.
 * Two mezmurs per week are always present so the home + archive stay predictable.
 */
export const MOCK_WEEKS: WeeklyClass[] = [
  {
    id: '2026-04-01',
    date: '2026-04-01',
    topic: 'The Good Shepherd and care for the flock',
    speaker: 'Dn. Daniel T.',
    amharicSummary:
      'የመጽሐፍ ቅዱስ መዝሙር በእርሱ እንደ በግ እንደምንመራ ተነጋገርን። እግዚአብሔር እንዴት በዕለት ተወልዶ በሰው ልጆች ዘንድ ይገኛል ተመለከትን።',
    englishSummary:
      'In this Ethiopian Orthodox Tewahedo Timirit we contemplated Our Lord as the Good Shepherd of the flock of His One Holy Church, guided by the Gospel of John and the Psalms of Prophet-King David.',
    keyPoints: [
      'Discerning Christ’s voice grows through prayer, fasting, and the Holy Communion received in the communion of the Church.',
      'The Shepherd’s patience toward the sheep who arrive late reflects the mercy shown in the lives of the Holy Fathers and Mothers.',
      'The Divine Liturgy, Scripture, and patristic teaching together guard us from wandering alone outside the fold.',
    ],
    feedbackSummary:
      'Families asked for a slower walk through how the shepherd image applies inside the Divine Liturgy.',
    attendanceSummary:
      'Most responses expect in-person presence; a few households requested alternative access for illness.',
    verses: ['John 10:11-16', 'Psalm 23'],
    youtubeUrl: '',
    mezmurs: [
      {
        title: 'የጎረስ መዝሙር',
        transliteration: 'Ye-Goros Mezmur',
        lyrics: 'Placeholder lyrics — replace with liturgical text from your choir.',
        youtubeUrl: 'https://www.youtube.com/watch?v=placeholder1',
      },
      {
        title: 'መዝሙር ዘማርያም',
        transliteration: 'Mezmur ze-Mariyam',
        lyrics: 'Placeholder lyrics — replace with liturgical text from your choir.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        prompt: 'According to the Gospel of John, how do Christ’s sheep know Him?',
        helperText: 'Choose the answer closest to the Holy Gospel we heard.',
        options: [
          { en: 'They rely only on private opinions', am: '' },
          { en: 'They hear His voice in the life of the Church and follow Him', am: '' },
          { en: 'They never grow tired', am: '' },
          { en: 'They avoid the Divine Liturgy', am: '' },
        ],
        correctIndex: 1,
        explanation:
          'Christ unites His flock to Himself through the Church’s preaching, Mysteries, and obedience of faith — not through self-chosen isolation.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        prompt: 'Which image best matches Psalm 23’s consolation for the faithful?',
        options: [
          { en: 'A harsh accuser', am: '' },
          { en: 'A shepherd who leads beside still waters', am: '' },
          { en: 'A stranger who hides', am: '' },
          { en: 'A voice without the Church', am: '' },
        ],
        correctIndex: 1,
        explanation:
          'Prophet David sings of the Lord who feeds, guides, and anoints His people — the same mercy we taste mystically in the Holy Eucharist.',
      },
      {
        id: 'q3',
        type: 'reflection',
        prompt: 'Where can you show Christ-like gentleness to a brother or sister this week?',
        helperText: 'One humble sentence is enough.',
        placeholder: 'Example: at home, in traffic, toward a newcomer…',
      },
      {
        id: 'q4',
        type: 'feedback-open',
        prompt: 'What was unclear or needs more explanation?',
        helperText: 'Teachers use this only to prepare a merciful review next Tuesday.',
        placeholder: 'Optional — share as much or as little as you want.',
      },
      {
        id: 'q5',
        type: 'attendance',
        prompt: 'Are you likely to attend next Tuesday?',
        options: [
          { value: 'in-person', label: 'In person' },
          { value: 'online', label: 'Online' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'cannot-attend', label: 'Cannot attend' },
        ],
      },
    ],
  },
  {
    id: '2026-04-08',
    date: '2026-04-08',
    topic: 'Forgiveness and the heart’s healing',
    speaker: 'Memhir Kidan',
    amharicSummary:
      'የሰው ልጅ ልብ እግዚአብሔርን በመውደድ እንዴት ይፈወዳል እና ቅዱስ አባቶች ምሕረትን እንዴት አስተምረውናል ተወያይን።',
    englishSummary:
      'We studied forgiveness as a gift of the Holy Trinity and a cross-bearing path within the Ethiopian Orthodox Tewahedo Church, hearing the Lord’s prayer in Matthew and the counsels of the Holy Fathers on mercy.',
    keyPoints: [
      'Forgiveness flows first from God’s compassion, then becomes our ascetic labor with the blessing of a spiritual father.',
      'Guarding the heart from bitterness belongs to the same fasts and prostrations that soften the soul toward neighbors.',
      'Holy Confession in the Church is healing oil, not a courtroom sentence.',
    ],
    feedbackSummary:
      'Several notes asked how to forgive when trust is wounded — plan a short word on remembrance vs. hatred.',
    attendanceSummary:
      'Online intentions rose slightly because of night-shift work schedules.',
    verses: ['Matthew 6:14-15', 'Colossians 3:12-13'],
    mezmurs: [
      {
        title: 'እግዚአብሔር ሆይ ይቅር በለኝ',
        transliteration: 'Igziabhier Hoy yiqer belagn',
        lyrics: 'Placeholder lyrics — replace with liturgical text from your choir.',
      },
      {
        title: 'ዘእግዚአብሔር አምላክ',
        transliteration: 'Ze-Igziabhier Amlak',
        youtubeUrl: 'https://www.youtube.com/watch?v=placeholder2',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        prompt: 'In Matthew 6, forgiveness is tied to which habit?',
        options: [
          { en: 'Pride', am: '' },
          { en: 'Prayer', am: '' },
          { en: 'Ignoring others', am: '' },
          { en: 'Avoiding church', am: '' },
        ],
        correctIndex: 1,
        explanation:
          'In the Lord’s Prayer we ask the Father to forgive us as we forgive — the Church teaches this as a whole way of life, not a slogan.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        prompt: 'In this week’s teaching, a “healed heart” chiefly means…',
        options: [
          { en: 'Never remembering any sorrow', am: '' },
          { en: 'Being strengthened by grace to show mercy like Christ', am: '' },
          { en: 'Avoiding confession', am: '' },
          { en: 'Trusting only private feelings', am: '' },
        ],
        correctIndex: 1,
        explanation:
          'Healing, for the Orthodox faithful, means receiving grace to walk the path of mercy within the Church — not pretending injustice never occurred.',
      },
      {
        id: 'q3',
        type: 'short-answer',
        prompt: 'Name one person for whom you will ask Christ’s blessing this week.',
        placeholder: 'First name only is fine',
      },
      {
        id: 'q4',
        type: 'feedback-open',
        prompt: 'What was unclear or needs more explanation?',
        placeholder: 'Optional — helps organizers prepare a short recap.',
      },
      {
        id: 'q5',
        type: 'attendance',
        prompt: 'Are you likely to attend next Tuesday?',
        options: [
          { value: 'in-person', label: 'In person' },
          { value: 'online', label: 'Online' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'cannot-attend', label: 'Cannot attend' },
        ],
      },
    ],
  },
  {
    id: '2026-04-15',
    date: '2026-04-15',
    topic: CURRENT_TOPIC.english,
    speaker: TEACHER_INFO.name,
    amharicSummary:
      'በእቅበተ እምነት ትምህርት ኦርቶዶክሳዊ እምነታችንን በቤተ ክርስቲያን ሕይወት፣ በቅዱሳን አባቶች ትምህርት እና በቅዱሳን ምሥጢራት እንዴት እንደምንጠብቅ ተማርን።',
    englishSummary:
      'We studied Ekebete Ement as the Orthodox call to guard the faith we have received in the Church, remaining steadfast in prayer, sound doctrine, humility, and sacramental life.',
    keyPoints: [
      'Guarding the faith means receiving the apostolic teaching faithfully and living it inside the worshipping life of the Church.',
      'Ekebete Ement requires vigilance against confusion, but always with humility, obedience, and love.',
      'Prayer, Scripture, fasting, and the Holy Mysteries strengthen believers to remain firm in Orthodox faith.',
    ],
    feedbackSummary:
      'Several asked for another short explanation of how to defend the faith without falling into argument or pride.',
    attendanceSummary:
      '"Maybe" responses increased — worth a gentle reminder about carpooling and alternative support.',
    verses: ['1 Timothy 6:20-21', '2 Timothy 1:13-14'],
    youtubeUrl: '',
    mezmurs: [
      {
        title: 'ቅዱስ ቅዱስ ቅዱስ',
        transliteration: 'Qidus Qidus Qidus',
        lyrics: 'Placeholder lyrics — replace with liturgical text from your choir.',
      },
      {
        title: 'የእግዚአብሔር መንግሥት',
        transliteration: 'Ye-Igziabhier Mengist',
        youtubeUrl: 'https://www.youtube.com/watch?v=placeholder3',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        prompt: 'In this week’s Timirt, Ekebete Ement chiefly referred to…',
        options: [
          { en: 'Guarding the Orthodox faith faithfully within the life of the Church', am: '' },
          { en: 'Winning every debate by forceful words', am: '' },
          { en: 'Inventing a private teaching apart from the Fathers', am: '' },
          { en: 'Ignoring worship and focusing only on opinions', am: '' },
        ],
        correctIndex: 0,
        explanation:
          'To guard the faith is to keep what the Church has received from the Apostles and Fathers, preserving it through worship, doctrine, and holy living.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        prompt: 'Which practice did we connect with guarding the faith this week?',
        options: [
          { en: 'Prayer, fasting, and communion', am: '' },
          { en: 'Arguing without mercy', am: '' },
          { en: 'Following trends without discernment', am: '' },
          { en: 'Separating from the Church’s worship', am: '' },
        ],
        correctIndex: 0,
        explanation:
          'The Orthodox faithful guard the faith not only with words but by abiding in the sacramental and ascetical life of the Church.',
      },
      {
        id: 'q3',
        type: 'reflection',
        prompt: 'What is one small habit that could keep you closer to Christ this week?',
        placeholder: 'Example: short morning prayer, Scripture audio…',
      },
      {
        id: 'q4',
        type: 'feedback-open',
        prompt: 'What was unclear or needs more explanation?',
        placeholder: 'Optional — share in Amharic or English.',
      },
      {
        id: 'q5',
        type: 'attendance',
        prompt: 'Are you likely to attend next Tuesday?',
        options: [
          { value: 'in-person', label: 'In person' },
          { value: 'online', label: 'Online' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'cannot-attend', label: 'Cannot attend' },
        ],
      },
    ],
  },
]
