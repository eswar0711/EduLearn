import axiosClient from './axiosClient'
import { supabase } from './supabaseClient'



// ============================================================================
// TYPES
// ============================================================================



export interface CodingQuestion {
  id: string
  faculty_id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  programming_language: string
  sample_input: string
  sample_output: string
  sample_input2: string
  sample_output2: string
  time_limit: number
  memory_limit: number
  is_published: boolean
  created_at: string
}



export interface TestCase {
  input: string
  expectedOutput: string
}



export interface HiddenTestCase {
  id: string
  question_id: string
  input: string
  expected_output: string
  test_number: number
  is_active: boolean
  created_at: string
}



export interface ExecutionResult {
  status: 'success' | 'error' | 'runtime_error' | 'timeout' | 'test_failed'
  output: string
  error: string | null
  executionTime: number
  memoryUsed: number
  testsPassed: number
  totalTests: number
  expectedOutput?: string
  actualOutput?: string
  
  // 👇 NEW FIELD FOR MULTIPLE SAMPLE TESTS
  sampleTestResults?: {
    index: number
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
    error?: string | null  // 👈 NEW: per-test error storage
  }[]
  
  hiddenTestsResult?: {
    testsPassed: number
    totalTests: number
    results: Array<{
      testNumber: number
      passed: boolean
      input: string
      expectedOutput: string
      actualOutput: string
    }>
  }
}




export interface CodingSubmission {
  id: string
  question_id: string
  student_id: string
  code: string
  language: string
  status: 'accepted' | 'error' | 'pending'
  output: string
  error_message: string | null
  execution_time: number
  memory_used: number
  tests_passed: number
  total_tests: number
  submitted_at: string
}




// ============================================================================
// DATABASE SERVICE
// ============================================================================




class CodingLabDatabaseService {
  static async getQuestion(questionId: string): Promise<CodingQuestion | null> {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('id', questionId)
        .single()



      if (error) throw error
      return data as CodingQuestion
    } catch (error) {
      console.error('❌ Error fetching question:', error)
      throw error
    }
  }



  static async getPublishedQuestions(): Promise<CodingQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })



      if (error) throw error
      return data as CodingQuestion[]
    } catch (error) {
      console.error('❌ Error fetching questions:', error)
      return []
    }
  }



  static async getHiddenTests(questionId: string): Promise<HiddenTestCase[]> {
    try {
      const { data, error } = await supabase
        .from('hidden_test_cases')
        .select('*')
        .eq('question_id', questionId)
        .eq('is_active', true)
        .order('test_number', { ascending: true })



      if (error) throw error
      return data as HiddenTestCase[]
    } catch (error) {
      console.error('❌ Error fetching hidden tests:', error)
      return []
    }
  }



  static async saveSubmission(submission: Partial<CodingSubmission>): Promise<CodingSubmission> {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .insert([submission])
        .select()
        .single()



      if (error) throw error
      return data as CodingSubmission
    } catch (error) {
      console.error('❌ Error saving submission:', error)
      throw error
    }
  }



  static async getSubmission(submissionId: string): Promise<CodingSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('id', submissionId)
        .single()



      if (error) throw error
      return data as CodingSubmission
    } catch (error) {
      console.error('❌ Error fetching submission:', error)
      return null
    }
  }
}




// ============================================================================
// PISTON SERVICE (FREE & NO API KEY NEEDED)
// ============================================================================




interface PistonResponse {
  language: string
  version: string
  run: {
    stdout: string
    stderr: string
    code: number
    signal: string | null
    output: string
  }
}




class PistonService {
  private baseUrl = 'https://emkc.org/api/v2/piston'



  private languageMap: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'c++',
    c: 'c',
  }



  private versionMap: Record<string, string> = {
    python: '3.10.0',
    javascript: '18.15.0',
    java: '15.0.2',
    cpp: '10.2.0',
    c: '10.2.0',
  }



  private getLanguageInfo(lang: string): { language: string; version: string } {
    const normalizedLang = lang.toLowerCase()
    return {
      language: this.languageMap[normalizedLang] || 'python',
      version: this.versionMap[normalizedLang] || '3.10.0',
    }
  }



  private normalizeOutput(output: string): string {
    return output
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
  }



  async execute(
    code: string,
    language: string,
    testCases: TestCase[] = [],
    expectedOutput?: string
  ): Promise<ExecutionResult> {
    try {
      console.log('🚀 Executing code with Piston...')
      const startTime = Date.now()
      const { language: pistonLang, version } = this.getLanguageInfo(language)



      // If we have test cases, execute with the first one's input
      const stdin = testCases.length > 0 ? testCases[0].input : ''



      const response = await axiosClient.post<PistonResponse>(
        `${this.baseUrl}/execute`,
        {
          language: pistonLang,
          version: version,
          files: [
            {
              name: `solution.${this.getExtension(language)}`,
              content: code,
            },
          ],
          stdin: stdin,
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: -1,
          run_memory_limit: -1,
        }
      )



      const endTime = Date.now()
      const executionTime = Math.round(endTime - startTime)



      const data = response.data
      const stdout = data.run?.stdout || ''
      const stderr = data.run?.stderr || ''
      const exitCode = data.run?.code || 0



      // Normalize outputs for comparison
      const normalizedActualOutput = this.normalizeOutput(stdout)
      const normalizedExpectedOutput = expectedOutput ? this.normalizeOutput(expectedOutput) : ''



      console.log('📊 Actual Output:', normalizedActualOutput)
      console.log('📊 Expected Output:', normalizedExpectedOutput)



      let status: 'success' | 'error' | 'runtime_error' | 'timeout' | 'test_failed' = 'success'
      let testsPassed = 0
      let output = stdout.trim()
      let error: string | null = null



      // 1. Check for compilation/runtime errors
      if (exitCode !== 0 || stderr) {
        status = 'error'
        error = stderr.trim() || 'Execution failed'
        testsPassed = 0
      }
      // 2. If no errors, check if output matches expected
      else if (expectedOutput && normalizedActualOutput !== normalizedExpectedOutput) {
        status = 'test_failed'
        error = `Output mismatch!\nExpected: ${normalizedExpectedOutput}\nGot: ${normalizedActualOutput}`
        testsPassed = 0
      }
      // 3. All tests passed
      else {
        status = 'success'
        testsPassed = 1
      }



      console.log(`✅ Execution completed with status: ${status} (${executionTime}ms)`)



      return {
        status,
        output,
        error,
        executionTime,
        memoryUsed: 0,
        testsPassed,
        totalTests: 1,
        expectedOutput: normalizedExpectedOutput,
        actualOutput: normalizedActualOutput,
      }
    } catch (error: any) {
      console.error('❌ Piston execution failed:', error)
      return {
        status: 'error',
        output: '',
        error: error?.response?.data?.message || 'Failed to execute code. Please try again.',
        executionTime: 0,
        memoryUsed: 0,
        testsPassed: 0,
        totalTests: 1,
      }
    }
  }



  private getExtension(lang: string): string {
    const ext: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    }
    return ext[lang.toLowerCase()] || 'py'
  }
}




// ============================================================================
// 🆕 UPDATED: Execute both sample tests with error propagation
// ============================================================================



async function runBothSampleTests(
  code: string,
  language: string,
  question: CodingQuestion
): Promise<{
  sampleTestResults: Array<{
    index: number
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
    error?: string | null
  }>
  allPassed: boolean
  executionTime: number
}> {
  const results: Array<{
    index: number
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
    error?: string | null
  }> = []
  let allPassed = true
  let totalExecutionTime = 0
  const service = new PistonService()



  // 🧪 Test 1: sample_input & sample_output
  if (question.sample_input && question.sample_output) {
    try {
      console.log('🧪 Running Sample Test 1...')
      const result = await service.execute(
        code,
        language,
        [{
          input: question.sample_input,
          expectedOutput: question.sample_output,
        }],
        question.sample_output
      )



      const passed = result.status === 'success' && result.testsPassed === 1
      if (!passed) allPassed = false
      
      totalExecutionTime += result.executionTime



      results.push({
        index: 1,
        input: question.sample_input,
        expectedOutput: result.expectedOutput || question.sample_output,
        actualOutput: result.actualOutput || result.output,
        passed,
        error: result.error ?? null,  // 👈 KEEP RAW ERROR HERE
      })



      console.log(`✅ Sample Test 1: ${passed ? 'PASSED' : 'FAILED'} (${result.executionTime}ms)`)
    } catch (error: any) {
      console.error('❌ Error in Sample Test 1:', error)
      allPassed = false
      results.push({
        index: 1,
        input: question.sample_input,
        expectedOutput: question.sample_output,
        actualOutput: '',
        passed: false,
        error: error?.message || 'Error executing test case 1',
      })
    }
  }



  // 🧪 Test 2: sample_input2 & sample_output2 (if exists)
  if (question.sample_input2 && question.sample_output2) {
    try {
      console.log('🧪 Running Sample Test 2...')
      const result = await service.execute(
        code,
        language,
        [{
          input: question.sample_input2,
          expectedOutput: question.sample_output2,
        }],
        question.sample_output2
      )



      const passed = result.status === 'success' && result.testsPassed === 1
      if (!passed) allPassed = false
      
      totalExecutionTime += result.executionTime



      results.push({
        index: 2,
        input: question.sample_input2,
        expectedOutput: result.expectedOutput || question.sample_output2,
        actualOutput: result.actualOutput || result.output,
        passed,
        error: result.error ?? null,  // 👈 KEEP RAW ERROR HERE
      })



      console.log(`✅ Sample Test 2: ${passed ? 'PASSED' : 'FAILED'} (${result.executionTime}ms)`)
    } catch (error: any) {
      console.error('❌ Error in Sample Test 2:', error)
      allPassed = false
      results.push({
        index: 2,
        input: question.sample_input2,
        expectedOutput: question.sample_output2,
        actualOutput: '',
        passed: false,
        error: error?.message || 'Error executing test case 2',
      })
    }
  }



  return {
    sampleTestResults: results,
    allPassed,
    executionTime: totalExecutionTime,
  }
}




// ============================================================================
// QUICK RUN FUNCTION (Execute code and validate against expected output)
// ============================================================================




export async function quickRunCode(
  code: string,
  language: string,
  expectedOutput: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  try {
    console.log('⚡ Quick running code with validation...')
    const service = new PistonService()



    // Create test cases array for compatibility
    const testCases: TestCase[] = [
      {
        input: stdin,
        expectedOutput: expectedOutput,
      },
    ]



    const result = await service.execute(code, language, testCases, expectedOutput)
    console.log('✅ Quick run completed')
    return result
  } catch (error) {
    console.error('❌ Quick run failed:', error)
    return {
      status: 'error',
      output: '',
      error: 'Error running code. Please try again.',
      executionTime: 0,
      memoryUsed: 0,
      testsPassed: 0,
      totalTests: 1,
    }
  }
}




// ============================================================================
// HIDDEN TESTS EXECUTION FUNCTION
// ============================================================================




