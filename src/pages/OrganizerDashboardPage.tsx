/**
 * Organizer dashboard (UI-only for now).
 *
 * Future auth: wrap this route with a provider that checks `role === 'organizer'`
 * and redirect anonymous visitors to `/`. Keep data fetching in a dedicated hook
 * (`useOrganizerMetrics`) so swapping mock → Supabase is one file change.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { CURRENT_TOPIC } from '../site/constants'
import {
  MOCK_ATTENDANCE_NEXT,
  MOCK_ORGANIZER_WEEKS,
  MOCK_QUESTION_MISS_LATEST,
  MOCK_RECAP_SUGGESTIONS,
} from '../data/mockOrganizer'

const responseBars = MOCK_ORGANIZER_WEEKS.map((w) => ({
  name: w.weekLabel,
  responses: w.totalResponses,
  reviewed: w.reviewedOrWatched,
}))

const languageTrend = MOCK_ORGANIZER_WEEKS.map((w) => ({
  name: w.weekLabel,
  difficulty: w.languageDifficultyAvg,
}))

const latest = MOCK_ORGANIZER_WEEKS[MOCK_ORGANIZER_WEEKS.length - 1]!

export function OrganizerDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Organizer preview</p>
        <p className="mt-1 leading-relaxed">
          No login yet — numbers are sample data so layouts and charts stay stable while
          backend wiring lands.
        </p>
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          Tuesday recap signals
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Simple signals for {CURRENT_TOPIC.english} ({CURRENT_TOPIC.amharic}) so teachers can
          prepare mercy for the flock — never to judge souls.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-brand-900">Responses per week</h2>
          <p className="text-sm text-brand-700">
            Total submissions vs. people who marked they watched or read the recap.
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d5c4" />
                <XAxis dataKey="name" tick={{ fill: '#5c4a3a', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#5c4a3a', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: '#e6d5c4',
                  }}
                />
                <Legend />
                <Bar dataKey="responses" fill="#b8860b" name="Total responses" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reviewed" fill="#5c7c6a" name="Watched / read recap" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">Likely attendance next Tuesday</h2>
          <p className="text-sm text-brand-700">
            Intentions gathered from the attendance prompt — use softly for setup only.
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_ATTENDANCE_NEXT}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {MOCK_ATTENDANCE_NEXT.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-brand-900">Where people hesitated</h2>
          <p className="text-sm text-brand-700">
            Mocked “miss” counts on understanding prompts for the latest class.
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_QUESTION_MISS_LATEST} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d5c4" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#5c4a3a', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fill: '#5c4a3a', fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="missed" fill="#6b8cae" name="Hesitations" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">Language difficulty trend</h2>
          <p className="text-sm text-brand-700">
            Average self-report (1 = easy, 5 = strained). Replace with real survey field
            later.
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={languageTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d5c4" />
                <XAxis dataKey="name" tick={{ fill: '#5c4a3a', fontSize: 12 }} />
                <YAxis domain={[1, 5]} tick={{ fill: '#5c4a3a', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="difficulty" stroke="#b8860b" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Common confusion topics</h2>
        <p className="text-sm text-brand-700">
          Pulled from the open “What was unclear?” field (mocked phrases for now).
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-900">
          {latest.topUnclearTopics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Recap preparation box</h2>
        <p className="text-sm text-brand-700">What should be reviewed next Tuesday for {CURRENT_TOPIC.english}?</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-200 bg-brand-50/80 p-4">
            <p className="text-xs font-semibold uppercase text-brand-700">Most missed prompt</p>
            <p className="mt-2 text-base font-semibold text-brand-900">
              {latest.mostMissedQuestionLabel}
            </p>
            <p className="mt-1 text-sm text-brand-700">
              About {latest.missRatePercent}% needed a second look (sample data).
            </p>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50/80 p-4">
            <p className="text-xs font-semibold uppercase text-brand-700">Top unclear theme</p>
            <p className="mt-2 text-base font-semibold text-brand-900">
              {latest.topUnclearTopics[0] ?? 'No notes yet'}
            </p>
            <p className="mt-1 text-sm text-brand-700">
              Pair with a short English clarification for bilingual members.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Recap helper</h2>
        <p className="text-sm text-brand-700">
          Suggested talking points for {CURRENT_TOPIC.english} distilled from the latest week’s
          signals — edit freely before class.
        </p>
        <ul className="mt-3 space-y-3">
          <li className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm leading-relaxed">
            <span className="font-semibold text-brand-900">Most missed question: </span>
            {latest.mostMissedQuestionLabel} — plan a 90-second redo with examples.
          </li>
          <li className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm leading-relaxed">
            <span className="font-semibold text-brand-900">Top unclear topic: </span>
            {latest.topUnclearTopics[0] ?? 'Collect more notes'} — invite questions early.
          </li>
          <li className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm leading-relaxed">
            <span className="font-semibold text-brand-900">Attendance trend: </span>
            Online + maybe seats rising — confirm Meet link and room greeters.
          </li>
          {MOCK_RECAP_SUGGESTIONS.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm leading-relaxed"
            >
              <span className="font-semibold text-brand-900">{item.title}: </span>
              {item.detail}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
