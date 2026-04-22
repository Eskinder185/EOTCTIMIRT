import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { getWeekById } from '../data/weeksRepo'
import type { Question, WeeklyClass } from '../data/types'
import { formatClassDate } from '../lib/formatDate'
import { TEWAHEDO_DAILY_MEZMURS_URL } from '../site/tewahedoDaily'

function previewLyrics(text?: string) {
  if (!text) {
    return null
  }

  if (text.length <= 180) {
    return text
  }

  return `${text.slice(0, 180).trimEnd()}...`
}

function isMultipleChoice(question: Question): question is Extract<Question, { type: 'multiple-choice' }> {
  return question.type === 'multiple-choice'
}

function QuickReview({ questions }: { questions: Question[] }) {
  const reviewQuestions = questions.slice(0, 5)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  if (reviewQuestions.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      {reviewQuestions.map((question, index) => {
        if (isMultipleChoice(question)) {
          const answer = answers[question.id]
          const selectedIndex = answer === undefined ? null : Number(answer)

          return (
            <Card key={question.id} className="p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Question {index + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-brand-900">{question.prompt}</h3>
              {question.helperText ? (
                <p className="mt-1 text-sm text-brand-700">{question.helperText}</p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const active = selectedIndex === optionIndex

                  return (
                    <Button
                      key={`${question.id}-${optionIndex}`}
                      type="button"
                      variant="secondary"
                      className={`justify-start text-left ${active ? 'border-accent-600 bg-brand-100' : ''}`}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: String(optionIndex) }))}
                    >
                      {option}
                    </Button>
                  )
                })}
              </div>
              {selectedIndex !== null ? (
                <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-3 text-sm leading-relaxed text-brand-800">
                  <p className="font-semibold text-brand-900">Explanation</p>
                  <p className="mt-1">{question.explanation}</p>
                </div>
              ) : null}
            </Card>
          )
        }

        if (question.type === 'attendance') {
          return (
            <Card key={question.id} className="p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Question {index + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-brand-900">{question.prompt}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.options.map((option) => (
                  <span key={option.value} className="inline-flex min-h-10 items-center rounded-full border border-brand-200 px-3 text-sm text-brand-800">
                    {option.label}
                  </span>
                ))}
              </div>
            </Card>
          )
        }

        return (
          <Card key={question.id} className="p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Question {index + 1}
            </p>
            <h3 className="mt-1 text-base font-semibold text-brand-900">{question.prompt}</h3>
            {question.helperText ? (
              <p className="mt-2 text-sm leading-relaxed text-brand-700">{question.helperText}</p>
            ) : null}
          </Card>
        )
      })}
    </section>
  )
}

export function ClassPage() {
  const { id } = useParams()
  const [week, setWeek] = useState<WeeklyClass | undefined | null>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setWeek(null)
      setLoading(false)
      return
    }

    const loadWeek = async () => {
      try {
        setLoading(true)
        const weekData = await getWeekById(id)
        setWeek(weekData || null)
      } catch (error) {
        console.error('Failed to load week:', error)
        setWeek(null)
      } finally {
        setLoading(false)
      }
    }

    loadWeek()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-brand-100 h-8 w-64 rounded"></div>
        <div className="animate-pulse bg-brand-100 h-4 w-96 rounded"></div>
        <div className="animate-pulse bg-brand-100 h-32 w-full rounded"></div>
      </div>
    )
  }

  if (!week) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-brand-900">Timirit not found</h1>
        <p className="text-sm leading-relaxed text-brand-700">
          That week is not yet published in the parish archive.
        </p>
        <RouterLinkButton to="/past-timirit" variant="secondary">
          Browse past Timirit sessions
        </RouterLinkButton>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Past class summary
        </p>
        <h1 className="mt-1 text-xl font-bold text-brand-900 sm:text-2xl">{week.topic}</h1>
        <p className="mt-1 text-sm text-brand-700">
          {formatClassDate(week.date)} · {week.speaker}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-brand-800">
          Catch up quietly with the summary, the mezmurs, and a short review before the next Tuesday Timirit.
        </p>
        {week.youtubeUrl ? (
          <a
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-accent-600 hover:bg-brand-50"
            href={week.youtubeUrl}
            target="_blank"
            rel="noreferrer"
          >
            Watch Replay
          </a>
        ) : null}
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Summary</p>
        <div className="mt-3 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-brand-900">Amharic summary</h2>
            <p className="mt-2 whitespace-pre-line text-[1rem] leading-relaxed text-brand-900">
              {week.amharicSummary}
            </p>
          </div>
          <details className="group rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <summary className="cursor-pointer list-none text-base font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
              English summary
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brand-800">{week.englishSummary}</p>
          </details>
          <details className="group rounded-xl border border-brand-100 bg-brand-50/40 p-3" open>
            <summary className="cursor-pointer list-none text-base font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
              Key points
            </summary>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-800">
              {week.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </details>
          {week.verses?.length ? (
            <details className="group rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <summary className="cursor-pointer list-none text-base font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                Verses
              </summary>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-800">
                {week.verses.map((verse) => (
                  <li key={verse}>{verse}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Mezmurs from this class</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {week.mezmurs.map((mezmur, index) => (
            <article key={`${week.id}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-xs font-semibold uppercase text-brand-700">Mezmur {index + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-brand-900">{mezmur.title}</h3>
              {mezmur.transliteration ? (
                <p className="mt-1 text-sm italic text-brand-700">{mezmur.transliteration}</p>
              ) : null}
              {mezmur.lyrics ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-accent-600">View lyrics</summary>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-800">
                    {mezmur.lyrics}
                  </p>
                </details>
              ) : (
                <p className="mt-3 text-sm text-brand-700">Lyrics preview not yet available.</p>
              )}
              {!mezmur.lyrics && mezmur.transliteration ? (
                <p className="mt-2 text-sm leading-relaxed text-brand-700">{previewLyrics(mezmur.transliteration)}</p>
              ) : null}
              <a
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 px-3 text-sm font-semibold text-accent-600 hover:bg-brand-50"
                href={mezmur.youtubeUrl ?? TEWAHEDO_DAILY_MEZMURS_URL}
                target="_blank"
                rel="noreferrer"
              >
                {mezmur.youtubeUrl ? 'Practice Link' : 'Mezmur Practice'}
              </a>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quick review</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          A short set of questions from this class. This is only for review and remembrance, not an exam.
        </p>
        <div className="mt-3">
          <QuickReview questions={week.questions} />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <RouterLinkButton to="/past-timirit" variant="secondary" className="w-full">
          Back to Past Classes
        </RouterLinkButton>
        <RouterLinkButton to="/upcoming" className="w-full">
          Prepare for Next Class
        </RouterLinkButton>
      </div>
    </div>
  )
}