async function runHiddenTests(
  code: string,
  language: string,
  hiddenTests: HiddenTestCase[]
): Promise<{
  testsPassed: number
  totalTests: number
  executionTime: number
  results: Array<{
    testNumber: number
    passed: boolean
    input: string
    expectedOutput: string
    actualOutput: string
  }>
}> {
  const results = []
  let testsPassed = 0
  let totalExecutionTime = 0
  const service = new PistonService()



  for (const test of hiddenTests) {
    try {
      console.log(`🧪 Running hidden test ${test.test_number}...`)



      // Create test case for this hidden test
      const testCases: TestCase[] = [
        {
          input: test.input,
          expectedOutput: test.expected_output,
        },
      ]



      // Execute code with this specific test
      const result = await service.execute(code, language, testCases, test.expected_output)



      // Check if test passed
      const passed = result.status === 'success' && result.testsPassed === 1
      
      totalExecutionTime += result.executionTime



      if (passed) testsPassed++



      results.push({
        testNumber: test.test_number,
        passed,
        input: test.input,
        expectedOutput: test.expected_output,
        actualOutput: result.output,
      })



      console.log(`✅ Test ${test.test_number}: ${passed ? 'PASSED' : 'FAILED'} (${result.executionTime}ms)`)
    } catch (error) {
      console.error(`❌ Error running hidden test ${test.test_number}:`, error)
      results.push({
        testNumber: test.test_number,
        passed: false,
        input: test.input,
        expectedOutput: test.expected_output,
        actualOutput: 'Error executing test',
      })
    }
  }



  return {
    testsPassed,
    totalTests: hiddenTests.length,
    executionTime: totalExecutionTime,
    results,
  }
}




// ============================================================================
// 🔄 UPDATED: executeAndSaveCode (Now runs BOTH sample tests)
// ============================================================================




export async function executeAndSaveCode(
  questionId: string,
  studentId: string,
  code: string,
  language: string
): Promise<CodingSubmission> {
  try {
    console.log('🚀 Executing code with sample + hidden tests...')



    // 1. Fetch question
    const question = await CodingLabDatabaseService.getQuestion(questionId)
    if (!question) throw new Error('Question not found')



    // 2. 👇 Run BOTH sample tests (UPDATED!)
    const sampleTestsResult = await runBothSampleTests(code, language, question)
    
    const allSamplesPassed = sampleTestsResult.allPassed



    console.log(`📊 Sample tests: ${sampleTestsResult.sampleTestResults.filter(t => t.passed).length}/${sampleTestsResult.sampleTestResults.length} (${sampleTestsResult.executionTime}ms)`)



    let finalStatus: CodingSubmission['status'] = allSamplesPassed ? 'accepted' : 'error'
    let totalTestsPassed = sampleTestsResult.sampleTestResults.filter(t => t.passed).length
    let totalTests = sampleTestsResult.sampleTestResults.length
    let output = sampleTestsResult.sampleTestResults[0]?.actualOutput || ''
    let errorMessage = allSamplesPassed ? null : 'Sample tests failed'
    let totalExecutionTime = sampleTestsResult.executionTime



    // 3. If sample tests passed, run hidden tests
    if (allSamplesPassed) {
      console.log('✅ All samples passed, checking hidden tests...')
      const hiddenTests = await CodingLabDatabaseService.getHiddenTests(questionId)



      if (hiddenTests.length > 0) {
        const hiddenTestsData = await runHiddenTests(code, language, hiddenTests)
        console.log(`🔒 Hidden tests: ${hiddenTestsData.testsPassed}/${hiddenTestsData.totalTests} (${hiddenTestsData.executionTime}ms)`)



        // Update final status based on hidden tests
        if (hiddenTestsData.testsPassed === hiddenTestsData.totalTests) {
          finalStatus = 'accepted'
        } else {
          finalStatus = 'error'
        }
        
        totalTestsPassed = totalTests + hiddenTestsData.testsPassed
        totalTests = totalTests + hiddenTestsData.totalTests
        totalExecutionTime += hiddenTestsData.executionTime
        errorMessage = hiddenTestsData.testsPassed === hiddenTestsData.totalTests ? null : 'Some hidden tests failed'
      }
    }



    // 4. Save submission
    const submission = await CodingLabDatabaseService.saveSubmission({
      question_id: questionId,
      student_id: studentId,
      code,
      language,
      status: finalStatus,
      output,
      error_message: errorMessage,
      execution_time: totalExecutionTime,
      memory_used: 0,
      tests_passed: totalTestsPassed,
      total_tests: totalTests,
      submitted_at: new Date().toISOString(),
    })



    console.log('✅ Submission saved:', submission.id)
    return submission
  } catch (error) {
    console.error('❌ Execution failed:', error)
    throw error
  }
}




// ============================================================================
// 🔄 UPDATED: executeCodeWithHiddenTests (Now gets error from first failing test)
// ============================================================================




export async function executeCodeWithHiddenTests(
  questionId: string,
  code: string,
  language: string
): Promise<ExecutionResult> {
  try {
    console.log('🚀 Executing code for preview with ALL sample tests...')



    // 1. Fetch question
    const question = await CodingLabDatabaseService.getQuestion(questionId)
    if (!question) throw new Error('Question not found')



    // 2. 👇 Run BOTH sample tests (UPDATED!)
    const sampleTestsResult = await runBothSampleTests(code, language, question)
    
    console.log(`📊 Sample tests: ${sampleTestsResult.sampleTestResults.length} tests (${sampleTestsResult.executionTime}ms)`)
    sampleTestsResult.sampleTestResults.forEach(test => {
      console.log(`   Test ${test.index}: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`)
    })



    // 3. Get first test and first failing test for error display
    const firstTest = sampleTestsResult.sampleTestResults[0]
    const failingTest = sampleTestsResult.sampleTestResults.find(t => !t.passed)  // 👈 KEY LINE



    // 4. Prepare initial result with error from failing test
    const result: ExecutionResult = {
      status: sampleTestsResult.allPassed ? 'success' : 'test_failed',
      output: firstTest?.actualOutput || '',
      error: failingTest?.error || null,  // 👈 KEY LINE - gets error from first failing test
      executionTime: sampleTestsResult.executionTime,
      memoryUsed: 0,
      testsPassed: sampleTestsResult.sampleTestResults.filter(t => t.passed).length,
      totalTests: sampleTestsResult.sampleTestResults.length,
      expectedOutput: firstTest?.expectedOutput,
      actualOutput: firstTest?.actualOutput,
      sampleTestResults: sampleTestsResult.sampleTestResults,
    }



    // 5. If all sample tests passed, run hidden tests
    if (sampleTestsResult.allPassed) {
      console.log('✅ All sample tests passed, checking hidden tests...')
      const hiddenTests = await CodingLabDatabaseService.getHiddenTests(questionId)



      if (hiddenTests.length > 0) {
        const hiddenTestsResult = await runHiddenTests(code, language, hiddenTests)
        console.log(`🔒 Hidden tests: ${hiddenTestsResult.testsPassed}/${hiddenTestsResult.totalTests} (${hiddenTestsResult.executionTime}ms)`)



        // Update result with hidden tests data
        result.hiddenTestsResult = hiddenTestsResult
        result.totalTests = sampleTestsResult.sampleTestResults.length + hiddenTestsResult.totalTests
        result.testsPassed = sampleTestsResult.sampleTestResults.filter(t => t.passed).length + hiddenTestsResult.testsPassed
        result.executionTime = sampleTestsResult.executionTime + hiddenTestsResult.executionTime



        // Update status based on ALL tests
        if (
          sampleTestsResult.allPassed &&
          hiddenTestsResult.testsPassed === hiddenTestsResult.totalTests
        ) {
          result.status = 'success'
        } else {
          result.status = 'test_failed'
        }
      }
    }



    return result
  } catch (error: any) {
    console.error('❌ Execution failed:', error)
    return {
      status: 'error',
      output: '',
      error: error?.message || 'Error running code. Please try again.',
      executionTime: 0,
      memoryUsed: 0,
      testsPassed: 0,
      totalTests: 1,
    }
  }
}




export { CodingLabDatabaseService }