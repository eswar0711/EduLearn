import React, { useState,} from 'react'
import Editor from '@monaco-editor/react'
import { CodingSubmission, CodingQuestion } from '../../utils/codingLabService'
import { toast } from 'react-toastify'

interface SubmissionDetailModalProps {
  submission: CodingSubmission | null
  question: CodingQuestion | null
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  question,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'details' | 'output'>('code')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{question?.title}</h2>
            <p className="text-sm text-gray-600 mt-1">View Your Submission</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : submission ? (
          <div className="p-6">
            {/* Submission Meta */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <p className="text-lg font-bold text-green-700 mt-1">
                  {submission.status === 'accepted' ? '✅ Accepted' : '❌ Failed'}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 font-medium">Language</p>
                <p className="text-lg font-bold text-blue-700 mt-1">{submission.language}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 font-medium">Tests Passed</p>
                <p className="text-lg font-bold text-purple-700 mt-1">
                  {submission.tests_passed}/{submission.total_tests}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600 font-medium">Submitted On</p>
                <p className="text-sm font-bold text-orange-700 mt-1">
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        // hour: '2-digit',
                        // minute: '2-digit',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'code'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💻 Code
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Details
                </button>
                {submission.output && (
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      activeTab === 'output'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📤 Output
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'code' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">Your Submitted Code (Read-only)</p>
                  </div>
                  <Editor
                    height="400px"
                    language={submission.language.toLowerCase() === 'c++' ? 'cpp' : submission.language.toLowerCase()}
                    value={submission.code}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
                      theme: 'vs-dark',
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                    theme="vs-dark"
                  />
                </div>

                {/* Copy Button */}
                <button
  onClick={() => {
    navigator.clipboard.writeText(submission.code)
      .then(() => {
        toast.success('Code copied to clipboard!')
      })
      .catch(() => {
        toast.error('Failed to copy code')
      })
  }}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
>
  📋 Copy Code
</button>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-gray-900">⚡ Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Execution Time</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {submission.execution_time ? `${submission.execution_time}ms` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Memory Used</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {submission.memory_used ? `${submission.memory_used}MB` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Tests Passed</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {submission.tests_passed}/{submission.total_tests}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {submission.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-bold text-red-900 mb-2">⚠️ Error Message</h3>
                    <pre className="text-sm text-red-800 bg-white p-3 rounded border border-red-100 overflow-x-auto">
                      {submission.error_message}
                    </pre>
                  </div>
                )}

                {/* Problem Details */}
                {question && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900">📋 Problem Details</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'output' && submission.output && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-900 mb-3">📤 Program Output</h3>
                  <pre className="bg-white p-4 rounded border border-gray-200 text-sm overflow-x-auto font-mono text-gray-800">
                    {submission.output}
                  </pre>
                </div>

                {/* Copy Output Button */}
                {/* <button
                  onClick={() => {
                    navigator.clipboard.writeText(submission.output || '')
                    alert('Output copied to clipboard!')
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  📋 Copy Output
                </button> */}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SubmissionDetailModal