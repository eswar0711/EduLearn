import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabaseClient'
import {
  CodingQuestion,
  CodingSubmission,
  ExecutionResult,
  executeAndSaveCode
} from '../../utils/codingLabService'
import CodeEditor from './CodeEditor'
import SubmissionDetailModal from './SubmissionDetailModal'

interface CodingProblemPageProps {
  user: any
}

const CodingProblemPage: React.FC<CodingProblemPageProps> = ({ user }) => {
  const { problemId } = useParams<{ problemId: string }>()
  const navigate = useNavigate()

  const [question, setQuestion] = useState<CodingQuestion | null>(null)
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')

  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [lastRunResult, setLastRunResult] = useState<ExecutionResult | null>(null)

  /* MODAL */
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] =
    useState<CodingSubmission | null>(null)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false)

  /* MOBILE */
  const [activeTab, setActiveTab] = useState<'problem' | 'code'>('problem')
  const isMobile = window.innerWidth < 768

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!problemId) return
    fetchQuestion(problemId)
    fetchSubmissions()
  }, [problemId])

  const fetchQuestion = async (id: string) => {
    const { data } = await supabase
      .from('coding_questions')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setQuestion(data)
      const lang = data.programming_language.toLowerCase()
      if (lang === 'c++') setLanguage('cpp')
      else if (lang === 'c#') setLanguage('csharp')
      else setLanguage(lang)
    }
  }

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('coding_submissions')
      .select('*')
      .eq('student_id', user?.id)
      .order('submitted_at', { ascending: false })

    setSubmissions(data || [])
  }

  /* ================= RUN COMPLETE ================= */
  const handleRunComplete = (result: ExecutionResult) => {
    setLastRunResult(result)
    setSubmissionError(null) // 🔑 clear only submission-level errors
  }

  /* ================= SUBMIT ================= */
  const handleSubmitCode = async () => {
    if (!question) return

    if (!code.trim()) {
      setSubmissionError('⚠️ Please write code before submitting.')
      return
    }

    if (!lastRunResult) {
      setSubmissionError('⚠️ Please run your code before submitting.')
      return
    }

    if (lastRunResult.status !== 'success') {
      setSubmissionError(
        '❌ Fix code errors and ensure all tests pass before submission.'
      )
      return
    }

    try {
      setSubmitting(true)
      setSubmissionError(null)

      const submission = await executeAndSaveCode(
        question.id,
        user.id,
        code,
        language
      )

      await fetchSubmissions()
      navigate(`/submission/${submission.id}`)
    } catch (err: any) {
      setSubmissionError(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= VIEW SUBMISSION ================= */
  const handleViewSubmission = async () => {
    if (!question) return

    try {
      setIsLoadingSubmission(true)

      const { data } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('question_id', question.id)
        .eq('student_id', user?.id)
        .eq('status', 'accepted')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setSelectedSubmission(data)
        setIsModalOpen(true)
      }
    } finally {
      setIsLoadingSubmission(false)
    }
  }

  if (!question) {
    return <div className="p-10 text-center">Loading problem...</div>
  }

  const isAccepted = submissions.some(
    s => s.question_id === question.id && s.status === 'accepted'
  )

  /* ================= RENDER ================= */
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/coding-lab')}
          className="text-blue-600 font-semibold"
        >
          ← Problems
        </button>

        <h1 className="text-lg font-bold">{question.title}</h1>

        <div className="flex items-center gap-3">
          {isAccepted && (
            <button
              onClick={handleViewSubmission}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              View Submission
            </button>
          )}

          <span className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* MOBILE TABS */}
      {isMobile && (
        <div className="flex border-b bg-white">
          <button
            className={`flex-1 py-2 ${
              activeTab === 'problem'
                ? 'border-b-2 border-blue-600 font-bold'
                : ''
            }`}
            onClick={() => setActiveTab('problem')}
          >
            Problem
          </button>
          <button
            className={`flex-1 py-2 ${
              activeTab === 'code'
                ? 'border-b-2 border-blue-600 font-bold'
                : ''
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>
      )}

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        {(!isMobile || activeTab === 'problem') && (
          <div className="w-full md:w-2/5 p-6 bg-white border-r overflow-y-auto">
            <h2 className="font-bold text-xl mb-4">Problem Description</h2>
            <p className="whitespace-pre-wrap">{question.description}</p>
          </div>
        )}

        {/* RIGHT */}
        {(!isMobile || activeTab === 'code') && (
          <div className="w-full md:w-3/5 p-6 overflow-y-auto">
            <CodeEditor
              question={question}
              code={code}
              setCode={setCode}
              language={language}
              onRunComplete={handleRunComplete}
            />

            {submissionError && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {submissionError}
              </div>
            )}

            <button
              onClick={handleSubmitCode}
              disabled={
                submitting ||
                !code.trim() ||
                !lastRunResult ||
                lastRunResult.status !== 'success'
              }
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded disabled:bg-gray-400"
            >
              {submitting ? '⏳ Submitting...' : '🚀 Final Submit'}
            </button>
          </div>
        )}
      </div>

      <SubmissionDetailModal
        submission={selectedSubmission}
        question={question}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={isLoadingSubmission}
      />
    </div>
  )
}

export default CodingProblemPage
