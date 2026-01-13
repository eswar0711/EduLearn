import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { CodingQuestion } from '../../utils/codingLabService'
import { Plus, CheckCircle, AlertCircle, Clock, Trash2, Lock } from 'lucide-react'
import { Code2 } from 'lucide-react';


interface FacultyCodingManagementProps {
  user: any
}

interface CodingSubmission {
  id: string
  student_id: string
  student_name: string
  code: string
  status: string
  output: string
  tests_passed: number
  total_tests: number
  submitted_at: string
}

interface HiddenTestCase {
  id: string
  question_id: string
  input: string
  expected_output: string
  test_number: number
  is_active: boolean
  created_at: string
}

const FacultyCodingManagement: React.FC<FacultyCodingManagementProps> = ({ user }) => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CodingQuestion | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    programming_language: 'python',
    sample_input: '',
    sample_output: '',
    sample_input2: '',
    sample_output2: '',
    time_limit: 5,
    memory_limit: 256,
    is_published: false,
  })

  // ===== SUBMISSIONS STATES =====
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  const [selectedProblemTitle, setSelectedProblemTitle] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<CodingSubmission | null>(null)
  //const [showCodeModal, setShowCodeModal] = useState(false)

  // ===== HIDDEN TEST CASES STATES =====
  const [showHiddenTestsModal, setShowHiddenTestsModal] = useState(false)
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [hiddenTests, setHiddenTests] = useState<HiddenTestCase[]>([])
  const [hiddenTestsCount, setHiddenTestsCount] = useState<Record<string, number>>({})
  const [addingTest, setAddingTest] = useState(false)
  const [newTestData, setNewTestData] = useState({
    input: '',
    expected_output: '',
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('faculty_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])

      // Fetch submission counts
      if (data && data.length > 0) {
        const problemIds = data.map(p => p.id)
        const { data: submissionData } = await supabase
          .from('coding_submissions')
          .select('question_id')
          .in('question_id', problemIds)

        const counts: Record<string, number> = {}
        submissionData?.forEach(sub => {
          counts[sub.question_id] = (counts[sub.question_id] || 0) + 1
        })
        setSubmissionCounts(counts)

        // Fetch hidden test counts
        const { data: hiddenTestData } = await supabase
          .from('hidden_test_cases')
          .select('question_id')
          .in('question_id', problemIds)

        const testCounts: Record<string, number> = {}
        hiddenTestData?.forEach(test => {
          testCounts[test.question_id] = (testCounts[test.question_id] || 0) + 1
        })
        setHiddenTestsCount(testCounts)
      }
    } catch (err) {
      console.error('❌ Error fetching questions:', err)
    }
  }

  // ===== HIDDEN TEST CASES FUNCTIONS =====
  const fetchHiddenTests = async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('hidden_test_cases')
        .select('*')
        .eq('question_id', problemId)
        .order('test_number', { ascending: true })

      if (error) throw error
      setHiddenTests(data || [])
      setSelectedProblemId(problemId)
      setShowHiddenTestsModal(true)
    } catch (error) {
      console.error('❌ Error fetching hidden tests:', error)
    }
  }

  const addHiddenTest = async () => {
    if (!selectedProblemId || !newTestData.input || !newTestData.expected_output) {
      alert('Please fill in both input and expected output')
      return
    }

    try {
      const testNumber = hiddenTests.length + 1
      const { data, error } = await supabase
        .from('hidden_test_cases')
        .insert([
          {
            question_id: selectedProblemId,
            input: newTestData.input,
            expected_output: newTestData.expected_output,
            test_number: testNumber,
            is_active: true,
            faculty_id: user?.id,
          },
        ])
        .select()

      if (error) throw error
      
      setHiddenTests([...hiddenTests, data[0]])
      setNewTestData({ input: '', expected_output: '' })
      setAddingTest(false)
      fetchQuestions() // Update counts
    } catch (error) {
      console.error('❌ Error adding hidden test:', error)
      alert('Failed to add test case')
    }
  }

  const deleteHiddenTest = async (testId: string) => {
    if (!confirm('Delete this test case?')) return

    try {
      const { error } = await supabase
        .from('hidden_test_cases')
        .delete()
        .eq('id', testId)

      if (error) throw error
      
      setHiddenTests(hiddenTests.filter(t => t.id !== testId))
      fetchQuestions() // Update counts
    } catch (error) {
      console.error('❌ Error deleting hidden test:', error)
    }
  }

  const toggleTestActive = async (testId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hidden_test_cases')
        .update({ is_active: !currentStatus })
        .eq('id', testId)

      if (error) throw error
      
      setHiddenTests(hiddenTests.map(t => 
        t.id === testId ? { ...t, is_active: !currentStatus } : t
      ))
    } catch (error) {
      console.error('❌ Error updating test:', error)
    }
  }

  // ===== SUBMISSIONS FUNCTIONS =====
  const fetchSubmissions = async (problemId: string, problemTitle: string) => {
    try {
      const { data } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('question_id', problemId)
        .order('submitted_at', { ascending: false })

      if (data && data.length > 0) {
        const studentIds = data.map(d => d.student_id)
        const { data: studentData } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', studentIds)

        const studentMap = new Map(studentData?.map(s => [s.id, s.full_name]) || [])

        const submissionsWithNames = data.map(sub => ({
          ...sub,
          student_name: studentMap.get(sub.student_id) || 'Unknown Student',
        }))

        setSubmissions(submissionsWithNames)
      } else {
        setSubmissions([])
      }

      setSelectedProblemTitle(problemTitle)
      setShowSubmissionsModal(true)
    } catch (error) {
      console.error('❌ Error fetching submissions:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <AlertCircle className="w-4 h-4" />
            Error
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Running
          </span>
        )
    }
  }

  const deleteSubmission = async (submissionId: string) => {
    if (confirm('Delete this submission?')) {
      try {
        await supabase
          .from('coding_submissions')
          .delete()
          .eq('id', submissionId)

        setSubmissions(submissions.filter(s => s.id !== submissionId))
        fetchQuestions()
      } catch (error) {
        console.error('❌ Error deleting submission:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const { error } = await supabase
          .from('coding_questions')
          .update(formData)
          .eq('id', editing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('coding_questions').insert([
          {
            ...formData,
            faculty_id: user?.id,
          },
        ])

        if (error) throw error
      }

      setFormData({
        title: '',
        description: '',
        difficulty: 'medium',
        programming_language: 'python',
        sample_input: '',
        sample_output: '',
        sample_input2: '',
        sample_output2: '',
        time_limit: 5,
        memory_limit: 256,
        is_published: false,
      })
      setEditing(null)
      setShowForm(false)
      fetchQuestions()
    } catch (err) {
      console.error('❌ Error saving question:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return

    try {
      const { error } = await supabase.from('coding_questions').delete().eq('id', id)

      if (error) throw error
      fetchQuestions()
    } catch (err) {
      console.error('❌ Error deleting question:', err)
    }
  }

  const handleEdit = (question: CodingQuestion) => {
    setEditing(question)
    setFormData({
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      programming_language: question.programming_language,
      sample_input: question.sample_input,
      sample_output: question.sample_output,
      sample_input2: question.sample_input2,
      sample_output2: question.sample_output2,
      time_limit: question.time_limit,
      memory_limit: question.memory_limit,
      is_published: question.is_published,
    })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
  <div className="p-2 bg-blue-100 rounded-lg">
    <Code2 className="w-6 h-6 text-blue-600" />
  </div>
  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-teal-700 to-slate-800 bg-clip-text text-transparent">
  Coding Problem Management
</h1>

</div>

          <button
            onClick={() => {
              setEditing(null)
              setFormData({
                title: '',
                description: '',
                difficulty: 'medium',
                programming_language: 'python',
                sample_input: '',
                sample_output: '',
                sample_input2: '',
                sample_output2: '',
                time_limit: 5,
                memory_limit: 256,
                is_published: false,
              })
              setShowForm(true)
              }}
              className="
              w-full sm:w-auto
              flex items-center justify-center gap-2
              px-5 py-2.5
              bg-gradient-to-r from-purple-700 to-emerald-400
              text-white font-semibold
              rounded-lg
              shadow-md
              hover:from-purple-800 hover:to-emerald-600
              hover:shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            <Plus className="w-5 h-5" />
            Create Problem
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editing ? 'Edit Problem' : 'Create New Problem'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="col-span-2 p-2 border rounded"
                  required
                />

                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="p-2 border rounded"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={formData.programming_language}
                  onChange={(e) =>
                    setFormData({ ...formData, programming_language: e.target.value })
                  }
                  className="p-2 border rounded"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-2 p-2 border rounded"
                  required
                />

                <textarea
                  placeholder="Sample Input 1"
                  value={formData.sample_input}
                  onChange={(e) => setFormData({ ...formData, sample_input: e.target.value })}
                  className="p-2 border rounded"
                />

                <textarea
                  placeholder="Sample Output 1"
                  value={formData.sample_output}
                  onChange={(e) => setFormData({ ...formData, sample_output: e.target.value })}
                  className="p-2 border rounded"
                />

                <textarea
                  placeholder="Sample Input 2"
                  value={formData.sample_input2}
                  onChange={(e) => setFormData({ ...formData, sample_input2: e.target.value })}
                  className="p-2 border rounded"
                />

                <textarea
                  placeholder="Sample Output 2"
                  value={formData.sample_output2}
                  onChange={(e) => setFormData({ ...formData, sample_output2: e.target.value })}
                  className="p-2 border rounded"
                />

                <input
                  type="number"
                  placeholder="Time Limit (seconds)"
                  value={formData.time_limit}
                  onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                  className="p-2 border rounded"
                />

                <input
                  type="number"
                  placeholder="Memory Limit (MB)"
                  value={formData.memory_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, memory_limit: parseInt(e.target.value) })
                  }
                  className="p-2 border rounded"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <span>Publish for Students</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editing ? 'Update' : 'Create'} Problem
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">

  {/* ================= DESKTOP TABLE ================= */}
  <div className="hidden md:block">
    <table className="w-full">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-4 text-left">Title</th>
          <th className="p-4 text-left">Difficulty</th>
          <th className="p-4 text-left">Language</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-left">Submissions</th>
          <th className="p-4 text-left">Hidden Tests</th>
          <th className="p-4 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {questions.map((q) => (
          <tr key={q.id} className="border-t hover:bg-gray-50">
            <td className="p-4 font-medium">{q.title}</td>

            <td className="p-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {q.difficulty}
              </span>
            </td>

            <td className="p-4">{q.programming_language}</td>
            <td className="p-4">{q.is_published ? '✅ Published' : '⭕ Draft'}</td>

            <td className="p-4 text-blue-600 font-semibold">
              {submissionCounts[q.id] || 0}
            </td>

            <td className="p-4 flex items-center gap-1.5 text-purple-600 font-semibold">
              <Lock className="w-4 h-4" />
              {hiddenTestsCount[q.id] || 0}
            </td>

            <td className="p-4 align-middle">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button
                onClick={() => fetchHiddenTests(q.id)}
               className="px-3 py-1 gap-1.5 bg-purple-500 text-white rounded text-sm">
              
                Tests
              </button>
              <button
                onClick={() => fetchSubmissions(q.id, q.title)}
                className="px-3 py-1 gap-1.5 bg-green-500 text-white rounded text-sm"
              >
                View
              </button>
              <button
                onClick={() => handleEdit(q)}
                className="px-3 py-1 gap-1.5 bg-blue-500 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                className="px-3 py-1 gap-1.5 bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
              </div>
            </td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* ================= MOBILE CARDS ================= */}
  <div className="md:hidden space-y-4 p-4">
    {questions.map((q) => (
      <div
        key={q.id}
        className="border rounded-xl p-4 shadow-sm space-y-3"
      >
        {/* Header */}
        <div>
          <p className="font-semibold text-gray-800 text-base">{q.title}</p>
          <p className="text-sm text-gray-500">
            {q.programming_language}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-1 rounded font-medium ${
            q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {q.difficulty}
          </span>

          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
            {q.is_published ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Submissions</p>
            <p className="font-semibold text-blue-600">
              {submissionCounts[q.id] || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Hidden Tests</p>
            <p className="font-semibold text-purple-600 flex items-center gap-1">
              <Lock className="w-4 h-4" />
              {hiddenTestsCount[q.id] || 0}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => fetchHiddenTests(q.id)}
            className="flex-1 bg-purple-500 text-white px-3 py-2 rounded text-sm"
          >
            Tests
          </button>
          <button
            onClick={() => fetchSubmissions(q.id, q.title)}
            className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm"
          >
            View
          </button>
          <button
            onClick={() => handleEdit(q)}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(q.id)}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

      </div>

      {/* ===== HIDDEN TESTS MODAL ===== */}
      {showHiddenTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Hidden Test Cases
                </h3>
                <p className="text-sm text-gray-600 mt-1">These tests are hidden from students</p>
              </div>
              <button
                onClick={() => setShowHiddenTestsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Existing Hidden Tests */}
              {hiddenTests.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Test Cases ({hiddenTests.length})</h4>
                  {hiddenTests.map((test, idx) => (
                    <div key={test.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-800">Test {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={test.is_active}
                              onChange={() => toggleTestActive(test.id, test.is_active)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-600">Active</span>
                          </label>
                          <button
                            onClick={() => deleteHiddenTest(test.id)}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-1">Input:</p>
                          <pre className="bg-white p-2 rounded border border-gray-200 text-xs overflow-x-auto">
                            {test.input}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-1">Expected Output:</p>
                          <pre className="bg-white p-2 rounded border border-gray-200 text-xs overflow-x-auto">
                            {test.expected_output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hidden test cases yet. Add one to prevent cheating!
                </div>
              )}

              {/* Add New Test */}
              {!addingTest ? (
                <button
                  onClick={() => setAddingTest(true)}
                  className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Test Case
                </button>
              ) : (
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h4 className="font-semibold text-gray-800 mb-3">New Test Case</h4>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Input (what student will type)"
                      value={newTestData.input}
                      onChange={(e) => setNewTestData({ ...newTestData, input: e.target.value })}
                      className="w-full p-2 border rounded font-mono text-sm"
                      rows={3}
                    />
                    <textarea
                      placeholder="Expected Output"
                      value={newTestData.expected_output}
                      onChange={(e) => setNewTestData({ ...newTestData, expected_output: e.target.value })}
                      className="w-full p-2 border rounded font-mono text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addHiddenTest}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save Test
                      </button>
                      <button
                        onClick={() => {
                          setAddingTest(false)
                          setNewTestData({ input: '', expected_output: '' })
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== SUBMISSIONS MODAL ===== */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Student Submissions</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedProblemTitle}</p>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No submissions yet for this problem
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {submissions.map(submission => (
                  <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{submission.student_name}</p>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(submission.status)}
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View Code
                        </button>
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">
                        Tests Passed: <span className="font-semibold">{submission.tests_passed}/{submission.total_tests}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CODE VIEWER MODAL ===== */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">Code Submission - {selectedSubmission.student_name}</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">📝 Code:</h4>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm overflow-x-auto">
                  <code>{selectedSubmission.code}</code>
                </pre>
              </div>
              {selectedSubmission.output && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">📤 Output:</h4>
                  <pre className="text-sm text-blue-800 overflow-x-auto">{selectedSubmission.output}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyCodingManagement