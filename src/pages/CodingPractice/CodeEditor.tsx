import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import {
  executeCodeWithHiddenTests,
 // executeAndSaveCode,
  CodingQuestion,
  ExecutionResult
} from '../../utils/codingLabService'
import {
  CheckCircle,
  AlertCircle,
  Play,
  XCircle
  //Upload
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
  // user,
  // onSubmitSuccess
}) => {
  const [internalCode, setInternalCode] = useState(externalCode || '')
  const code = externalCode !== undefined ? externalCode : internalCode
  const setCode = setExternalCode || setInternalCode


  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [loading, setLoading] = useState(false)
  //const [submitted, setSubmitted] = useState(false)
  const [selectedTestTab, setSelectedTestTab] = useState(0)


  /* /🔔 TOAST STATE */
  // const [toast,] = useState<{
  //   message: string
  //   type: 'success' | 'error'
  // } | null>(null)


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
    setSelectedTestTab(0)


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


  // const submitSolution = async () => {
  //   if (!result || result.testsPassed !== result.totalTests) {
  //     alert('All tests must pass before submission')
  //     return
  //   }
  //   if (!question || !user) return


  //   setLoading(true)
  //   try {
  //     await executeAndSaveCode(question.id, user.id, code, language)
  //     setSubmitted(true)
  //     onSubmitSuccess?.()


  //     /* ✅ SUCCESS TOAST */
  //     setToast({ message: 'Solution submitted successfully!', type: 'success' })
  //   } catch {
  //     /* ❌ ERROR TOAST */
  //     setToast({ message: 'Submission failed. Try again!', type: 'error' })
  //   } finally {
  //     setLoading(false)
  //     setTimeout(() => setToast(null), 3000)
  //   }
  // }


  // const canSubmit =
  //   result && result.testsPassed === result.totalTests && !submitted


  return (
    <div className="space-y-6 relative">


      {/* 🔔 TOAST UI */}
      {/* {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 animate-fade-in ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )} */}


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


      {/* ================= RESULT ================= */}
      {result && (
        <div
          className={`rounded-lg shadow p-6 border-l-4 ${
            result.status === 'success'
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          {/* ===== HEADER ===== */}
          <h3 className="flex items-center gap-2 font-semibold mb-4 text-lg">
            {result.status === 'success' ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
            {result.status === 'success' ? ' All Tests Passed!' : 'Tests Failed'}
          </h3>


          {/* ===== ERROR MESSAGE ===== */}
          {result.error && (
            <div className="mb-4 bg-red-100 border border-red-300 p-4 rounded">
              <p className="font-semibold text-red-800 mb-2">Error:</p>
              <pre className="text-sm text-red-700 overflow-x-auto whitespace-pre-wrap">
                {result.error}
              </pre>
            </div>
          )}


          {/* ===== SAMPLE TEST RESULTS (COMPACT TABBED VIEW!) ===== */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
              <span className=" w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">S</span>
              Sample Tests
            </h4>

            {result.sampleTestResults && result.sampleTestResults.length > 0 ? (
              <div>
                {/* Tab Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
  {result.sampleTestResults.map((test, idx) => {
    const isActive = selectedTestTab === idx;

    return (
      <button
        key={idx}
        onClick={() => setSelectedTestTab(idx)}
        className={`px-4 py-2 rounded text-sm font-semibold transition-all flex items-center gap-2 ${
          isActive
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {test.passed ? (
          <CheckCircle
            className={`w-4 h-4 ${
              isActive ? 'text-white' : 'text-green-600'
            }`}
          />
        ) : (
          <XCircle
            className={`w-4 h-4 ${
              isActive ? 'text-white' : 'text-red-600'
            }`}
          />
        )}
        Case {test.index}
      </button>
    );
  })}
</div>



                {/* Tab Content */}
                {result.sampleTestResults[selectedTestTab] && (
                  <div className={`border-2 rounded-lg overflow-hidden ${
                    result.sampleTestResults[selectedTestTab].passed
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}>
                    <div className={`px-4 py-2 text-sm font-semibold ${
                      result.sampleTestResults[selectedTestTab].passed
                        ? 'bg-green-200 text-green-900'
                        : 'bg-red-200 text-red-900'
                    }`}>
                      Test Case {result.sampleTestResults[selectedTestTab].index} - {result.sampleTestResults[selectedTestTab].passed ? '✅ Passed' : '❌ Failed'}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {/* Input */}
                      <div>
                        <label className="text-xs text-gray-700 uppercase font-bold block mb-2">📥 Input</label>
                        <pre className="bg-white p-2 rounded text-sm font-mono border border-gray-300 overflow-x-auto">
                          {result.sampleTestResults[selectedTestTab].input || '(empty)'}
                        </pre>
                      </div>

                      {/* Expected vs Actual */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-700 uppercase font-bold block mb-2">📊 Expected</label>
                          <pre className="bg-blue-100 p-2 rounded text-sm font-mono border border-blue-300 overflow-x-auto">
                            {result.sampleTestResults[selectedTestTab].expectedOutput || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <label className="text-xs text-gray-700 uppercase font-bold block mb-2">🎯 Your Output</label>
                          <pre className={`p-2 rounded text-sm font-mono border overflow-x-auto ${
                            result.sampleTestResults[selectedTestTab].passed
                              ? 'bg-green-100 border-green-300'
                              : 'bg-red-100 border-red-300'
                          }`}>
                            {result.sampleTestResults[selectedTestTab].actualOutput || '(empty)'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // No sample results
              !result.error && (
                <div className="bg-gray-100 border border-gray-300 rounded p-4 text-gray-600 text-sm">
                  No sample test results available
                </div>
              )
            )}
          </div>


          {/* ===== HIDDEN TEST RESULTS (if available) ===== */}
          {result.hiddenTestsResult && (
            <div className="mb-6 border-t pt-6">
              <h4 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold">H</span>
                Hidden Tests
              </h4>


              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <p className="text-sm text-purple-700 font-medium">Tests Passed</p>
                  <div className="text-3xl font-bold text-purple-800 mt-2">
                    {result.hiddenTestsResult.testsPassed}/{result.hiddenTestsResult.totalTests}
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(result.hiddenTestsResult.testsPassed / result.hiddenTestsResult.totalTests) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>


                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <p className="text-sm text-gray-700 font-medium">Performance</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Execution Time:</span>
                      <span className="font-semibold">{result.executionTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Used:</span>
                      <span className="font-semibold">{result.memoryUsed}MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ===== TEST SUMMARY ===== */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Overall: {result.testsPassed}/{result.totalTests} tests passed
              </span>
              {result.status === 'success' && (
                <span className="text-green-700 font-semibold">🎉 Ready to submit!</span>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ================= SUBMIT ================= */}
      {/* {question && user && (
        <button
          disabled={!canSubmit || loading}
          onClick={submitSolution}
          className={`w-full py-3 rounded text-white font-semibold flex items-center justify-center gap-2 ${
            canSubmit
              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <Upload size={18} />
          {submitted ? '✅ Submitted' : 'Submit Solution'}
        </button>
      )} */}
    </div>
  )
}



export default CodeEditor