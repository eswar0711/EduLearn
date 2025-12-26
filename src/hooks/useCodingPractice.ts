
import { useState, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import axios from 'axios'

export interface CodingQuestion {
  id: string
  faculty_id: string
  subject_id?: string
  title: string
  description: string
  problem_statement: string
  difficulty: 'easy' | 'medium' | 'hard'
  programming_language: 'python' | 'javascript' | 'java' | 'cpp' | 'c' | 'go' | 'rust'
  sample_input: string
  sample_output: string
  sample_input2: string
  sample_output2: string
  test_cases: any[]
  time_limit_seconds: number
  memory_limit_mb: number
  is_published: boolean
  is_active: boolean
  deadline?: string
  points: number
  created_at: string
  updated_at: string
}

export interface CodingSubmission {
  id: string
  question_id: string
  student_id: string
  code_content: string
  programming_language: string
  status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'compilation_error'
  passed_test_cases: number
  total_test_cases: number
  execution_time_ms?: number
  memory_used_mb?: number
  error_message?: string
  execution_output?: string
  is_latest: boolean
  submitted_at: string
  graded_at?: string
}

export interface CodingAttempt {
  student_id: string
  question_id: string
  total_attempts: number
  first_attempt_at: string
  last_attempt_at: string
  best_status: string
  is_solved: boolean
  solved_at?: string
  time_taken_minutes?: number
}

export function useCodingPractice() {
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [attempts, setAttempts] = useState<CodingAttempt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ========== QUESTION OPERATIONS ==========

  const fetchQuestions = useCallback(async (filters?: {
    faculty_id?: string
    is_published?: boolean
    difficulty?: string
    language?: string
  }) => {
    setLoading(true)
    try {
      let query = supabase.from('coding_questions').select('*')

      if (filters?.faculty_id) {
        query = query.eq('faculty_id', filters.faculty_id)
      }
      if (filters?.is_published !== undefined) {
        query = query.eq('is_published', filters.is_published)
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters?.language) {
        query = query.eq('programming_language', filters.language)
      }

      const { data, error: err } = await query.order('created_at', { ascending: false })

      if (err) throw err
      setQuestions(data || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch questions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createQuestion = useCallback(async (question: Omit<CodingQuestion, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('coding_questions')
        .insert([question])
        .select()
        .single()

      if (err) throw err
      setQuestions(prev => [data, ...prev])
      setError(null)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create question'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateQuestion = useCallback(async (id: string, updates: Partial<CodingQuestion>) => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('coding_questions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setQuestions(prev => prev.map(q => q.id === id ? data : q))
      setError(null)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update question'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteQuestion = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const { error: err } = await supabase
        .from('coding_questions')
        .delete()
        .eq('id', id)

      if (err) throw err
      setQuestions(prev => prev.filter(q => q.id !== id))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete question'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ========== SUBMISSION OPERATIONS ==========

  const fetchSubmissions = useCallback(async (filters?: {
    question_id?: string
    student_id?: string
    status?: string
  }) => {
    setLoading(true)
    try {
      let query = supabase.from('coding_submissions').select('*')

      if (filters?.question_id) {
        query = query.eq('question_id', filters.question_id)
      }
      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error: err } = await query.order('submitted_at', { ascending: false })

      if (err) throw err
      setSubmissions(data || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch submissions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitCode = useCallback(async (
    questionId: string,
    studentId: string,
    code: string,
    language: string
  ) => {
    setLoading(true)
    try {
      // Step 1: Insert submission with pending status
      const { data: submission, error: insertErr } = await supabase
        .from('coding_submissions')
        .insert([{
          question_id: questionId,
          student_id: studentId,
          code_content: code,
          programming_language: language,
          status: 'running',
          is_latest: true
        }])
        .select()
        .single()

      if (insertErr) throw insertErr

      // Step 2: Send to code execution service (Judge0 API or custom backend)
      try {
        const executionResult = await executeCode(code, language, questionId)

        // Step 3: Update submission with results
        const { data: updated, error: updateErr } = await supabase
          .from('coding_submissions')
          .update({
            status: executionResult.status,
            passed_test_cases: executionResult.passed_test_cases,
            total_test_cases: executionResult.total_test_cases,
            execution_time_ms: executionResult.execution_time_ms,
            memory_used_mb: executionResult.memory_used_mb,
            error_message: executionResult.error_message,
            execution_output: executionResult.execution_output,
            graded_at: new Date().toISOString()
          })
          .eq('id', submission.id)
          .select()
          .single()

        if (updateErr) throw updateErr

        setSubmissions(prev => [updated, ...prev])
        setError(null)
        return updated
      } catch (execErr) {
        // If execution fails, mark as error
        await supabase
          .from('coding_submissions')
          .update({
            status: 'compilation_error',
            error_message: execErr instanceof Error ? execErr.message : 'Execution failed'
          })
          .eq('id', submission.id)
          .select()
          .single()

        throw execErr
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit code'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ========== ATTEMPT TRACKING ==========

  const fetchAttempts = useCallback(async (filters?: {
    student_id?: string
    question_id?: string
  }) => {
    setLoading(true)
    try {
      let query = supabase.from('coding_question_attempts').select('*')

      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id)
      }
      if (filters?.question_id) {
        query = query.eq('question_id', filters.question_id)
      }

      const { data, error: err } = await query

      if (err) throw err
      setAttempts(data || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attempts'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    questions,
    submissions,
    attempts,
    loading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchSubmissions,
    submitCode,
    fetchAttempts,
  }
}

// ========== CODE EXECUTION SERVICE ==========

async function executeCode(
  code: string,
  language: string,
  questionId: string
): Promise<{
  status: string
  passed_test_cases: number
  total_test_cases: number
  execution_time_ms: number
  memory_used_mb: number
  error_message?: string
  execution_output?: string
}> {
  try {
    // Call backend API to execute code
    const response = await axios.post('/api/coding/execute', {
      code,
      language,
      questionId,
    }, {
      timeout: 30000 // 30 second timeout
    })

    return response.data
  } catch (error) {
    throw new Error(`Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}