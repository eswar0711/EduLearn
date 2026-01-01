import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabaseClient'
import {
  CodingQuestion,
  CodingSubmission
} from '../../utils/codingLabService'

interface StudentCodingLabPageProps {
  user: any
}

const StudentCodingLabPage: React.FC<StudentCodingLabPageProps> = ({ user }) => {
  const navigate = useNavigate()

  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [error, setError] = useState<string | null>(null)

  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  useEffect(() => {
    fetchQuestions()
    fetchSubmissions()
  }, [])

  /* ================= FETCH QUESTIONS ================= */
  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (err) {
      console.error('❌ Error fetching questions:', err)
      setError('Failed to load questions')
    }
  }

  /* ================= FETCH SUBMISSIONS ================= */
  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('student_id', user?.id)

      if (error) throw error
      setSubmissions(data || [])
    } catch (err) {
      console.error('❌ Error fetching submissions:', err)
    }
  }

  /* ================= ONLY CHANGE HERE ================= */
  const handleSelectQuestion = (question: CodingQuestion) => {
    navigate(`/coding-lab/${question.id}`) // ✅ ROUTE-BASED
  }

  /* ================= FILTER ================= */
  const filteredQuestions = questions.filter(q => {
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    if (
      filterLanguage !== 'all' &&
      q.programming_language.toLowerCase() !== filterLanguage.toLowerCase()
    )
      return false
    return true
  })

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Coding Practice Lab</h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">
            Problems ({filteredQuestions.length})
          </h2>

          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c++">C++</option>
            </select>
          </div>

          {/* Question List */}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto">
            {filteredQuestions.map(q => {
              const passed = submissions.some(
                s => s.question_id === q.id && s.status === 'accepted'
              )
              const attempted = submissions.some(s => s.question_id === q.id)

              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className="w-full p-4 text-left rounded bg-gray-100 hover:bg-blue-100 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{q.title}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                            q.difficulty === 'easy'
                              ? 'bg-green-100 text-green-700'
                              : q.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        {q.programming_language}
                      </div>
                    </div>

                    <div className="text-sm font-semibold">
                      {passed && <span className="text-green-600">✅ Passed</span>}
                      {!passed && attempted && (
                        <span className="text-yellow-600">🔄 Attempted</span>
                      )}
                      {!attempted && (
                        <span className="text-gray-500">⭕ Not Started</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCodingLabPage