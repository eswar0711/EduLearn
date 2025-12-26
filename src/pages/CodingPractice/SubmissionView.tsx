import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabaseClient'
import { CodingSubmission, CodingQuestion } from '../../utils/codingLabService'
import SubmissionDetailModal from './SubmissionDetailModal'

const SubmissionView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<CodingSubmission | null>(null)
  const [question, setQuestion] = useState<CodingQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchSubmission()
  }, [id])

  const fetchSubmission = async () => {
    try {
      if (!id) throw new Error('No submission ID')

      const { data, error: submitError } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('id', id)
        .single()

      if (submitError) throw submitError
      setSubmission(data as CodingSubmission)

      // Fetch question
      const { data: questionData, error: qError } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('id', data.question_id)
        .single()

      if (qError) throw qError
      setQuestion(questionData as CodingQuestion)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load submission'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={() => navigate('/coding-lab')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Back to Coding Lab
          </button>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/coding-lab')}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ← Back to Coding Lab
        </button>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">{question?.title}</h1>
              {submission?.status === 'accepted' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                >
                  View Details
                </button>
              )}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded font-semibold ${
                  submission?.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {submission?.status === 'accepted' ? '✅ Accepted' : '❌ Failed'}
              </span>
              <span className="text-gray-600">
                Submitted: {new Date(submission?.submitted_at || '').toLocaleString()}
              </span>
            </div>
          </div>

          {/* Problem Details */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold mb-2">📋 Problem</h2>
            <p className="text-gray-700">{question?.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <strong>Sample Input:</strong>
                <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                  {question?.sample_input}
                </pre>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <strong>Sample Output:</strong>
                <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                  {question?.sample_output}
                </pre>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <strong>Sample Input:</strong>
                <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                  {question?.sample_input2}
                </pre>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <strong>Sample Output:</strong>
                <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                  {question?.sample_output2}
                </pre>
              </div>
            </div>
          </div>

          {/* Submitted Code */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold mb-2">💻 Your Code</h2>
            <div className="p-3 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-x-auto">
              <pre>{submission?.code}</pre>
            </div>
          </div>

          {/* Results */}
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4">📊 Results</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-gray-600 text-sm">Tests Passed</div>
                <div className="text-2xl font-bold">
                  {submission?.tests_passed}/{submission?.total_tests}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded">
                <div className="text-gray-600 text-sm">Execution Time</div>
                <div className="text-2xl font-bold">{submission?.execution_time}ms</div>
              </div>
              <div className="p-4 bg-orange-50 rounded">
                <div className="text-gray-600 text-sm">Memory Used</div>
                <div className="text-2xl font-bold">{submission?.memory_used}MB</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-gray-600 text-sm">Language</div>
                <div className="text-2xl font-bold">{submission?.language}</div>
              </div>
            </div>

            {submission?.error_message && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <strong>Error:</strong>
                <pre className="mt-2 text-sm overflow-x-auto">{submission.error_message}</pre>
              </div>
            )}

            {submission?.output && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                <strong>Output:</strong>
                <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                  {submission.output}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for detailed submission view */}
      <SubmissionDetailModal
        submission={submission}
        question={question}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default SubmissionView