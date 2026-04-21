import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWeeklyClass, createWeeklyClass, updateWeeklyClass } from '../lib/supabaseData'
import { Button } from '../components/ui/Button'
import type { WeeklyClass, Question, Mezmur, QuestionType } from '../data/types'

type FormQuestion = Omit<Question, 'id'> & { id?: string }
type FormMezmur = Omit<Mezmur, 'youtubeUrl'> & { youtubeUrl?: string }

export function AdminWeeklyClassForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    date: '',
    topic: '',
    speaker: '',
    amharicSummary: '',
    englishSummary: '',
    keyPoints: ['', '', ''],
    verses: ['', ''],
    youtubeUrl: ''
  })
  
  const [mezmurs, setMezmurs] = useState<[FormMezmur, FormMezmur]>([
    { title: '', transliteration: '', lyrics: '', youtubeUrl: '' },
    { title: '', transliteration: '', lyrics: '', youtubeUrl: '' }
  ])
  
  const [questions, setQuestions] = useState<FormQuestion[]>([])

  useEffect(() => {
    if (isEditing && id) {
      loadClass(id)
    } else {
      // Set default date to next Tuesday
      const nextTuesday = getNextTuesday()
      setFormData(prev => ({ ...prev, date: nextTuesday }))
    }
  }, [isEditing, id])

  const getNextTuesday = () => {
    const today = new Date()
    const daysUntilTuesday = (2 - today.getDay() + 7) % 7
    const nextTuesday = new Date(today)
    nextTuesday.setDate(today.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday))
    return nextTuesday.toISOString().split('T')[0]
  }

  const loadClass = async (classId: string) => {
    try {
      setLoading(true)
      setError(null)
      const weeklyClass = await getWeeklyClass(classId)
      
      if (!weeklyClass) {
        setError('Weekly class not found')
        return
      }

      setFormData({
        id: weeklyClass.id,
        date: weeklyClass.date,
        topic: weeklyClass.topic,
        speaker: weeklyClass.speaker,
        amharicSummary: weeklyClass.amharicSummary,
        englishSummary: weeklyClass.englishSummary,
        keyPoints: [...weeklyClass.keyPoints, '', '', ''].slice(0, 3),
        verses: weeklyClass.verses ? [...weeklyClass.verses, '', ''].slice(0, 2) : ['', ''],
        youtubeUrl: weeklyClass.youtubeUrl || ''
      })

      setMezmurs([
        {
          title: weeklyClass.mezmurs[0]?.title || '',
          transliteration: weeklyClass.mezmurs[0]?.transliteration || '',
          lyrics: weeklyClass.mezmurs[0]?.lyrics || '',
          youtubeUrl: weeklyClass.mezmurs[0]?.youtubeUrl || ''
        },
        {
          title: weeklyClass.mezmurs[1]?.title || '',
          transliteration: weeklyClass.mezmurs[1]?.transliteration || '',
          lyrics: weeklyClass.mezmurs[1]?.lyrics || '',
          youtubeUrl: weeklyClass.mezmurs[1]?.youtubeUrl || ''
        }
      ])

      setQuestions(weeklyClass.questions.map(q => ({ ...q })))
    } catch (err) {
      console.error('Failed to load class:', err)
      setError('Failed to load class data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.topic || !formData.speaker || !formData.date) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const classData = {
        id: formData.id || formData.date,
        date: formData.date,
        topic: formData.topic,
        speaker: formData.speaker,
        amharicSummary: formData.amharicSummary,
        englishSummary: formData.englishSummary,
        keyPoints: formData.keyPoints.filter(point => point.trim() !== ''),
        verses: formData.verses.filter(verse => verse.trim() !== ''),
        youtubeUrl: formData.youtubeUrl || undefined
      }

      if (isEditing && id) {
        await updateWeeklyClass(id, classData)
      } else {
        await createWeeklyClass(classData)
      }

      navigate('/admin/classes')
    } catch (err) {
      console.error('Failed to save class:', err)
      setError('Failed to save class. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: FormQuestion = {
      type,
      prompt: '',
      helperText: ''
    }

    if (type === 'multiple-choice') {
      Object.assign(newQuestion, {
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
      })
    } else if (type === 'attendance') {
      Object.assign(newQuestion, {
        options: [
          { value: 'in-person', label: 'In person' },
          { value: 'online', label: 'Online' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'cannot-attend', label: 'Cannot attend' }
        ]
      })
    } else {
      Object.assign(newQuestion, { placeholder: '' })
    }

    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading class data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Weekly Class' : 'Create New Weekly Class'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update the details for this Timirit session' : 'Add a new weekly Timirit session'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speaker *
              </label>
              <input
                type="text"
                value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., Dn. Daniel T., Memhir Kidan"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g., The Good Shepherd and care for the flock"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* Summaries */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Summaries</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amharic Summary *
            </label>
            <textarea
              value={formData.amharicSummary}
              onChange={(e) => setFormData({ ...formData, amharicSummary: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Summary *
            </label>
            <textarea
              value={formData.englishSummary}
              onChange={(e) => setFormData({ ...formData, englishSummary: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        </div>

        {/* Key Points */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Key Points</h2>
          {formData.keyPoints.map((point, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Point {index + 1}
              </label>
              <textarea
                value={point}
                onChange={(e) => {
                  const newPoints = [...formData.keyPoints]
                  newPoints[index] = e.target.value
                  setFormData({ ...formData, keyPoints: newPoints })
                }}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter a key teaching point from this session"
              />
            </div>
          ))}
        </div>

        {/* Verses */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Scripture Verses</h2>
          {formData.verses.map((verse, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verse {index + 1}
              </label>
              <input
                type="text"
                value={verse}
                onChange={(e) => {
                  const newVerses = [...formData.verses]
                  newVerses[index] = e.target.value
                  setFormData({ ...formData, verses: newVerses })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., John 10:11-16, Psalm 23"
              />
            </div>
          ))}
        </div>

        {/* Mezmurs */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Mezmurs</h2>
          {mezmurs.map((mezmur, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Mezmur {index + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={mezmur.title}
                    onChange={(e) => {
                      const newMezmurs = [...mezmurs] as [FormMezmur, FormMezmur]
                      newMezmurs[index].title = e.target.value
                      setMezmurs(newMezmurs)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., የጎረስ መዝሙር"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transliteration
                  </label>
                  <input
                    type="text"
                    value={mezmur.transliteration || ''}
                    onChange={(e) => {
                      const newMezmurs = [...mezmurs] as [FormMezmur, FormMezmur]
                      newMezmurs[index].transliteration = e.target.value
                      setMezmurs(newMezmurs)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., Ye-Goros Mezmur"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={mezmur.youtubeUrl || ''}
                  onChange={(e) => {
                    const newMezmurs = [...mezmurs] as [FormMezmur, FormMezmur]
                    newMezmurs[index].youtubeUrl = e.target.value
                    setMezmurs(newMezmurs)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lyrics
                </label>
                <textarea
                  value={mezmur.lyrics || ''}
                  onChange={(e) => {
                    const newMezmurs = [...mezmurs] as [FormMezmur, FormMezmur]
                    newMezmurs[index].lyrics = e.target.value
                    setMezmurs(newMezmurs)
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter the mezmur lyrics here..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Questions</h2>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion('multiple-choice')}
              >
                + Multiple Choice
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion('short-answer')}
              >
                + Short Answer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion('reflection')}
              >
                + Reflection
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion('feedback-open')}
              >
                + Feedback
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion('attendance')}
              >
                + Attendance
              </Button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click the buttons above to add questions.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        Question {index + 1}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                        {question.type}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Prompt *
                      </label>
                      <textarea
                        value={question.prompt}
                        onChange={(e) => {
                          const newQuestions = [...questions]
                          newQuestions[index].prompt = e.target.value
                          setQuestions(newQuestions)
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your question here..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Helper Text
                      </label>
                      <input
                        type="text"
                        value={question.helperText || ''}
                        onChange={(e) => {
                          const newQuestions = [...questions]
                          newQuestions[index].helperText = e.target.value
                          setQuestions(newQuestions)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Optional guidance for the question..."
                      />
                    </div>

                    {/* Question type specific fields will be added here in a future update */}
                    {question.type === 'multiple-choice' && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                        Multiple choice options editing will be available in the next update.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/classes')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              isEditing ? 'Update Class' : 'Create Class'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}