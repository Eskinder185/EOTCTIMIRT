import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const quickActions = [
  {
    title: 'Create New Class',
    description: 'Add a new weekly Timirit session',
    href: '/admin/classes/new',
    icon: '➕',
    color: 'bg-green-500'
  },
  {
    title: 'View Responses',
    description: 'See latest participant responses',
    href: '/admin/responses',
    icon: '💬',
    color: 'bg-blue-500'
  },
  {
    title: 'Update Upcoming',
    description: 'Edit next week preview',
    href: '/admin/upcoming',
    icon: '🔮',
    color: 'bg-purple-500'
  },
  {
    title: 'Manage Classes',
    description: 'Edit existing content',
    href: '/admin/classes',
    icon: '📚',
    color: 'bg-amber-500'
  }
]

const stats = [
  {
    label: 'Total Classes',
    value: '12',
    icon: '📚',
    change: '+2 this month'
  },
  {
    label: 'Recent Responses',
    value: '34',
    icon: '💬',
    change: '+8 this week'
  },
  {
    label: 'Active Participants',
    value: '18',
    icon: '👥',
    change: '+3 new members'
  },
  {
    label: 'Upcoming Sessions',
    value: '1',
    icon: '🔮',
    change: 'Next: April 22'
  }
]

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to the Organizer Portal
        </h1>
        <p className="text-gray-600">
          Manage your Ethiopian Orthodox Tewahedo Church Timirit content and track participant engagement.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
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

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Latest Updates</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    New responses received for "The Good Shepherd" class
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Updated upcoming preview for "Mother of God" session
                  </p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full p-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Created new class: "Forgiveness and the heart's healing"
                  </p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-amber-900 mb-2">
          🚀 Getting Started
        </h2>
        <p className="text-amber-800 mb-4">
          Welcome to the Organizer Portal! Here's how to get the most out of the system:
        </p>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start space-x-2">
            <span>1.</span>
            <span><strong>Create content:</strong> Add weekly classes with topics, summaries, and questions</span>
          </li>
          <li className="flex items-start space-x-2">
            <span>2.</span>
            <span><strong>Preview upcoming:</strong> Set up next week's session preview</span>
          </li>
          <li className="flex items-start space-x-2">
            <span>3.</span>
            <span><strong>Monitor responses:</strong> Track participant engagement and feedback</span>
          </li>
          <li className="flex items-start space-x-2">
            <span>4.</span>
            <span><strong>Analyze data:</strong> Use insights to improve future sessions</span>
          </li>
        </ul>
        <div className="mt-4">
          <Button asChild size="sm">
            <Link to="/admin/classes/new">
              Create Your First Class
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}