import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

const quickActions = [
  {
    title: 'Manage Weekly Class',
    description: 'Edit topic, speaker, summaries, verses, and replay link.',
    href: '/admin/weekly-classes/new',
    icon: '📚',
    color: 'bg-amber-600'
  },
  {
    title: 'Manage Mezmurs',
    description: 'Prepare the two weekly mezmurs with lyrics and practice links.',
    href: '/admin/weekly-classes/new#mezmur-editor',
    icon: '🎵',
    color: 'bg-emerald-600'
  },
  {
    title: 'Manage Questions',
    description: 'Add follow-up, multiple-choice, reflection, and attendance questions.',
    href: '/admin/weekly-classes/new#questions-editor',
    icon: '❓',
    color: 'bg-blue-600'
  },
  {
    title: 'Manage Upcoming Timirt',
    description: 'Update next Tuesday preview and upcoming mezmurs.',
    href: '/admin/upcoming',
    icon: '🔮',
    color: 'bg-violet-600'
  }
]

export function AdminDashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Organizer dashboard
        </h1>
        <p className="text-gray-600">
          Use these guided sections to update the weekly Timirit without coding or opening raw database tables.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Main actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6 block"
            >
              <div className="flex items-start space-x-4">
                <div className={`${action.color} rounded-lg p-3 text-white text-2xl`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </div>
                <div className="text-gray-400">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-amber-900 mb-2">Organizer notes</h2>
        <p className="text-amber-800 mb-4">
          Keep the content clear, pastoral, and suitable for Ethiopian Orthodox Tewahedo parish use.
        </p>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start space-x-2">
            <span>1.</span>
            <span><strong>Weekly class:</strong> Enter the topic, summaries, verses, and replay link.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span>2.</span>
            <span><strong>Mezmurs and questions:</strong> Prepare the two hymns and guided follow-up prompts.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span>3.</span>
            <span><strong>Upcoming Timirit:</strong> Update the next Tuesday preview when it is ready to publish.</span>
          </li>
        </ul>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link to="/admin/weekly-classes/new">
            <Button>Create weekly class</Button>
          </Link>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    </div>
  )
}