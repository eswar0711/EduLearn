
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Submission } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import { FileText, Users, TrendingUp, Code2 } from 'lucide-react';
import AssessmentSubmissions from './AssessmentSubmissions';
import { useNavigate } from 'react-router-dom';


interface FacultyDashboardProps {
  user: User;
}


const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalSubmissions: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);


  useEffect(() => {
    fetchData();
  }, [user.id]);


  const fetchData = async () => {
    try {
      // Fetch assessments created by faculty
      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('*')
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });


      setAssessments(assessmentData || []);


      // Fetch submissions for faculty's assessments
      if (assessmentData && assessmentData.length > 0) {
        const assessmentIds = assessmentData.map((a) => a.id);
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .in('assessment_id', assessmentIds);


        setSubmissions(submissionData || []);


        // Calculate stats
        const totalSubmissions = submissionData?.length || 0;
        const avgScore =
          totalSubmissions > 0
            ? submissionData!.reduce((sum, s) => sum + s.total_score, 0) / totalSubmissions
            : 0;


        setStats({
          totalAssessments: assessmentData.length,
          totalSubmissions,
          averageScore: Math.round(avgScore * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getSubmissionCount = (assessmentId: string) => {
    return submissions.filter((s) => s.assessment_id === assessmentId).length;
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Faculty Dashboard</h2>
          <p className="text-gray-600">Manage your assessments and view student performance</p>
        </div>


        {/* ===== NEW: Coding Management Quick Access Card ===== */}
        <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-6 h-6" />
                <h3 className="text-xl font-bold">Coding Problem Management</h3>
              </div>
              <p className="text-emerald-100 mb-4">
                Create, manage, and track coding problems for your students. Set difficulty levels, add test cases, and monitor submissions
              </p>
              <button
                onClick={() => navigate('/coding-management')}
                className="bg-white text-emerald-600 px-6 py-2 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
              >
                Manage Problems
              </button>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Code2 className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalAssessments}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>


          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalSubmissions}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>


          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>


        {/* Assessments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Your Assessments</h3>
          </div>


          {assessments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No assessments created yet</p>
              <button
                onClick={() => navigate('/create-assessment')}
                className="bg-primary-600 hover:bg-primary-700 text-primary-500 px-6 py-2 rounded-lg transition-colors"
              >
                Create Your First Assessment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{assessment.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assessment.subject}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assessment.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assessment.duration_minutes} mins</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getSubmissionCount(assessment.id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setSelectedAssessmentId(assessment.id);
                            setShowSubmissions(true);
                          }}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-400 text-gray-600 font-medium rounded-lg transition-colors"
                        >
                          View Submissions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Submissions Modal */}
        {showSubmissions && selectedAssessmentId && (
          <AssessmentSubmissions
            assessmentId={selectedAssessmentId}
            onClose={() => setShowSubmissions(false)}
          />
        )}
      </div>
    </div>
  );
};


export default FacultyDashboard;