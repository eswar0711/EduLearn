import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { BarChart3, Users, BookOpen, Download, TrendingUp, ArrowLeft, AlertCircle, PieChart, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import { PieChart as RechartsPie, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminCodingAnalyticsProps {}

interface CodingAnalytics {
  totalProblems: number
  totalSubmissions: number
  totalStudents: number
  averageAcceptanceRate: number
  problemPerformance: { title: string; submissions: number; acceptanceRate: number }[]
  difficultyDistribution: { difficulty: string; count: number }[]
  languagePopularity: { language: string; count: number }[]
}

const AdminCodingAnalytics: React.FC<AdminCodingAnalyticsProps> = () => {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<CodingAnalytics>({
    totalProblems: 0,
    totalSubmissions: 0,
    totalStudents: 0,
    averageAcceptanceRate: 0,
    problemPerformance: [],
    difficultyDistribution: [],
    languagePopularity: [],
  })
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChartModal, setShowChartModal] = useState(false)

  // Chart colors
  const COLORS_DIFFICULTY = ['#10b981', '#f59e0b', '#ef4444'] // Easy (Green), Medium (Amber), Hard (Red)
  const COLORS_LANGUAGE = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'] // Blue, Purple, Pink, Teal, Orange, Cyan

  useEffect(() => {
    fetchCodingAnalytics()
  }, [])

  const fetchCodingAnalytics = async () => {
    try {
      console.log('📊 Fetching coding analytics...')
      setError(null)

      // Total Problems
      const { data: problemsData, error: problemsError } = await supabase
        .from('coding_questions')
        .select('id, title, difficulty, programming_language', { count: 'exact' })

      if (problemsError) {
        console.error('❌ Error fetching problems:', problemsError)
        throw problemsError
      }

      const totalProblems = problemsData?.length || 0
      console.log('✓ Total problems:', totalProblems)

      // Total Submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('coding_submissions')
        .select('id, question_id, student_id, status, language', { count: 'exact' })

      if (submissionsError) {
        console.error('❌ Error fetching submissions:', submissionsError)
        throw submissionsError
      }

      const totalSubmissions = submissionsData?.length || 0
      console.log('✓ Total submissions:', totalSubmissions)

      // Total Unique Students
      const uniqueStudents = new Set(submissionsData?.map((s: any) => s.student_id) || [])
      const totalStudents = uniqueStudents.size
      console.log('✓ Total students:', totalStudents)

      // Calculate Acceptance Rate
      const acceptedCount = submissionsData?.filter((s: any) => s.status === 'accepted').length || 0
      const averageAcceptanceRate = totalSubmissions > 0
        ? Math.round((acceptedCount / totalSubmissions) * 100 * 10) / 10
        : 0
      console.log('✓ Acceptance rate:', averageAcceptanceRate)

      // Problem Performance
      const problemMap = new Map<string, { title: string; submissions: number; accepted: number }>()

      problemsData?.forEach((p: any) => {
        problemMap.set(p.id, { title: p.title, submissions: 0, accepted: 0 })
      })

      submissionsData?.forEach((s: any) => {
        const problem = problemMap.get(s.question_id)
        if (problem) {
          problem.submissions++
          if (s.status === 'accepted') {
            problem.accepted++
          }
        }
      })

      const problemPerformance = Array.from(problemMap.values())
        .map((p) => ({
          title: p.title,
          submissions: p.submissions,
          acceptanceRate:
            p.submissions > 0
              ? Math.round((p.accepted / p.submissions) * 100 * 10) / 10
              : 0,
        }))
        .filter((p) => p.submissions > 0)
        .sort((a, b) => b.submissions - a.submissions)
      console.log('✓ Problem performance calculated')

      // Difficulty Distribution
      const difficultyMap = new Map<string, number>()
      problemsData?.forEach((p: any) => {
        const diff = p.difficulty?.toLowerCase() || 'unknown'
        difficultyMap.set(diff, (difficultyMap.get(diff) || 0) + 1)
      })

      const difficultyDistribution = Array.from(difficultyMap.entries())
        .map(([difficulty, count]) => ({ difficulty, count }))
        .sort((a, b) => b.count - a.count)
      console.log('✓ Difficulty distribution calculated')

      // Language Popularity (from submissions, not questions)
      const languageMap = new Map<string, number>()
      submissionsData?.forEach((s: any) => {
        const lang = s.language || 'unknown'
        languageMap.set(lang, (languageMap.get(lang) || 0) + 1)
      })

      const languagePopularity = Array.from(languageMap.entries())
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
      console.log('✓ Language popularity calculated')

      setAnalytics({
        totalProblems,
        totalSubmissions,
        totalStudents,
        averageAcceptanceRate,
        problemPerformance,
        difficultyDistribution,
        languagePopularity,
      })

      console.log('✓ Analytics loaded successfully')
    } catch (error: any) {
      console.error('❌ Error fetching analytics:', error)
      const errorMessage = error?.message || 'Failed to fetch analytics'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)

    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // 1. Overview Sheet
      const overviewData = [
        ['Coding Lab - Analytics Report'],
        ['Generated:', new Date().toLocaleString('en-IN')],
        [],
        ['Metric', 'Value'],
        ['Total Problems', analytics.totalProblems],
        ['Total Submissions', analytics.totalSubmissions],
        ['Active Students', analytics.totalStudents],
        ['Average Acceptance Rate', `${analytics.averageAcceptanceRate}%`],
      ]

      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
      overviewSheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview')

      // 2. Problem Performance Sheet
      const problemPerfData = [
        ['Problem Performance Report'],
        [],
        ['Problem Title', 'Total Submissions', 'Acceptance Rate (%)'],
        ...analytics.problemPerformance.map((p) => [
          p.title,
          p.submissions,
          p.acceptanceRate,
        ]),
      ]

      const problemPerfSheet = XLSX.utils.aoa_to_sheet(problemPerfData)
      problemPerfSheet['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, problemPerfSheet, 'Problem Performance')

      // 3. Difficulty Distribution Sheet
      const difficultyData = [
        ['Difficulty Distribution'],
        [],
        ['Difficulty Level', 'Number of Problems'],
        ...analytics.difficultyDistribution.map((d) => [
          d.difficulty.toUpperCase(),
          d.count,
        ]),
      ]

      const difficultySheet = XLSX.utils.aoa_to_sheet(difficultyData)
      difficultySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, difficultySheet, 'Difficulty')

      // 4. Language Popularity Sheet
      const languageData = [
        ['Language Popularity (By Submissions)'],
        [],
        ['Programming Language', 'Number of Submissions'],
        ...analytics.languagePopularity.map((l) => [
          l.language.toUpperCase(),
          l.count,
        ]),
      ]

      const languageSheet = XLSX.utils.aoa_to_sheet(languageData)
      languageSheet['!cols'] = [{ wch: 25 }, { wch: 25 }]
      XLSX.utils.book_append_sheet(wb, languageSheet, 'Languages')

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `Coding-Lab-Analytics-${dateStr}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)

      toast.success(`✅ Excel report "${filename}" downloaded successfully!`, {
        position: 'top-right',
        autoClose: 4000,
      })
    } catch (error: any) {
      console.error('Error exporting Excel:', error)
      toast.error('Failed to export Excel report', {
        position: 'top-right',
        autoClose: 4000,
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Prepare chart data
  const difficultyChartData = analytics.difficultyDistribution.map((d) => ({
    name: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1),
    value: d.count,
  }))

  const languageChartData = analytics.languagePopularity.map((l) => ({
    name: l.language.toUpperCase(),
    value: l.count,
  }))

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header - Full Width, Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Coding Lab Analytics</h2>
              <p className="text-gray-600 text-sm mt-1">Track coding practice metrics and performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChartModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <PieChart className="w-4 h-4" />
              View Charts
            </button>
            {/* <button
              onClick={() => {
                setLoading(true)
                setError(null)
                fetchCodingAnalytics()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button> */}
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-8 mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Analytics</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  fetchCodingAnalytics()
                }}
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full Width */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Problems */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Problems</p>
                <p className="text-3xl font-bold text-gray-800">{analytics.totalProblems}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Submissions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-800">{analytics.totalSubmissions}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Students</p>
                <p className="text-3xl font-bold text-gray-800">{analytics.totalStudents}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Acceptance Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
                <p className="text-3xl font-bold text-gray-800">{analytics.averageAcceptanceRate}%</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Problem Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Problem Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Acceptance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.problemPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No submissions yet
                    </td>
                  </tr>
                ) : (
                  analytics.problemPerformance.map((problem, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{problem.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{problem.submissions}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {problem.acceptanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Difficulty & Language */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Difficulty Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Difficulty Distribution</h3>
            <div className="space-y-4">
              {analytics.difficultyDistribution.length === 0 ? (
                <p className="text-gray-500">No problems created yet</p>
              ) : (
                analytics.difficultyDistribution.map((diff, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium capitalize">{diff.difficulty}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            diff.difficulty === 'easy'
                              ? 'bg-green-500'
                              : diff.difficulty === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${
                              analytics.difficultyDistribution.length > 0
                                ? (diff.count /
                                    Math.max(
                                      ...analytics.difficultyDistribution.map((d) => d.count),
                                      1
                                    )) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-600 w-8 text-right font-semibold">{diff.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Language Popularity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Language Popularity</h3>
            <div className="space-y-4">
              {analytics.languagePopularity.length === 0 ? (
                <p className="text-gray-500">No submissions yet</p>
              ) : (
                analytics.languagePopularity.map((lang, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium capitalize">{lang.language}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{
                            width: `${
                              analytics.languagePopularity.length > 0
                                ? (lang.count /
                                    Math.max(
                                      ...analytics.languagePopularity.map((l) => l.count),
                                      1
                                    )) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-600 w-8 text-right font-semibold">{lang.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Report Modal */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Visual Analytics Report</h2>
              <button
                onClick={() => setShowChartModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Difficulty Distribution Pie Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Problems by Difficulty</h3>
                  {difficultyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie data={difficultyChartData}>
                        <Pie
                          data={difficultyChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(_entry) => `${_entry.name}: ${_entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {difficultyChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_DIFFICULTY[index % COLORS_DIFFICULTY.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} problems`} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>

                {/* Language Popularity Pie Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Submissions by Language</h3>
                  {languageChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie data={languageChartData}>
                        <Pie
                          data={languageChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(_entry) => `${_entry.name}: ${_entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {languageChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_LANGUAGE[index % COLORS_LANGUAGE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} submissions`} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>

                {/* Problem Submission Distribution */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Top Problems by Submissions</h3>
                  {analytics.problemPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie
                        data={analytics.problemPerformance.slice(0, 5).map((p) => ({
                          name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
                          value: p.submissions,
                        }))}
                      >
                        <Pie
                          data={analytics.problemPerformance.slice(0, 5).map((p) => ({
                            name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
                            value: p.submissions,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(_entry) => `${_entry.name}: ${_entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.problemPerformance.slice(0, 5).map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_LANGUAGE[index % COLORS_LANGUAGE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} submissions`} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>

                {/* Summary Statistics */}
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Summary Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Total Problems:</span>
                      <span className="font-bold text-gray-800">{analytics.totalProblems}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Total Submissions:</span>
                      <span className="font-bold text-gray-800">{analytics.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Active Students:</span>
                      <span className="font-bold text-gray-800">{analytics.totalStudents}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Avg. Acceptance Rate:</span>
                      <span className="font-bold text-green-600">{analytics.averageAcceptanceRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-bold text-gray-800">{new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-3 border-t pt-6">
                <button
                  onClick={() => setShowChartModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCodingAnalytics