import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useUiLanguage } from '../contexts/LanguageContext'

export function AdminDashboard() {
  const { signOut } = useAuth()
  const { language } = useUiLanguage()
  const isAm = language === 'am'
  const navigate = useNavigate()
  const quickActions = [
    {
      title: isAm ? 'ሳምንታዊ ክፍልን ያስተዳድሩ' : 'Manage Weekly Class',
      description: isAm
        ? 'ርእሱን፣ ተናጋሪውን፣ ማጠቃለያዎችን፣ የመጽሐፍ ቅዱስ ጥቅሶችን እና የድጋሚ መመልከቻ አገናኝን ያርትዑ።'
        : 'Edit the topic, speaker, summaries, Bible verses, and replay link.',
      href: '/admin/weekly-classes/new',
      icon: '📚',
      color: 'bg-amber-600',
    },
    {
      title: isAm ? 'መዝሙሮችን ያስተዳድሩ' : 'Manage Mezmurs',
      description: isAm
        ? 'ሁለቱን የሳምንቱ መዝሙሮች ከግጥሞች እና ከልምምድ አገናኞች ጋር ያዘጋጁ።'
        : 'Prepare the two weekly mezmurs with lyrics and practice links.',
      href: '/admin/weekly-classes/new#mezmur-editor',
      icon: '🎵',
      color: 'bg-emerald-600',
    },
    {
      title: isAm ? 'ጥያቄዎችን ያስተዳድሩ' : 'Manage Questions',
      description: isAm
        ? 'የክትትል፣ ባለብዙ ምርጫ፣ የአስተያየት እና አጭር መልስ ጥያቄዎችን ያክሉ።'
        : 'Add follow-up, multiple-choice, reflection, and short-answer questions.',
      href: '/admin/weekly-classes/new#questions-editor',
      icon: '❓',
      color: 'bg-blue-600',
    },
    {
      title: isAm ? 'ቀጣይ ትምህርትን ያስተዳድሩ' : 'Manage Upcoming Timirt',
      description: isAm
        ? 'የሚቀጥለውን የማክሰኞ ቅድመ እይታ እና የሚቀጥሉትን መዝሙሮች ያዘምኑ።'
        : 'Update the next Tuesday preview and upcoming mezmurs.',
      href: '/admin/upcoming',
      icon: '🔮',
      color: 'bg-violet-600',
    },
    {
      title: isAm ? 'ሳምንታዊ እውቀትን ያስተዳድሩ' : 'Manage Weekly Knowledge',
      description: isAm
        ? 'ለምእመናን አንድ አጭር ሳምንታዊ የኦርቶዶክስ ግንዛቤ ካርድ ያትሙ።'
        : 'Publish one short weekly Orthodox insight card for parish learners.',
      href: '/admin/weekly-knowledge',
      icon: '🕯️',
      color: 'bg-indigo-600',
    },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          {isAm ? 'የአደራጅ ዳሽቦርድ' : 'Organizer Dashboard'}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-brand-800">
          {isAm
            ? 'ሳምንታዊ ትምህርቱን ያለ ኮድ ወይም ጥሬ የውሂብ ጎታ ሰንጠረዦችን ሳይከፍቱ ለማዘመን እነዚህን የሚመሩ ክፍሎች ይጠቀሙ።'
            : 'Use these guided sections to update the weekly Timirt without coding or opening raw database tables.'}
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-brand-900">{isAm ? 'ዋና ተግባራት' : 'Main Actions'}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="block rounded-2xl border-2 border-brand-200 bg-white p-5 shadow-sm transition hover:border-accent-600/35 hover:shadow-md active:scale-[0.99] sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`shrink-0 rounded-xl ${action.color} p-3 text-2xl text-white shadow-sm`}>{action.icon}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-brand-900">{action.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-800">{action.description}</p>
                </div>
                <span className="shrink-0 text-xl font-bold text-accent-600" aria-hidden>
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-brand-200 bg-brand-100/50 p-6 shadow-sm sm:p-8">
        <h2 className="mb-2 text-lg font-semibold text-brand-900">{isAm ? 'የአደራጅ ማስታወሻዎች' : 'Organizer Notes'}</h2>
        <p className="mb-4 text-sm leading-relaxed text-brand-800">
          {isAm
            ? 'ይዘቱን ግልጽ፣ የተከበረ እና ለኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ፓሪሽ አገልግሎት ተስማሚ ያድርጉት።'
            : 'Keep the content clear, respectful, and suitable for Ethiopian Orthodox Tewahedo parish use.'}
        </p>
        <ul className="space-y-2.5 text-sm text-brand-900">
          <li className="flex gap-2">
            <span className="font-bold text-accent-600">1.</span>
            <span>
              <strong>{isAm ? 'ሳምንታዊ ክፍል፡' : 'Weekly Class:'}</strong>{' '}
              {isAm
                ? 'ርእሱን፣ ማጠቃለያዎችን፣ የመጽሐፍ ቅዱስ ጥቅሶችን እና የድጋሚ መመልከቻ አገናኝን ያስገቡ።'
                : 'Enter the topic, summaries, Bible verses, and replay link.'}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-accent-600">2.</span>
            <span>
              <strong>{isAm ? 'መዝሙሮች እና ጥያቄዎች፡' : 'Mezmurs and Questions:'}</strong>{' '}
              {isAm
                ? 'ሁለቱን መዝሙሮች እና የሚመሩ የክትትል ጥያቄዎችን ያዘጋጁ።'
                : 'Prepare the two mezmurs and the guided follow-up questions.'}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-accent-600">3.</span>
            <span>
              <strong>{isAm ? 'ቀጣይ ትምህርት፡' : 'Upcoming Timirt:'}</strong>{' '}
              {isAm
                ? 'የሚቀጥለውን የማክሰኞ ቅድመ እይታ ለማተም ዝግጁ ሲሆን ያዘምኑ።'
                : 'Update the next Tuesday preview when it is ready to publish.'}
            </span>
          </li>
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/admin/weekly-classes/new">
            <Button>{isAm ? 'ሳምንታዊ ክፍል ይፍጠሩ' : 'Create Weekly Class'}</Button>
          </Link>
          <Button variant="secondary" onClick={handleLogout}>
            {isAm ? 'ውጣ' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  )
}
