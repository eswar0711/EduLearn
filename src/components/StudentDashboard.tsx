import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Submission } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import TestInstructions from './TestInstructions';
import { BookOpen, Clock, CheckCircle, PlayCircle, Sparkles, Code2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img from '../assets/codingPic.jpg';
import ailog from '../assets/aiCard.jpg';

interface StudentDashboardProps {
  user: User;
}

const ITEMS_PER_PAGE = 6;

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });

      setAssessments(assessmentData || []);

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id);

      setSubmissions(submissionData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasSubmitted = (assessmentId: string) => {
    return submissions.some((s) => s.assessment_id === assessmentId);
  };

  const getSubmission = (assessmentId: string) => {
    return submissions.find((s) => s.assessment_id === assessmentId);
  };

  // ✅ Sort assessments: Active tests first, then completed
  const sortedAssessments = [...assessments].sort((a, b) => {
    const aSubmitted = hasSubmitted(a.id);
    const bSubmitted = hasSubmitted(b.id);

    // Active tests (not submitted) come first
    if (!aSubmitted && bSubmitted) return -1;
    if (aSubmitted && !bSubmitted) return 1;
    return 0;
  });

  // ✅ Pagination logic
  const totalPages = Math.ceil(sortedAssessments.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedAssessments = sortedAssessments.slice(startIdx, endIdx);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleStartTest = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowInstructions(true);
  };

  const handleAgreeToInstructions = () => {
    if (selectedAssessment) {
      setShowInstructions(false);
      navigate(`/take-test/${selectedAssessment.id}`);
    }
  };

  const handleCancelTest = () => {
    setShowInstructions(false);
    setSelectedAssessment(null);
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Student Dashboard</h2>
          <p className="text-gray-600">View and attempt available assessments</p>
        </div>

        {/* Coding Lab Quick Access Card */}
        <div
          className="mb-5 relative rounded-xl overflow-hidden shadow-md"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-cyan-700/40" />

          <div className="relative z-10 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Coding Practice Lab</h3>
                </div>

                <p className="text-sm text-blue-100 mb-3 max-w-md">
                  Practice coding. Improve logic. Track progress.
                </p>

                <button
                  onClick={() => navigate('/coding-lab')}
                  className="bg-white text-blue-700 px-4 py-1.5 rounded-md text-sm font-medium
                             hover:bg-blue-50 transition-colors"
                >
                  Start Coding
                </button>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  <Code2 className="w-7 h-7" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Quick Access Card */}
        <div
          className="mb-5 relative rounded-xl overflow-hidden shadow-md"
          style={{
            backgroundImage: `url(${ailog})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-pink-700/40" />

          <div className="relative z-10 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Learning Assistant</h3>
                </div>

                <p className="text-sm text-purple-100 mb-3 max-w-md">
                  Get instant help with your studies, assignments, and exam preparation.
                </p>

                <button
                  onClick={() => navigate('/ai-assistant')}
                  className="bg-white text-purple-700 px-4 py-1.5 rounded-md text-sm font-medium
                             hover:bg-purple-100 transition-colors"
                >
                  Start Chat
                </button>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  <Sparkles className="w-7 h-7" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Tests</p>
                <p className="text-3xl font-bold text-gray-800">{assessments.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-800">{submissions.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-gray-800">
                  {submissions.length > 0
                    ? Math.round(
                        (submissions.reduce((sum, s) => sum + s.total_score, 0) /
                          submissions.length) *
                          10
                      ) / 10
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Assessments List with Pagination */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Available Assessments</h3>
          </div>

          {assessments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No assessments available at the moment</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {paginatedAssessments.map((assessment) => {
                  const submitted = hasSubmitted(assessment.id);
                  const submission = getSubmission(assessment.id);

                  return (
                    <div key={assessment.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {assessment.title}
                            </h4>
                            {!submitted && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {assessment.subject}
                            </span>
                            <span>Unit: {assessment.unit}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {assessment.duration_minutes} mins
                            </span>
                          </div>
                          {submitted && submission && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-sm font-medium text-green-600">Completed</span>
                              <span className="text-sm text-gray-600">
                                Score: {submission.total_score}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          {submitted ? (
                            <button
                              onClick={() => navigate(`/results/${submission?.id}`)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              View Results
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartTest(assessment)}
                              className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Start Test
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{startIdx + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(endIdx, sortedAssessments.length)}</span> of{' '}
                    <span className="font-semibold">{sortedAssessments.length}</span> assessments
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageClick(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-green-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Test Instructions Modal */}
      {showInstructions && selectedAssessment && (
        <TestInstructions
          assessmentTitle={selectedAssessment.title}
          duration={selectedAssessment.duration_minutes}
          onAgree={handleAgreeToInstructions}
          onCancel={handleCancelTest}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
