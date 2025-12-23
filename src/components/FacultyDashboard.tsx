import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Submission } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import { FileText, Users, TrendingUp, Code2, Trash2, AlertCircle } from 'lucide-react';
import AssessmentSubmissions from './AssessmentSubmissions';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FacultyDashboardProps {
  user: User;
}

interface DeleteModalState {
  isOpen: boolean;
  assessmentId: string | null;
  assessmentTitle: string | null;
  isDeleting: boolean;
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
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    assessmentId: null,
    assessmentTitle: null,
    isDeleting: false,
  });

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
            ? submissionData!.reduce((sum, s) => sum + (s.total_score || 0), 0) / totalSubmissions
            : 0;

        setStats({
          totalAssessments: assessmentData.length,
          totalSubmissions,
          averageScore: Math.round(avgScore * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionCount = (assessmentId: string) => {
    return submissions.filter((s) => s.assessment_id === assessmentId).length;
  };

  const openDeleteModal = (assessmentId: string, assessmentTitle: string) => {
    setDeleteModal({
      isOpen: true,
      assessmentId,
      assessmentTitle,
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      assessmentId: null,
      assessmentTitle: null,
      isDeleting: false,
    });
  };

  const handleDeleteAssessment = async () => {
    if (!deleteModal.assessmentId) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', deleteModal.assessmentId);

      if (error) throw error;

      // Update local state
      setAssessments((prev) =>
        prev.filter((a) => a.id !== deleteModal.assessmentId)
      );

      // Update submissions state
      setSubmissions((prev) =>
        prev.filter((s) => s.assessment_id !== deleteModal.assessmentId)
      );

      // Recalculate stats
      setStats((prev) => ({
        ...prev,
        totalAssessments: Math.max(0, prev.totalAssessments - 1),
      }));

      toast.success(
        `"${deleteModal.assessmentTitle}" has been deleted successfully`,
        {
          position: 'top-right',
          autoClose: 4000,
        }
      );

      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error(
        'Failed to delete assessment. Please try again.',
        {
          position: 'top-right',
          autoClose: 4000,
        }
      );
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
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
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
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
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => {
                            setSelectedAssessmentId(assessment.id);
                            setShowSubmissions(true);
                          }}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors"
                        >
                          View Submissions
                        </button>
                        <button
                          onClick={() => openDeleteModal(assessment.id, assessment.title)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                          title="Delete this assessment"
                        >
                          <Trash2 className="w-4 h-4" />
                          
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in">
              {/* Warning Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                Delete Assessment?
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to delete <strong>"{deleteModal.assessmentTitle}"</strong>?
              </p>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    This action will permanently delete the assessment and all related questions and submissions. This cannot be undone.
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteModal.isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAssessment}
                  disabled={deleteModal.isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteModal.isDeleting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Modal */}
        {showSubmissions && selectedAssessmentId && (
          <AssessmentSubmissions
            assessmentId={selectedAssessmentId}
            onClose={() => setShowSubmissions(false)}
          />
        )}

        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default FacultyDashboard;