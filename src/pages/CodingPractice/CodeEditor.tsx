import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import {
  executeCodeWithHiddenTests,
  executeAndSaveCode,
  CodingQuestion,
  ExecutionResult
} from '../../utils/codingLabService'
import {
  CheckCircle,
  AlertCircle,
  // Lock,
  // ChevronDown,
  Play,
  Upload
} from 'lucide-react'

interface CodeEditorProps {
  code?: string
  setCode?: (code: string) => void
  language?: string
  onRunComplete?: (result: ExecutionResult) => void

  question?: CodingQuestion
  user?: any
  onSubmitSuccess?: () => void
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code: externalCode = '',
  setCode: setExternalCode,
  language: externalLanguage,
  onRunComplete,
  question,
  user,
  onSubmitSuccess
}) => {
  const [internalCode, setInternalCode] = useState(externalCode || '')
  const code = externalCode !== undefined ? externalCode : internalCode
  const setCode = setExternalCode || setInternalCode

  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [loading, setLoading] = useState(false)
  // const [expandHiddenTests, setExpandHiddenTests] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const language = externalLanguage || question?.programming_language || 'python'

  /* ================= AUTO STARTER CODE ================= */
  useEffect(() => {
    if (!code) {
      if (language === 'java') {
        setCode(`class Main {
  public static void main(String[] args) {
    System.out.println("Hello");
  }
}`)
      }
      if (language === 'python') {
        setCode(`print("Hello")`)
      }
    }
  }, [language])
  /* ===================================================== */

  const runCode = async () => {
    if (!code.trim()) {
      alert('Please write some code')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const executionResult = await executeCodeWithHiddenTests(
        question?.id || '',
        code,
        language
      )

      setResult(executionResult)
      onRunComplete?.(executionResult)
    } catch (error) {
      const errorResult: ExecutionResult = {
        status: 'error',
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        memoryUsed: 0,
        testsPassed: 0,
        totalTests: 1
      }
      setResult(errorResult)
      onRunComplete?.(errorResult)
    } finally {
      setLoading(false)
    }
  }

  const submitSolution = async () => {
    if (!result || result.testsPassed !== result.totalTests) {
      alert('All tests must pass before submission')
      return
    }
    if (!question || !user) return

    setLoading(true)
    try {
      await executeAndSaveCode(question.id, user.id, code, language)
      setSubmitted(true)
      onSubmitSuccess?.()
      alert('✅ Solution submitted successfully')
    } catch {
      alert('❌ Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    result && result.testsPassed === result.totalTests && !submitted

  return (
    <div className="space-y-6">

      {/* ================= CODE EDITOR ================= */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Write Code</h3>

        <Editor
          height="480px"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false
          }}
        />

        <button
          onClick={runCode}
          disabled={loading}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Play size={16} />
          {loading ? 'Running...' : 'Run Code'}
        </button>
      </div>
      {/* =============================================== */}

      {/* ================= RESULT ================= */}
      {result && (
        <div
          className={`rounded-lg shadow p-6 border-l-4 ${
            result.testsPassed > 0
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <h3 className="flex items-center gap-2 font-semibold mb-3">
            {result.testsPassed > 0 ? (
              <CheckCircle className="text-green-600" />
            ) : (
              <AlertCircle className="text-red-600" />
            )}
            Test Result
          </h3>

          {result.error && (
            <pre className="bg-red-100 p-3 rounded text-sm text-red-700">
              {result.error}
            </pre>
          )}

          {!result.error && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm mb-1">Expected</p>
                <pre className="bg-white border p-2 rounded text-sm">
                  {result.expectedOutput}
                </pre>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Your Output</p>
                <pre className="bg-white border p-2 rounded text-sm">
                  {result.actualOutput}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      {/* =============================================== */}

      {/* ================= SUBMIT ================= */}
      {question && user && (
        <button
          disabled={!canSubmit || loading}
          onClick={submitSolution}
          className={`w-full py-3 rounded text-white font-semibold flex items-center justify-center gap-2 ${
            canSubmit
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <Upload size={18} />
          {submitted ? 'Submitted' : 'Submit Solution'}
        </button>
      )}
      {/* =============================================== */}
    </div>
  )
}

export default CodeEditor
