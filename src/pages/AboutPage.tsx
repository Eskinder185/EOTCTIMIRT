import {
  CHURCH_MAPS_URL,
} from '../site/constants'
import { AnonymousFeedbackForm } from '../components/AnonymousFeedbackForm'
import { TeacherYoutubeChannelCard } from '../components/TeacherYoutubeChannelCard'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { useUiLanguage } from '../contexts/LanguageContext'
import { useUiText } from '../lib/uiText'

export function AboutPage() {
  const t = useUiText()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const organizerNames = isAm
    ? ['ሲንቴ', 'ጸባኦት', 'ቴዲ', 'እስክንድር ካሳሁን', 'ማርያምዊት']
    : ['Sinte', 'Tsebaot', 'Teddy', 'Eskinder Kassahun', 'Mariamawit']

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t('about')}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">{isAm ? 'ስለ EOTC ትምህርት' : 'About EOTC Timirt'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          {isAm
            ? 'ለጤናማ እና ትክክለኛ ትምህርት፣ ለመንፈሳዊ እድገት፣ እንዲሁም ለታማኝ ዝግጅት የተዘጋጀ ሳምንታዊ የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ የመጽሐፍ ቅዱስ ጥናትና የትምህርት መርሃ ግብር ነው።'
            : 'A weekly Ethiopian Orthodox Tewahedo Bible study and teaching program dedicated to sound teaching, spiritual growth, and faithful preparation.'}
        </p>
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/30 p-3 text-sm text-brand-800">
          <p className="font-semibold text-brand-900">
            {isAm
              ? 'መካነ ሰላም ቅዱስ ሚካኤል እና ኪዳነ ምሕረት የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን'
              : 'Mekane Selam St. Michael Ethiopian Orthodox Tewahedo Church'}
          </p>
          <p className="mt-1">260 N Clarendon Ave, Scottdale, GA 30079</p>
          <p className="mt-1 text-brand-700">{isAm ? 'በየሳምንቱ ማክሰኞ · 7:30 ፒኤም – 9:00 ፒኤም' : 'Every Tuesday · 7:30 PM - 9:00 PM'}</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50"
            href={CHURCH_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isAm ? 'የቤተ ክርስቲያን አድራሻን ይክፈቱ' : 'Open Church Location'}
          </a>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-600 px-4 text-sm font-semibold text-white hover:opacity-95"
            href="#connect-support"
          >
            {isAm ? 'ድጋፍና ግብረ መልስን ይመልከቱ' : 'View Support and Feedback'}
          </a>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'ተልእኳችን' : 'Our Mission'}</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-800">
          {isAm
            ? 'ይህ ትምህርት ምእመናን የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ እምነትን በግልጽነት፣ በአክብሮት፣ በትክክለኛ ትምህርት እንዲማሩ፣ እንዲረዱ፣ በእምነታቸው እንዲጸኑ እና ለሌሎችም እንዲያካፍሉ የቀረበ ነው።'
            : 'This Timirt is offered to help the faithful learn, understand, strengthen, and share the Ethiopian Orthodox Tewahedo faith with clarity, reverence, and right teaching.'}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'ከምስጋና ጋር' : 'With Thanksgiving'}</p>
        <p className="mt-2 text-sm text-brand-800">
          {isAm
            ? 'ይህን ትምህርት በታማኝነት፣ በትህትና እና ለቤተ ክርስቲያን ፍቅር ለሚደግፉት ቀሳውስት፣ አስተማሪዎች እና አገልጋዮች እግዚአብሔርን እናመሰግናለን።'
            : 'We give thanks to God for the clergy, teachers, and servants who support this Timirt with faithfulness, humility, and love for the Church.'}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'ቄስ' : 'Priest'}</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{isAm ? 'መላከ ሰላም ቀሲስ ኤፍሬም ከበደ' : 'Melake Selam Kesis Efrem Kebede'}</p>
            {!isAm ? <p className="mt-1 text-sm text-brand-700">መላከ ሰላም ቀሲስ ኤፍሬም ከበደ</p> : null}
            <p className="mt-2 text-sm text-brand-800">
              {isAm
                ? 'የቤተ ክርስቲያኑን በሮች ከፍታችሁ ይህን የትምህርት መርሃ ግብር ስለደገፋችሁ ከልብ እናመሰግናለን።'
                : 'We offer heartfelt thanks for opening the church\'s doors and supporting this teaching program.'}
            </p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'መምህር' : 'Teacher'}</p>
            <p className="mt-1 text-base font-semibold text-brand-900">{isAm ? 'በኩረ ሰባክያን ምህረተአብ አሰፋ' : 'Bekure Sebakian Mehretab Assefa'}</p>
            {!isAm ? <p className="mt-1 text-sm text-brand-700">በኩረ ሰባክያን ምህረተአብ አሰፋ</p> : null}
            <p className="mt-2 text-sm text-brand-800">
              {isAm
                ? 'ምእመናንን በግልጽ፣ በታማኝ እና በሥርዓተ ቤተ ክርስቲያን የተመሠረተ ትምህርት ስለምትመሩ ከልብ እናመሰግናለን።'
                : 'We offer heartfelt thanks for guiding the faithful through clear, faithful, and rooted teaching in the tradition of the Ethiopian Orthodox Tewahedo Church.'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-brand-800">
          {isAm
            ? 'እግዚአብሔር አገልግሎታቸውን ይባርክ፣ የደብሩንም መንፈሳዊ እድገት ያጠናክር።'
            : 'May God bless their service and strengthen the spiritual growth of the parish family.'}
        </p>
      </Card>

      <TeacherYoutubeChannelCard
        eyebrow={isAm ? 'የማስተማሪያ ግብዓቶች' : 'Teaching resources'}
        title={isAm ? 'ኦፊሴላዊ የማስተማሪያ ቻናል' : 'Official Teaching Channel'}
        description={
          isAm
            ? 'ከዋናው የማስተማሪያ ቻናል የትምህርት ክፍሎችን፣ የመጽሐፍ ቅዱስ ጥናት ትምህርቶችን እና ሌሎች ጠቃሚ የትምህርት ቪዲዮዎችን ይመልከቱ።'
            : 'Watch Timirt lessons, Bible study teachings, and other instructional videos from the main teaching channel.'
        }
        buttonLabel={isAm ? 'የመጽሐፍ ቅዱስ ጥናት ቻናሉን ይክፈቱ' : 'Open Bible Study Channel'}
      />

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'የአደራጅ ድጋፍ' : 'Organizer support'}</p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">{isAm ? 'የትምህርት አደራጅ ቡድን' : 'Timirt organizing team'}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organizerNames.map((name) => (
            <div key={name} className="rounded-xl border border-brand-100 bg-brand-50/30 p-3">
              <p className="mt-1 text-sm font-semibold text-brand-900">{name}</p>
            </div>
          ))}
        </div>
      </Card>

      <section id="connect-support" className="space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{isAm ? 'ቴሌግራም' : 'Telegram'}</p>
          <h2 className="mt-1 text-lg font-semibold text-brand-900">{isAm ? 'ሳምንታዊ የትምህርት ዝማኔዎችን ይቀላቀሉ' : 'Join Weekly Timirt Updates'}</h2>
          <p className="mt-2 text-sm font-medium text-brand-900">{isAm ? 'EOTC ትምህርት — መካነ ሰላም ቅዱስ ሚካኤል ቤተ ክርስቲያን' : 'EOTC Timirt — Mekane Selam St. Michael Church'}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            {isAm
              ? 'ሳምንታዊ የትምህርት ማሳሰቢያዎችን፣ ዝማኔዎችን እና አስፈላጊ የክፍል መረጃዎችን ለመቀበል ከአደራጆቹ አንዱን እንዲያክልዎት ይጠይቁ።'
              : 'Ask one of the organizers to add you so you can receive weekly Timirt reminders, updates, and important class information.'}
          </p>
        </Card>

        <section id="feedback">
          <AnonymousFeedbackForm />
        </section>
      </section>

      <RouterLinkButton to="/upcoming" variant="secondary" className="w-full sm:w-auto">
        {isAm ? 'ቀጣይ ክፍል' : t('nextClass')}
      </RouterLinkButton>
    </div>
  )
}