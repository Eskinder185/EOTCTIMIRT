import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useUiLanguage } from '../contexts/LanguageContext'

export function OrganizerDashboardPage() {
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const organizerLinks = [
    { label: isAm ? 'የአደራጅ መግቢያ' : 'Organizer Login', href: '/admin/login' },
    { label: isAm ? 'ሳምንታዊ ክፍሎች' : 'Weekly Classes', href: '/admin/weekly-classes' },
    { label: isAm ? 'ቀጣይ ትምህርት' : 'Upcoming Timirt', href: '/admin/upcoming' },
    { label: isAm ? 'ሳምንታዊ እውቀት' : 'Weekly Knowledge', href: '/admin/weekly-knowledge' },
    { label: isAm ? 'ስለ' : 'About', href: '/about' },
  ]

  const organizerActions = [
    {
      title: isAm ? 'ሳምንታዊ ክፍልን ያስተዳድሩ' : 'Manage Weekly Class',
      detail: isAm
        ? 'ርእስን፣ ማጠቃለያን፣ የመጽሐፍ ቅዱስ ጥቅሶችን እና የመልሶ መመልከቻ አገናኝን ለማዘመን የክፍል አርታዒውን ይክፈቱ።'
        : 'Open the class editor to update the topic, summary, Bible verses, and replay link.',
      href: '/admin/weekly-classes/new',
    },
    {
      title: isAm ? 'መዝሙሮችን ያስተዳድሩ' : 'Manage Mezmurs',
      detail: isAm
        ? 'ሁለቱን የሳምንቱ መዝሙሮች ከርእስ፣ ከትርጉም ፊደል አጻጻፍ፣ ከግጥም እና ከልምምድ አገናኞች ጋር ያዘጋጁ።'
        : 'Prepare the two weekly mezmurs with titles, transliteration, lyrics, and practice links.',
      href: '/admin/weekly-classes/new#mezmur-editor',
    },
    {
      title: isAm ? 'ጥያቄዎችን ያስተዳድሩ' : 'Manage Questions',
      detail: isAm
        ? 'ለሳምንቱ ባለብዙ ምርጫ፣ የአስተያየት መልስ፣ የግብረ መልስ እና አጭር መልስ ጥያቄዎችን ያዘጋጁ።'
        : 'Create multiple-choice, reflection, feedback, and short-answer questions for the week.',
      href: '/admin/weekly-classes/new#questions-editor',
    },
    {
      title: isAm ? 'ቀጣይ ትምህርትን ያስተዳድሩ' : 'Manage Upcoming Timirt',
      detail: isAm
        ? 'የሚቀጥለውን የማክሰኞ ቅድመ እይታ እና ሁለቱን የሚቀጥሉ መዝሙሮች ለፓሪሽ ድር ጣቢያ ያዘምኑ።'
        : 'Update the next Tuesday preview and the two upcoming mezmurs for the parish website.',
      href: '/admin/upcoming',
    },
    {
      title: isAm ? 'ሳምንታዊ እውቀትን ያስተዳድሩ' : 'Manage Weekly Knowledge',
      detail: isAm
        ? 'የዚህን ሳምንት አጭር የኦርቶዶክስ ትምህርት፣ ማሳሰቢያ ወይም የቃል መግለጫ ካርድ ያትሙ።'
        : 'Publish this week’s short Orthodox teaching, reminder, or term card.',
      href: '/admin/weekly-knowledge',
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="rounded-2xl border border-brand-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {organizerLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900 shadow-sm transition-colors hover:border-accent-600/35 hover:bg-brand-50 active:scale-[0.99] sm:min-h-11 sm:px-4"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {isAm ? 'የአደራጅ ገጽ' : 'Organizer Page'}
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          {isAm ? 'ለሳምንታዊ ትምህርት የአደራጅ መሳሪያዎች' : 'Organizer Tools for Weekly Timirt'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          {isAm
            ? 'ይህ ገጽ ለፓሪሽ አደራጆች Ekebete Emnet (እቅበተ እምነት)ን ለማዘመን፣ መዝሙሮችን ለማዘጋጀት እና የሚቀጥለውን የማክሰኞ ቅድመ እይታ ያለ ኮድ ለማተም ቀላል መንገድ ይሰጣል።'
            : 'A simple place for parish organizers to update Ekebete Emnet (እቅበተ እምነት), prepare mezmurs, and publish the next Tuesday preview without needing to code.'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {organizerActions.map((action) => (
          <Card key={action.title}>
            <h2 className="text-lg font-semibold text-brand-900">{action.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">{action.detail}</p>
            <Link
              to={action.href}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-200 px-4 text-sm font-semibold text-accent-600 shadow-sm transition-colors hover:border-accent-600/40 hover:bg-brand-50"
            >
              {isAm ? 'ይክፈቱ' : 'Open'}
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">
          {isAm ? 'አደራጆች ይህን ገጽ እንዴት ይጠቀሙ' : 'How Organizers Should Use This Page'}
        </h2>
        <p className="text-sm text-brand-700">
          {isAm
            ? 'ይህን ገጽ ወደ የግል የአደራጅ መሳሪያዎች የሚወስድ ቀላል የመግቢያ ነጥብ አድርገው ይጠቀሙ። የሕዝብ ድር ጣቢያው ከዚህ ተለይቶ ይቆያል፣ እንዲሁም Google Meet በሕዝብ ገጾች ላይ አይታይም።'
            : 'Use this page as a simple entry point to the private organizer tools. The public website remains separate, and Google Meet stays off the public pages.'}
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-900">
          <li>
            {isAm
              ? 'የአሁኑን የማክሰኞ ትምህርት ለማዘመን የሳምንታዊ ክፍል አርታዒውን ይክፈቱ።'
              : 'Open the weekly class editor to update the current Tuesday teaching.'}
          </li>
          <li>
            {isAm
              ? 'ሁለቱን መዝሙሮች ግልጽ በሆኑ ርእሶች፣ በትርጉም ፊደል አጻጻፍ እና በግጥሞች ዝግጁ ያድርጉ።'
              : 'Keep the two mezmurs ready with clear titles, transliteration, and lyrics.'}
          </li>
          <li>
            {isAm
              ? 'ለምእመናን በሰላምና በግልጽነት እንዲከለሱ የሚረዱ ቀላል የክትትል ጥያቄዎችን ያዘጋጁ።'
              : 'Prepare simple follow-up questions that help the parish review with peace and clarity.'}
          </li>
          <li>
            {isAm
              ? 'ቀጣዩ ርእስ ከተረጋገጠ በኋላ ብቻ የቀጣዩን ትምህርት ቅድመ እይታ ያዘምኑ።'
              : 'Update the upcoming Timirt preview only after the next topic is confirmed.'}
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">
          {isAm ? 'የግል የአደራጅ አካባቢ' : 'Private Organizer Area'}
        </h2>
        <p className="text-sm text-brand-700">
          {isAm
            ? 'ዋና የማስተካከያ መሳሪያዎች በተጠበቀው የአስተዳደር ክፍል ውስጥ ይገኛሉ። ለመቀጠል ከላይ ያለውን የአደራጅ መግቢያ ቁልፍ ይጠቀሙ።'
            : 'The main editing tools are located in the protected admin area. Use the organizer login button above to continue.'}
        </p>
        <Link
          to="/admin/login"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-200 px-4 text-sm font-semibold text-accent-600 shadow-sm transition-colors hover:border-accent-600/40 hover:bg-brand-50"
        >
          {isAm ? 'ወደ የአደራጅ መግቢያ ይሂዱ' : 'Go to Organizer Login'}
        </Link>
      </Card>
    </div>
  )
}
