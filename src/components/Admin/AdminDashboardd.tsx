import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import type { User } from '../../utils/supabaseClient';
import NavigationSidebar from '../NavigationSidebar';
import {
  Users,
  BookOpen,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  AlertCircle,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  user: User;
}

interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalAssessments: number;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  blockedUsers: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalAssessments: 0,
    totalSubmissions: 0,
    averageScore: 0,
    completionRate: 0,
    blockedUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('📊 Fetching admin dashboard stats...');

      // Total Students
      const { data: studentsData } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'student');

      // Total Faculty
      const { data: facultyData } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'faculty');

      // Total Assessments
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('id', { count: 'exact' });

      // Total Submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('total_score', { count: 'exact' });

      // Average Score
      const { data: scoreData } = await supabase
        .from('submissions')
        .select('total_score');

      // Blocked Users
      const { data: blockedData } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact' })
        .eq('is_blocked', true);

      // Calculate metrics
      const totalStudents = studentsData?.length || 0;
      const totalFaculty = facultyData?.length || 0;
      const totalAssessments = assessmentsData?.length || 0;
      const totalSubmissions = submissionsData?.length || 0;
      const blockedUsers = blockedData?.length || 0;

      const averageScore = scoreData && scoreData.length > 0
        ? Math.round(scoreData.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0) / scoreData.length * 10) / 10
        : 0;

      const completionRate = totalStudents > 0
        ? Math.round((totalSubmissions / (totalStudents * totalAssessments || 1)) * 100)
        : 0;

      setStats({
        totalStudents,
        totalFaculty,
        totalAssessments,
        totalSubmissions,
        averageScore,
        completionRate,
        blockedUsers
      });

      console.log('✓ Dashboard stats loaded');
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Faculty */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Faculty</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalFaculty}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Assessments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalAssessments}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Card - Blocked Users */}
        {stats.blockedUsers > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">{stats.blockedUsers} Blocked Users</p>
              <p className="text-sm text-red-700">Review user management to unblock if needed</p>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Review Users
            </button>
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Manage Users */}
          <div
            onClick={() => navigate('/admin/users')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Manage Users</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              View, block, delete, and manage user roles
            </p>
            <button className="text-blue-600 font-medium text-sm hover:text-blue-700">
              Open →
            </button>
          </div>

          {/* View Analytics */}
          <div
            onClick={() => navigate('/admin/analytics')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-300 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Analytics</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Performance metrics and completion statistics
            </p>
            <button className="text-green-600 font-medium text-sm hover:text-green-700">
              Open →
            </button>
          </div>

          {/* View Submissions */}
          <div
            onClick={() => navigate('/admin/submissions')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-300 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Submissions</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              View all student submissions and detailed data
            </p>
            <button className="text-purple-600 font-medium text-sm hover:text-purple-700">
              Open →
            </button>
          </div>

          {/* Export Reports */}
          <div
            onClick={() => navigate('/admin/reports')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-300 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Export Reports</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Generate and download CSV/PDF reports
            </p>
            <button className="text-orange-600 font-medium text-sm hover:text-orange-700">
              Open →
            </button>
          </div>

          {/* System Settings */}
          <div
            onClick={() => navigate('/admin/settings')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-400 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure system parameters and policies
            </p>
            <button className="text-gray-600 font-medium text-sm hover:text-gray-700">
              Open →
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="pb-6 border-b md:border-b-0 md:border-r border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalSubmissions}</p>
              <p className="text-xs text-gray-500 mt-2">Completed assessments</p>
            </div>

            <div className="pb-6 border-b md:border-b-0 md:border-r border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-800">{stats.completionRate}%</p>
              <p className="text-xs text-gray-500 mt-2">Student participation</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Blocked Users</p>
              <p className="text-3xl font-bold text-gray-800">{stats.blockedUsers}</p>
              <p className="text-xs text-gray-500 mt-2">Restricted accounts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
