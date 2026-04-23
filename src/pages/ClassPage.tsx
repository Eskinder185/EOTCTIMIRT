import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useUiLanguage } from '../contexts/LanguageContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RouterLinkButton } from '../components/ui/RouterLinkButton'
import { getWeekById } from '../data/weeksRepo'
import type { Question, WeeklyClass } from '../data/types'
import { getUserFingerprint } from '../lib/anonymousIdentity'
import { formatClassDate } from '../lib/formatDate'
import { getLocalizedText } from '../lib/localizedText'
import { submitUserResponses } from '../lib/supabaseData'
import { toYouTubeEmbedUrl } from '../lib/youtube'
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

function QuickReview({ weekId, questions }: { weekId: string; questions: Question[] }) {
  const { language } = useUiLanguage()
  const reviewQuestions = questions.slice(0, 5)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null)
  const [failedSaves, setFailedSaves] = useState<Record<string, number>>({})

  const multipleChoiceQuestions = reviewQuestions.filter(isMultipleChoice)
  const answeredMultipleChoice = multipleChoiceQuestions.filter((question) => {
    const value = answers[question.id]
    if (value === undefined) {
      return false
    }
    const parsed = Number(value)
    return Number.isInteger(parsed)
  })

  const completedAllMultipleChoice =
    multipleChoiceQuestions.length > 0 &&
    answeredMultipleChoice.length === multipleChoiceQuestions.length
  const progressLabel = `${answeredMultipleChoice.length}/${multipleChoiceQuestions.length}`

  const summaryStats = answeredMultipleChoice.reduce(
    (acc, question) => {
      const selectedIndex = Number(answers[question.id])
      const hasValidCorrectIndex =
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex < question.options.length

      if (!hasValidCorrectIndex) {
        return acc
      }

      acc.total += 1
      if (selectedIndex === question.correctIndex) {
        acc.correct += 1
      } else {
        acc.incorrect += 1
        acc.missedQuestionIds.push(question.id)
        acc.missedQuestionPrompts.push(question.prompt)
      }
      return acc
    },
    {
      total: 0,
      correct: 0,
      incorrect: 0,
      missedQuestionIds: [] as string[],
      missedQuestionPrompts: [] as string[],
    },
  )

  const scorePercent =
    summaryStats.total > 0 ? Math.round((summaryStats.correct / summaryStats.total) * 100) : 0

  const encouragement =
    scorePercent >= 90
      ? 'Wonderful review. Keep strengthening this understanding in prayer and study.'
      : scorePercent >= 70
        ? 'Good progress. Review the missed points and you will be even more prepared next class.'
        : 'Thank you for completing the review. Revisit the explanations and try again with peace.'

  if (reviewQuestions.length === 0) {
    return null
  }

  const persistChoice = async (questionId: string, selectedOptionIndex: number) => {
    try {
      setSaveError(null)
      setSaveNotice(null)
      setSavingQuestionId(questionId)
      await submitUserResponses(
        weekId,
        [{ questionId, selectedOptionIndex }],
        getUserFingerprint(),
      )
      setFailedSaves((current) => {
        if (!(questionId in current)) {
          return current
        }
        const next = { ...current }
        delete next[questionId]
        return next
      })
    } catch (error) {
      console.error('Failed to save quick review response:', error)
      setFailedSaves((current) => ({ ...current, [questionId]: selectedOptionIndex }))
      setSaveError('Your answer is kept on this device, but sync failed right now. You can continue and retry sync.')
    } finally {
      setSavingQuestionId(null)
    }
  }

  const retryFailedSaves = async () => {
    const entries = Object.entries(failedSaves)
    if (entries.length === 0) {
      return
    }
    setSaveError(null)
    let failedCount = 0
    for (const [questionId, selectedOptionIndex] of entries) {
      try {
        await submitUserResponses(
          weekId,
          [{ questionId, selectedOptionIndex }],
          getUserFingerprint(),
        )
        setFailedSaves((current) => {
          const next = { ...current }
          delete next[questionId]
          return next
        })
      } catch {
        failedCount += 1
      }
    }
    if (failedCount === 0) {
      setSaveNotice('All pending answers synced successfully.')
    } else {
      setSaveError(`${failedCount} answer(s) still waiting to sync. You can retry again.`)
    }
  }

  return (
    <section className="space-y-3">
      <Card className="p-3 sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quick review progress</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-brand-900">
            Multiple-choice completed: {progressLabel}
          </p>
          <p className="text-sm text-brand-700">{multipleChoiceQuestions.length > 0 ? `${scorePercent}%` : 'No score yet'}</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-accent-600 transition-all"
            style={{
              width:
                multipleChoiceQuestions.length > 0
                  ? `${Math.round((answeredMultipleChoice.length / multipleChoiceQuestions.length) * 100)}%`
                  : '0%',
            }}
          />
        </div>
      </Card>

      {reviewQuestions.map((question, index) => {
        if (isMultipleChoice(question)) {
          const answer = answers[question.id]
          const selectedIndex = answer === undefined ? null : Number(answer)
          const hasValidSelection = selectedIndex !== null && Number.isInteger(selectedIndex)
          const hasValidCorrectIndex =
            Number.isInteger(question.correctIndex) &&
            question.correctIndex >= 0 &&
            question.correctIndex < question.options.length
          const isCorrect =
            hasValidSelection && hasValidCorrectIndex
              ? selectedIndex === question.correctIndex
              : false

          return (
            <Card key={question.id} id={`review-question-${question.id}`} className="p-3 sm:p-4">
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
                      onClick={async () => {
                        setAnswers((current) => ({ ...current, [question.id]: String(optionIndex) }))
                        await persistChoice(question.id, optionIndex)
                      }}
                      disabled={savingQuestionId === question.id}
                    >
                      {getLocalizedText(option, language)}
                    </Button>
                  )
                })}
              </div>
              {hasValidSelection ? (
                <div
                  className={`mt-3 rounded-xl border px-3 py-3 text-sm leading-relaxed ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-amber-200 bg-amber-50 text-amber-950'
                  }`}
                >
                  <p className="font-semibold">
                    {isCorrect ? 'Correct' : 'Not quite'}
                  </p>
                  {hasValidCorrectIndex ? (
                    <p className="mt-1">
                      <span className="font-semibold">Correct answer:</span>{' '}
                      {getLocalizedText(question.options[question.correctIndex], language)}
                    </p>
                  ) : (
                    <p className="mt-1">
                      <span className="font-semibold">Correct answer:</span> This answer will be added soon.
                    </p>
                  )}
                  <p className="mt-1">
                    <span className="font-semibold">Explanation:</span>{' '}
                    {question.explanation?.trim() || 'A short explanation will be added soon.'}
                  </p>
                  {!isCorrect && hasValidCorrectIndex ? (
                    <p className="mt-1 font-medium">Review this point again before next class.</p>
                  ) : null}
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
      {saveError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>{saveError}</p>
          {Object.keys(failedSaves).length > 0 ? (
            <Button type="button" variant="secondary" className="mt-2" onClick={retryFailedSaves}>
              Retry sync ({Object.keys(failedSaves).length})
            </Button>
          ) : null}
        </div>
      ) : null}
      {saveNotice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {saveNotice}
        </p>
      ) : null}

      {completedAllMultipleChoice ? (
        <Card className="border-brand-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quiz summary</p>
          <h3 className="mt-1 text-lg font-semibold text-brand-900">You completed this review set</h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">{encouragement}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm">
              <p className="text-brand-700">Answered</p>
              <p className="font-semibold text-brand-900">{summaryStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <p className="text-emerald-800">Correct</p>
              <p className="font-semibold text-emerald-950">{summaryStats.correct}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              <p className="text-amber-800">Incorrect</p>
              <p className="font-semibold text-amber-950">{summaryStats.incorrect}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
              <p className="text-blue-800">Score</p>
              <p className="font-semibold text-blue-950">{scorePercent}%</p>
            </div>
          </div>

          {summaryStats.missedQuestionPrompts.length > 0 ? (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3">
              <p className="text-sm font-semibold text-brand-900">Questions to review</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-800">
                {summaryStats.missedQuestionPrompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const firstMissed = summaryStats.missedQuestionIds[0]
                if (!firstMissed) {
                  return
                }
                document
                  .getElementById(`review-question-${firstMissed}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              disabled={summaryStats.missedQuestionIds.length === 0}
            >
              Review missed questions
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAnswers({})
                setFailedSaves({})
                setSaveError(null)
                setSaveNotice(null)
              }}
            >
              Try again
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                document
                  .getElementById('class-summary')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Back to class summary
            </Button>
          </div>
        </Card>
      ) : null}
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

  const showMedia = week.lessonMediaEnabled !== false
  const embedUrl = showMedia ? toYouTubeEmbedUrl(week.youtubeUrl) : undefined
  const hasAudio = showMedia && Boolean(week.audioUrl?.trim())
  const hasVideo = showMedia && Boolean(embedUrl)

  return (
    <div className="space-y-4">
      <Card id="class-summary">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Catch up from this class</p>
        <h1 className="mt-1 text-xl font-bold text-brand-900 sm:text-2xl">{week.topic}</h1>
        <p className="mt-1 text-sm text-brand-700">
          {formatClassDate(week.date)} · {week.speaker}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-brand-800">
          Catch up quietly with the summary, the mezmurs, and a short review before the next Tuesday Timirit.
        </p>
      </Card>

      {hasAudio || hasVideo ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Teacher lesson media</p>
          {hasAudio ? (
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <h2 className="text-base font-semibold text-brand-900">Listen to the Lesson</h2>
              <p className="mt-1 text-sm text-brand-700">
                {week.audioTitle?.trim() || 'Audio lesson for mobile listening with headphones'}
              </p>
              {week.audioNote?.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-brand-700">{week.audioNote}</p>
              ) : null}
              <audio controls preload="none" className="mt-3 w-full">
                <source src={week.audioUrl} />
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : null}
          {hasVideo ? (
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <h2 className="text-base font-semibold text-brand-900">Watch the Lesson</h2>
              <div className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-black">
                <iframe
                  src={embedUrl}
                  title={`${week.topic} lesson video`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {week.teachingNotes?.trim() ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Teaching notes / transcript</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-800">{week.teachingNotes}</p>
        </Card>
      ) : null}

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
          <QuickReview weekId={week.id} questions={week.questions} />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <RouterLinkButton to="/past-timirit" variant="secondary" className="w-full">
          Back to Past Classes
        </RouterLinkButton>
        <RouterLinkButton to="/upcoming" className="w-full">
          Prepare for Next Class
        </RouterLinkButton>
        <RouterLinkButton to="/mezmurs" variant="secondary" className="w-full sm:col-span-2">
          Practice upcoming mezmurs
        </RouterLinkButton>
      </div>
    </div>
  )
}
