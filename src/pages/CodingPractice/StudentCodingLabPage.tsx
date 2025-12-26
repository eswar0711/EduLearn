import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabaseClient'
import { executeAndSaveCode, CodingQuestion, CodingSubmission, ExecutionResult } from '../../utils/codingLabService'
import CodeEditor from './CodeEditor'
import SubmissionDetailModal from './SubmissionDetailModal'

interface StudentCodingLabPageProps {
  user: any
}

const StudentCodingLabPage: React.FC<StudentCodingLabPageProps> = ({ user }) => {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')
  const [lastRunResult, setLastRunResult] = useState<ExecutionResult | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<CodingSubmission | null>(null)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchSubmissions()
  }, [])

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

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('student_id', user?.id)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (err) {
      console.error('❌ Error fetching submissions:', err)
    }
  }

  const handleSelectQuestion = (question: CodingQuestion) => {
    setSelectedQuestion(question)
    setCode('')
    setError(null)
    setLastRunResult(null)
    // Auto-select language based on question requirement
    const lang = question.programming_language.toLowerCase()
    if (lang === 'c++') setLanguage('cpp')
    else if (lang === 'c#') setLanguage('csharp')
    else setLanguage(lang)
  }

  const handleRunComplete = (result: ExecutionResult) => {
    setLastRunResult(result)

    // Show appropriate message
    if (result.status === 'success') {
      setError(null) // Clear any previous errors
    } else if (result.status === 'test_failed') {
      setError(`❌ Test Failed! Please review your code and try again.`)
    } else if (result.status === 'error') {
      setError('❌ Compilation Error! Please fix your code.')
    }
  }

  const handleSubmitCode = async () => {
    if (!selectedQuestion || !code.trim()) {
      setError('Please write some code first')
      return
    }

    // Check if code passed all tests (sample + hidden) before allowing submission
    if (!lastRunResult || lastRunResult.status !== 'success') {
      setError('❌ Your code must pass all tests before submission. Click "Run Code" and fix any failures.')
      return
    }

    // Check if all hidden tests passed (if any exist)
    if (lastRunResult.hiddenTestsResult) {
      if (lastRunResult.hiddenTestsResult.testsPassed !== lastRunResult.hiddenTestsResult.totalTests) {
        setError(`❌ All hidden tests must pass! (${lastRunResult.hiddenTestsResult.testsPassed}/${lastRunResult.hiddenTestsResult.totalTests} passed)`)
        return
      }
    }

    try {
      setSubmitting(true)
      setError(null)
      const submission = await executeAndSaveCode(
        selectedQuestion.id,
        user.id,
        code,
        language
      )
      // Refresh submissions after successful submission
      await fetchSubmissions()
      navigate(`/submission/${submission.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewSubmission = async (questionId: string) => {
    try {
      setIsLoadingSubmission(true)
      // Fetch the most recent accepted submission for this question
      const { data, error } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('question_id', questionId)
        .eq('student_id', user?.id)
        .eq('status', 'accepted')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      setSelectedSubmission(data as CodingSubmission)
      setIsModalOpen(true)
    } catch (err) {
      console.error('❌ Error fetching submission:', err)
      setError('Failed to load submission')
    } finally {
      setIsLoadingSubmission(false)
    }
  }

  const filteredQuestions = questions.filter(q => {
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    if (filterLanguage !== 'all' && q.programming_language.toLowerCase() !== filterLanguage.toLowerCase()) return false
    return true
  })

  // Check if current question's solution was accepted
  const isQuestionAccepted = selectedQuestion
    ? submissions.some(s => s.question_id === selectedQuestion.id && s.status === 'accepted')
    : false

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Coding Practice Lab</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h2 className="text-lg font-bold mb-4">Problems ({filteredQuestions.length})</h2>

              {/* Filters */}
              <div className="mb-4 space-y-2">
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Languages</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="c++">C++</option>
                </select>
              </div>

              {/* Questions */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredQuestions.map(q => {
                  const submitted = submissions.some(s => s.question_id === q.id && s.status === 'accepted')
                  const attempted = submissions.some(s => s.question_id === q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      className={`w-full p-3 text-left rounded transition-all ${
                        selectedQuestion?.id === q.id
                          ? 'bg-blue-100 border-2 border-blue-500 shadow'
                          : 'bg-gray-100 border hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-semibold text-sm">{q.title}</div>
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
                        {submitted ? '✅ Passed' : attempted ? '🔄 Attempted' : '⭕ Not started'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Editor & Submission */}
          <div className="lg:col-span-2">
            {selectedQuestion ? (
              <div className="space-y-4">
                {/* Problem Details */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">{selectedQuestion.title}</h2>
                    {isQuestionAccepted && (
                      <div className="flex items-center gap-3">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold">
                          ✅ Accepted
                        </span>
                        <button
                          onClick={() => handleViewSubmission(selectedQuestion.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                        >
                          View Submission
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{selectedQuestion.description}</p>

                  {/* Sample Input/Output */}
                  {selectedQuestion.sample_input && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <strong className="text-blue-700">📥 Sample Input:</strong>
                        <pre className="mt-2 font-mono text-xs bg-white p-2 rounded border border-blue-100 max-h-20 overflow-y-auto">
                          {selectedQuestion.sample_input}
                        </pre>
                      </div>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <strong className="text-green-700">📤 Expected Output:</strong>
                        <pre className="mt-2 font-mono text-xs bg-white p-2 rounded border border-green-100 max-h-20 overflow-y-auto">
                          {selectedQuestion.sample_output}
                        </pre>
                      </div>
                      </div>
                  )}
                  {selectedQuestion.sample_input2 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <strong className="text-blue-700">📥 Sample Input:</strong>
                        <pre className="mt-2 font-mono text-xs bg-white p-2 rounded border border-blue-100 max-h-20 overflow-y-auto">
                          {selectedQuestion.sample_input2}
                        </pre>
                      </div>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <strong className="text-green-700">📤 Expected Output:</strong>
                        <pre className="mt-2 font-mono text-xs bg-white p-2 rounded border border-green-100 max-h-20 overflow-y-auto">
                          {selectedQuestion.sample_output2}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="p-2 bg-blue-100 rounded">
                      <strong>Difficulty:</strong> {selectedQuestion.difficulty}
                    </div>
                    <div className="p-2 bg-green-100 rounded">
                      <strong>Language:</strong> {selectedQuestion.programming_language}
                    </div>
                    <div className="p-2 bg-purple-100 rounded">
                      <strong>Time Limit:</strong> {selectedQuestion.time_limit}s
                    </div>
                  </div>
                </div>

                {/* Code Editor with Hidden Test Support */}
                <CodeEditor
                  question={selectedQuestion}
                  user={user}
                  code={code}
                  setCode={setCode}
                  language={language}
                  onRunComplete={handleRunComplete}
                />

                {/* Error Alert */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Success Alert */}
                {lastRunResult && lastRunResult.status === 'success' && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <strong>✅ All tests passed!</strong>
                    {lastRunResult.hiddenTestsResult && (
                      <div className="text-sm mt-2">
                        Sample Test: ✅ Passed
                        <br />
                        Hidden Tests: ✅ {lastRunResult.hiddenTestsResult.testsPassed}/{lastRunResult.hiddenTestsResult.totalTests} Passed
                      </div>
                    )}
                    Your code is ready to submit.
                  </div>
                )}

                {/* Test Failed Alert */}
                {lastRunResult && lastRunResult.status === 'test_failed' && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <strong>❌ Test failed!</strong> Please review and try again.
                    {lastRunResult.hiddenTestsResult && (
                      <div className="text-sm mt-2">
                        Hidden Tests: {lastRunResult.hiddenTestsResult.testsPassed}/{lastRunResult.hiddenTestsResult.totalTests} Passed
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitCode}
                  disabled={submitting || !code.trim() || !lastRunResult || lastRunResult.status !== 'success'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded text-lg transition-colors"
                >
                  {submitting ? '⏳ Submitting...' : '🚀 Final Submit'}
                </button>

                {/* Requirement Note */}
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                  💡 <strong>Important:</strong> Your code must pass all sample and hidden tests to submit. Click "Run Code" to test your solution first.
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 text-lg">📋 Select a problem to start coding</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={isLoadingSubmission}
      />
    </div>
  )
}

export default StudentCodingLabPage