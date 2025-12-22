import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import type { User } from '../../utils/supabaseClient';
import NavigationSidebar from '../NavigationSidebar';
import { BarChart3, Users, BookOpen, Download } from 'lucide-react';

interface AdminAnalyticsProps {
  user: User;
}

interface AnalyticsData {
  subjectPerformance: { subject: string; avgScore: number; submissionCount: number }[];
  roleDistribution: { role: string; count: number }[];
  monthlySubmissions: { month: string; count: number }[];
  assessmentDifficulty: { title: string; avgScore: number; submissionCount: number }[];
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ user }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    subjectPerformance: [],
    roleDistribution: [],
    monthlySubmissions: [],
    assessmentDifficulty: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      console.log('📊 Fetching analytics...');

      // Subject Performance
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select(`
          total_score,
          assessment:assessments(subject)
        `);

      const subjectMap = new Map<string, { scores: number[]; count: number }>();
      submissionsData?.forEach((s: any) => {
        const subject = s.assessment?.subject || 'Unknown';
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { scores: [], count: 0 });
        }
        const data = subjectMap.get(subject)!;
        data.scores.push(s.total_score || 0);
        data.count++;
      });

      const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10,
        submissionCount: data.count
      }));

      // Role Distribution
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('role', { count: 'exact' });

      const roleMap = new Map<string, number>();
      usersData?.forEach((u: any) => {
        roleMap.set(u.role, (roleMap.get(u.role) || 0) + 1);
      });

      const roleDistribution = Array.from(roleMap.entries()).map(([role, count]) => ({
        role,
        count
      }));

      // Assessment Difficulty (Top performers vs Bottom performers)
      const { data: assessmentData } = await supabase
        .from('submissions')
        .select(`
          total_score,
          assessment:assessments(id, title)
        `);

      const assessmentMap = new Map<string, { title: string; scores: number[]; count: number }>();
      assessmentData?.forEach((s: any) => {
        const assessmentId = s.assessment?.id || 'Unknown';
        const title = s.assessment?.title || 'Unknown';
        if (!assessmentMap.has(assessmentId)) {
          assessmentMap.set(assessmentId, { title, scores: [], count: 0 });
        }
        const data = assessmentMap.get(assessmentId)!;
        data.scores.push(s.total_score || 0);
        data.count++;
      });

      const assessmentDifficulty = Array.from(assessmentMap.values())
        .map(data => ({
          title: data.title,
          avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10,
          submissionCount: data.count
        }))
        .sort((a, b) => a.avgScore - b.avgScore);

      setAnalytics({
        subjectPerformance,
        roleDistribution,
        monthlySubmissions: [], // Could implement if tracking dates
        assessmentDifficulty
      });

      console.log('✓ Analytics loaded');
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportContent = `
EduVerge - Analytics Report
Generated: ${new Date().toLocaleString()}

=== SUBJECT PERFORMANCE ===
${analytics.subjectPerformance.map(s => 
  `${s.subject}: ${s.avgScore}% avg (${s.submissionCount} submissions)`
).join('\n')}

=== ROLE DISTRIBUTION ===
${analytics.roleDistribution.map(r => 
  `${r.role}: ${r.count} users`
).join('\n')}

=== ASSESSMENT DIFFICULTY ===
${analytics.assessmentDifficulty.map(a => 
  `${a.title}: ${a.avgScore}% avg (${a.submissionCount} submissions)`
).join('\n')}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `analytics-report-${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600">System-wide performance metrics</p>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Performance by Subject
          </h3>
          <div className="space-y-4">
            {analytics.subjectPerformance.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{subject.subject}</p>
                  <p className="text-sm text-gray-600">{subject.submissionCount} submissions</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${subject.avgScore}%` }}
                    />
                  </div>
                  <p className="font-semibold text-gray-800 min-w-fit">{subject.avgScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Difficulty */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Assessment Performance (Ranked)
          </h3>
          <div className="space-y-4">
            {analytics.assessmentDifficulty.map((assessment, index) => (
              <div key={assessment.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{index + 1}. {assessment.title}</p>
                  <p className="text-sm text-gray-600">{assessment.submissionCount} students</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{assessment.avgScore}%</p>
                  <p className="text-xs text-gray-500">Average Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.roleDistribution.map((role) => (
              <div key={role.role} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-800">{role.count}</p>
                <p className="text-sm text-gray-600 capitalize">{role.role}s</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
