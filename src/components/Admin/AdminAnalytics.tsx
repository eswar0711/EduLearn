import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import type { User } from '../../utils/supabaseClient';
//import NavigationSidebar from '../NavigationSidebar';
import { BarChart3, Users, BookOpen, Download, AlertCircle, TrendingUp, TrendingDown, RefreshCw, PieChart, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { PieChart as RechartsPI, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  calculateAverage,
  formatDateIST,
  capitalize
} from './adminUtils';

interface AdminAnalyticsProps {
  user: User;
}

interface SubjectPerformance {
  subject: string;
  avgScore: number;
  submissionCount: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
}

interface RoleDistribution {
  role: string;
  count: number;
  percentage?: number;
}

interface AssessmentDifficulty {
  title: string;
  avgScore: number;
  submissionCount: number;
  passRate?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface OverallStats {
  totalUsers: number;
  totalAssessments: number;
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  activeUsers: number;
}

interface AnalyticsData {
  subjectPerformance: SubjectPerformance[];
  roleDistribution: RoleDistribution[];
  monthlySubmissions: { month: string; count: number; passed: number; failed: number }[];
  assessmentDifficulty: AssessmentDifficulty[];
  overallStats?: OverallStats;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    subjectPerformance: [],
    roleDistribution: [],
    monthlySubmissions: [],
    assessmentDifficulty: [],
    overallStats: undefined
  });
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);

  // Chart colors - Color palettes for visualizations
  const COLORS_ROLE = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']; // Blue, Purple, Pink, Teal, Orange
  const COLORS_DIFFICULTY = ['#10b981', '#f59e0b', '#ef4444']; // Easy (Green), Medium (Amber), Hard (Red)

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      console.log('📊 Fetching analytics...');
      setError(null);
      setLoading(true);

      // ✅ 1. FETCH SUBMISSIONS WITH ASSESSMENTS
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          total_score,
          assessment_id,
          submitted_at,
          assessments(id, title, subject)
        `);

      if (submissionsError) {
        throw new Error(`Submissions fetch error: ${submissionsError.message}`);
      }

      if (!submissionsData || submissionsData.length === 0) {
        console.warn('⚠️ No submissions found');
      }

      // ✅ 2. PROCESS SUBJECT PERFORMANCE
      const subjectMap = new Map<string, { scores: number[]; count: number }>();
      
      submissionsData?.forEach((s: any) => {
        const subject = s.assessments?.subject || 'Unknown';
        const score = typeof s.total_score === 'number' ? s.total_score : 0;

        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { scores: [], count: 0 });
        }
        const data = subjectMap.get(subject)!;
        data.scores.push(score);
        data.count++;
      });

      const subjectPerformance: SubjectPerformance[] = Array.from(subjectMap.entries())
        .map(([subject, data]) => {
          const avgScore = data.scores.length > 0 ? calculateAverage(data.scores) : 0;
          return {
            subject,
            avgScore: Math.min(avgScore, 100),
            submissionCount: data.count,
            highestScore: Math.max(...data.scores),
            lowestScore: Math.min(...data.scores),
            passRate: Math.round((data.scores.filter(s => s >= 40).length / data.count) * 100)
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore);

      // ✅ 3. FETCH USER DISTRIBUTION
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, role');

      if (usersError) {
        throw new Error(`Users fetch error: ${usersError.message}`);
      }

      if (!usersData || usersData.length === 0) {
        console.warn('⚠️ No users found');
      }

      const roleMap = new Map<string, number>();
      usersData?.forEach((u: any) => {
        const role = u.role || 'unknown';
        roleMap.set(role, (roleMap.get(role) || 0) + 1);
      });

      const totalUsers = usersData?.length || 0;
      const roleDistribution: RoleDistribution[] = Array.from(roleMap.entries())
        .map(([role, count]) => ({
          role: role.toLowerCase(),
          count,
          percentage: Math.round((count / totalUsers) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // ✅ 4. PROCESS ASSESSMENT DIFFICULTY
      const assessmentMapData = new Map<string, { title: string; scores: number[]; count: number }>();
      
      submissionsData?.forEach((s: any) => {
        const assessmentId = s.assessments?.id || 'Unknown';
        const title = s.assessments?.title || 'Untitled Assessment';
        const score = typeof s.total_score === 'number' ? s.total_score : 0;

        if (!assessmentMapData.has(assessmentId)) {
          assessmentMapData.set(assessmentId, { title, scores: [], count: 0 });
        }
        const data = assessmentMapData.get(assessmentId)!;
        data.scores.push(score);
        data.count++;
      });

      const assessmentDifficulty: AssessmentDifficulty[] = Array.from(assessmentMapData.values())
        .map(data => {
          const avgScore = data.scores.length > 0 ? calculateAverage(data.scores) : 0;
          const passCount = data.scores.filter(s => s >= 40).length;
          
          let difficulty: 'Easy' | 'Medium' | 'Hard';
          if (avgScore >= 70) {
            difficulty = 'Easy';
          } else if (avgScore >= 50) {
            difficulty = 'Medium';
          } else {
            difficulty = 'Hard';
          }
          
          return {
            title: data.title,
            avgScore: Math.min(avgScore, 100),
            submissionCount: data.count,
            passRate: Math.round((passCount / data.count) * 100),
            difficulty
          };
        })
        .sort((a, b) => a.avgScore - b.avgScore);

      // ✅ 5. CALCULATE MONTHLY SUBMISSIONS
      const monthlyMap = new Map<string, { count: number; passed: number }>();
      submissionsData?.forEach((s: any) => {
        if (!s.submitted_at) return;
        
        const date = new Date(s.submitted_at);
        const month = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { count: 0, passed: 0 });
        }
        const data = monthlyMap.get(month)!;
        data.count++;
        if ((s.total_score || 0) >= 40) {
          data.passed++;
        }
      });

      const monthlySubmissions = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          count: data.count,
          passed: data.passed,
          failed: data.count - data.passed
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // ✅ 6. CALCULATE OVERALL STATS
      const totalSubmissions = submissionsData?.length || 0;
      const totalAssessments = assessmentDifficulty.length;
      const totalScore = submissionsData?.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0) || 0;
      const averageScore = totalSubmissions > 0 ? Math.round((totalScore / totalSubmissions) * 10) / 10 : 0;
      const passedSubmissions = submissionsData?.filter((s: any) => (s.total_score || 0) >= 40).length || 0;
      const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;

      const overallStats: OverallStats = {
        totalUsers,
        totalAssessments,
        totalSubmissions,
        averageScore,
        passRate,
        activeUsers: usersData?.length || 0
      };

      setAnalytics({
        subjectPerformance,
        roleDistribution,
        monthlySubmissions,
        assessmentDifficulty,
        overallStats
      });

      console.log('✓ Analytics loaded successfully', {
        subjects: subjectPerformance.length,
        roles: roleDistribution.length,
        assessments: assessmentDifficulty.length,
        totalSubmissions,
        averageScore,
        passRate
      });
    } catch (error: any) {
      console.error('❌ Error fetching analytics:', error);
      const errorMessage = error?.message || 'Failed to fetch analytics';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      const overviewData = [
        ['EduVerge - Analytics Report'],
        ['Generated:', formatDateIST(new Date())],
        [],
        ['Metric', 'Value'],
        ['Total Subjects', analytics.subjectPerformance.length],
        ['Total Users', analytics.overallStats?.totalUsers || 0],
        ['Total Assessments', analytics.assessmentDifficulty.length],
        ['Total Submissions', analytics.overallStats?.totalSubmissions || 0],
        ['Average Performance', `${analytics.overallStats?.averageScore || 0}%`],
        ['Pass Rate', `${analytics.overallStats?.passRate || 0}%`],
        ['Active Users', analytics.overallStats?.activeUsers || 0],
      ];

      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      overviewSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

      const subjectData = [
        ['Subject Performance Report'],
        ['Generated:', formatDateIST(new Date())],
        [],
        ['Subject', 'Average Score (%)', 'Highest Score', 'Lowest Score', 'Pass Rate (%)', 'Total Submissions'],
        ...analytics.subjectPerformance.map(s => [
          s.subject,
          s.avgScore,
          s.highestScore,
          s.lowestScore,
          s.passRate,
          s.submissionCount,
        ]),
      ];

      const subjectSheet = XLSX.utils.aoa_to_sheet(subjectData);
      subjectSheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, subjectSheet, 'Subject Performance');

      const assessmentData = [
        ['Assessment Performance Report (Ranked by Difficulty)'],
        ['Lowest average score = Most Difficult | Highest average score = Easiest'],
        [],
        ['Rank', 'Assessment Title', 'Average Score (%)', 'Difficulty', 'Pass Rate (%)', 'Number of Students'],
        ...analytics.assessmentDifficulty.map((a, idx) => [
          idx + 1,
          a.title,
          a.avgScore,
          a.difficulty || 'N/A',
          a.passRate || 0,
          a.submissionCount,
        ]),
      ];

      const assessmentSheet = XLSX.utils.aoa_to_sheet(assessmentData);
      assessmentSheet['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, assessmentSheet, 'Assessment Performance');

      const roleData = [
        ['User Distribution Report'],
        ['Generated:', formatDateIST(new Date())],
        [],
        ['Role', 'Number of Users', 'Percentage (%)'],
        ...analytics.roleDistribution.map(r => [
          capitalize(r.role),
          r.count,
          r.percentage || 0,
        ]),
      ];

      const roleSheet = XLSX.utils.aoa_to_sheet(roleData);
      roleSheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, roleSheet, 'User Distribution');

      if (analytics.monthlySubmissions.length > 0) {
        const monthlyData = [
          ['Monthly Submissions Report'],
          ['Generated:', formatDateIST(new Date())],
          [],
          ['Month', 'Total Submissions', 'Passed', 'Failed'],
          ...analytics.monthlySubmissions.map(m => [
            m.month,
            m.count,
            m.passed,
            m.failed,
          ]),
        ];

        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
        monthlySheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Submissions');
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `EduVerge-Analytics-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      toast.success(`✅ Excel report "${filename}" downloaded successfully!`, {
        position: 'top-right',
        autoClose: 4000,
      });
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report', {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare data for charts
  const performanceChartData = analytics.subjectPerformance.map(s => ({
    name: s.subject,
    value: s.submissionCount,
    score: s.avgScore
  }));

  const difficultyChartData = analytics.assessmentDifficulty.reduce((acc, a) => {
    const existing = acc.find(item => item.name === a.difficulty);
    if (existing) {
      existing.value += a.submissionCount;
    } else {
      acc.push({ name: a.difficulty || 'Unknown', value: a.submissionCount });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const roleChartData = analytics.roleDistribution.map(r => ({
    name: capitalize(r.role),
    value: r.count
  }));

  if (loading) {
    return (
      <div className="flex">
        {/* <NavigationSidebar user={user} /> */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <div className="text-lg text-gray-600">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* <NavigationSidebar user={user} /> */}

      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
  {/* Title */}
  <div>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
      Analytics & Reports
    </h2>
    <p className="text-sm md:text-base text-gray-600">
      System-wide performance metrics
    </p>
  </div>

  {/* Actions */}
  <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
    <button
      onClick={() => setShowChartModal(true)}
      className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
    >
      <PieChart className="w-4 h-4" />
      View Chart
    </button>

    <button
      onClick={() => {
        setLoading(true);
        fetchAnalyticsData();
      }}
      className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
    >
      <RefreshCw className="w-4 h-4" />
      Refresh
    </button>

    <button
      onClick={exportToExcel}
      disabled={isExporting}
      className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export Excel
        </>
      )}
    </button>
  </div>
</div>


        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Analytics</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchAnalyticsData();
                }}
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overallStats?.totalSubmissions || 0}</p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overallStats?.totalUsers || 0}</p>
              </div>
              <Users className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overallStats?.averageScore || 0}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overallStats?.passRate || 0}%</p>
              </div>
              <TrendingDown className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Performance by Subject
            {analytics.subjectPerformance.length === 0 && (
              <span className="ml-auto text-sm font-normal text-gray-500">No data available</span>
            )}
          </h3>
          <div className="space-y-4">
            {analytics.subjectPerformance.length > 0 ? (
              analytics.subjectPerformance.map((subject) => (
                <div key={subject.subject} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{subject.subject}</p>
                    <p className="text-sm text-gray-600">{subject.submissionCount} submissions | Pass Rate: {subject.passRate}%</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          subject.avgScore >= 70
                            ? 'bg-green-500'
                            : subject.avgScore >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(subject.avgScore, 100)}%` }}
                      />
                    </div>
                    <p className="font-semibold text-gray-800 min-w-fit">{subject.avgScore}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No subject data available</p>
            )}
          </div>
        </div>

        {/* Assessment Difficulty */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Assessment Performance (Ranked by Difficulty)
            {analytics.assessmentDifficulty.length === 0 && (
              <span className="ml-auto text-sm font-normal text-gray-500">No data available</span>
            )}
          </h3>
          <div className="space-y-4">
            {analytics.assessmentDifficulty.length > 0 ? (
              analytics.assessmentDifficulty.map((assessment, index) => (
                <div key={`${assessment.title}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{index + 1}. {assessment.title}</p>
                    <p className="text-sm text-gray-600">{assessment.submissionCount} students | Pass Rate: {assessment.passRate}%</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className={`text-2xl font-bold ${
                      assessment.avgScore >= 70
                        ? 'text-green-600'
                        : assessment.avgScore >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {assessment.avgScore}%
                    </p>
                    <p className="text-xs text-gray-500">Average Score</p>
                  </div>
                  <div className="bg-white px-3 py-1 rounded border border-gray-300">
                    <p className="text-xs font-medium text-gray-700">{assessment.difficulty || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No assessment data available</p>
            )}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Distribution
            {analytics.roleDistribution.length === 0 && (
              <span className="ml-auto text-sm font-normal text-gray-500">No data available</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.roleDistribution.length > 0 ? (
              analytics.roleDistribution.map((role) => (
                <div key={role.role} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center border border-blue-200 hover:shadow-md transition-shadow">
                  <p className="text-3xl font-bold text-blue-600">{role.count}</p>
                  <p className="text-sm text-gray-600 capitalize mt-1">{capitalize(role.role)}s</p>
                  {/* <p className="text-xs text-gray-500 mt-2">{role.percentage}% of total</p> */}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 col-span-full">No user data available</p>
            )}
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
                {/* Performance by Subject Distribution */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Submissions by Subject</h3>
                  {performanceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPI data={performanceChartData}>
                        <Pie
                          data={performanceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(_entry) => `${_entry.name}: ${_entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {performanceChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_ROLE[index % COLORS_ROLE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} submissions`} />
                        <Legend />
                      </RechartsPI>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>

                {/* Assessment Difficulty Distribution */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Assessment Difficulty Distribution</h3>
                  {difficultyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPI data={difficultyChartData}>
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
                        <Tooltip formatter={(value) => `${value} assessments`} />
                        <Legend />
                      </RechartsPI>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>

                {/* User Role Distribution */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">User Distribution by Role</h3>
                  {roleChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPI data={roleChartData}>
                        <Pie
                          data={roleChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(_entry) => `${_entry.name}: ${_entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_ROLE[index % COLORS_ROLE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} users`} />
                        <Legend />
                      </RechartsPI>
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
                      <span className="text-gray-600">Total Submissions:</span>
                      <span className="font-bold text-gray-800">{analytics.overallStats?.totalSubmissions || 0}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Total Users:</span>
                      <span className="font-bold text-gray-800">{analytics.overallStats?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Total Assessments:</span>
                      <span className="font-bold text-gray-800">{analytics.overallStats?.totalAssessments || 0}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Average Score:</span>
                      <span className="font-bold text-gray-800">{analytics.overallStats?.averageScore || 0}%</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-gray-600">Pass Rate:</span>
                      <span className="font-bold text-green-600">{analytics.overallStats?.passRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-bold text-gray-800">{formatDateIST(new Date())}</span>
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
  );
};

export default AdminAnalytics;