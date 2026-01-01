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
  const [error, setError] = useState<string | null>(null)
  const [lastRunResult, setLastRunResult] = useState<ExecutionResult | null>(null)

  /* 🔹 MODAL STATE (UNCHANGED) */
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] =
    useState<CodingSubmission | null>(null)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false)

  /* 🔹 MOBILE TAB STATE */
  const [activeTab, setActiveTab] = useState<'problem' | 'code'>('problem')

  const isMobile = window.innerWidth < 768

  /* ================= FETCH DATA ================= */
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

    if (result.status === 'success') setError(null)
    else if (result.status === 'test_failed')
      setError('❌ Test failed. Please review your code.')
    else if (result.status === 'error')
      setError('❌ Compilation/runtime error.')
  }

  /* ================= SUBMIT ================= */
  const handleSubmitCode = async () => {
    if (!question || !code.trim()) {
      setError('Please write some code first')
      return
    }

    if (!lastRunResult || lastRunResult.status !== 'success') {
      setError('❌ Your code must pass all tests before submission.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const submission = await executeAndSaveCode(
        question.id,
        user.id,
        code,
        language
      )

      await fetchSubmissions()
      navigate(`/submission/${submission.id}`)
    } catch (err: any) {
      setError(err.message || 'Submission failed')
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

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        {(!isMobile || activeTab === 'problem') && (
          <div className="w-full md:w-2/5 overflow-y-auto p-6 bg-white border-r">
            <h2 className="font-bold text-xl mb-4">Problem Description</h2>
            <p className="whitespace-pre-wrap">{question.description}</p>

            <div className="mt-6">
              <h3 className="font-semibold">Sample Test Cases</h3>

              {[1, 2].map(i => {
                const input = question[`sample_input${i === 1 ? '' : '2'}` as keyof CodingQuestion]
                const output = question[`sample_output${i === 1 ? '' : '2'}` as keyof CodingQuestion]
                if (!input || !output) return null

                return (
                  <div key={i} className="mt-4 border rounded p-3 bg-gray-50">
                    <p className="font-semibold mb-1">Sample Test Case {i}</p>
                    <pre className="bg-white p-2 mb-2">{input}</pre>
                    <pre className="bg-white p-2">{output}</pre>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* RIGHT PANEL */}
        {(!isMobile || activeTab === 'code') && (
          <div className="w-full md:w-3/5 overflow-y-auto p-6">
            <CodeEditor
              question={question}
              user={user}
              code={code}
              setCode={setCode}
              language={language}
              onRunComplete={handleRunComplete}
            />

            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
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

      {/* SUBMISSION MODAL */}
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