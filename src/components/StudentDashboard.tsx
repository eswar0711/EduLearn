import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Submission } from '../utils/supabaseClient';
import TestInstructions from './TestInstructions';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  Sparkles, 
  Code2, 
  ChevronLeft, 
  ChevronRight,
  RotateCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img from '../assets/codingPic.jpg';
import ailog from '../assets/aiCard.jpg';
import LoadingSpinner from '../layouts/LoadingSpinner';

interface StudentDashboardProps {
  user: User;
}

type AssessmentStatus = 'new' | 'in_progress' | 'completed';

const ITEMS_PER_PAGE = 6;

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 🟢 FIX: Refetch data whenever the window gets focus (fixes stale "Resume" button)
  useEffect(() => {
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
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

  // 🟢 FIX: Smarter Logic to handle duplicates
  // If we have 2 rows (one In Progress, one Completed), prioritize Completed.
  const getSubmission = (assessmentId: string) => {
    const matches = submissions.filter((s) => s.assessment_id === assessmentId);
    if (matches.length === 0) return undefined;

    const completed = matches.find((s) => s.submitted_at !== null);
    return completed || matches[0];
  };

  const getStatus = (assessmentId: string): AssessmentStatus => {
    const submission = getSubmission(assessmentId);
    if (!submission) return 'new';
    return submission.submitted_at ? 'completed' : 'in_progress';
  };

  const sortedAssessments = [...assessments].sort((a, b) => {
    const statusScore = { in_progress: 0, new: 1, completed: 2 };
    return statusScore[getStatus(a.id)] - statusScore[getStatus(b.id)];
  });

  const totalPages = Math.ceil(sortedAssessments.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedAssessments = sortedAssessments.slice(startIdx, endIdx);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePageClick = (page: number) => setCurrentPage(page);

  const handleStartTest = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowInstructions(true);
  };

  const handleResumeTest = (assessmentId: string) => {
    navigate(`/take-test/${assessmentId}`);
  };

  // 🟢 FIX: Create "In Progress" placeholder correctly
  const handleAgreeToInstructions = async () => {
    if (!selectedAssessment) return;

    try {
      // 1. Check if ANY submission exists (Completed or In Progress)
      const existing = getSubmission(selectedAssessment.id);
      
      // 2. Only create a new row if absolutely nothing exists
      if (!existing) {
        const { error } = await supabase.from('submissions').insert({
          assessment_id: selectedAssessment.id,
          student_id: user.id,
          answers: {}, 
          total_score: 0,
          submitted_at: null // Explicitly null
        });

        if (error) throw error;
        await fetchData(); // Update local state immediately
      }

      setShowInstructions(false);
      navigate(`/take-test/${selectedAssessment.id}`);

    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
    }
  };

  const handleCancelTest = () => {
    setShowInstructions(false);
    setSelectedAssessment(null);
  };

  if (loading) {
    return (
      <div className="flex">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-800 to-gray-800 bg-clip-text text-transparent">
            Student Dashboard
          </h2>
          <p className="text-gray-600">View and attempt available assessments</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div
            className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer"
            onClick={() => navigate('/coding-lab')}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '160px'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-transparent transition-opacity group-hover:opacity-95" />
            <div className="relative z-10 p-6 text-white h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Coding Lab</h3>
                </div>
                <p className="text-blue-100 text-sm max-w-xs">
                  Practice coding challenges and improve your logic.
                </p>
              </div>
              <div className="flex items-center text-sm font-medium text-blue-200 group-hover:text-white transition-colors">
                Enter Lab <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>

          <div
            className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer"
            onClick={() => navigate('/ai-assistant')}
            style={{
              backgroundImage: `url(${ailog})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '160px'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/70 to-transparent transition-opacity group-hover:opacity-95" />
            <div className="relative z-10 p-6 text-white h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">AI Assistant</h3>
                </div>
                <p className="text-purple-100 text-sm max-w-xs">
                  Get instant help with studies and exam prep.
                </p>
              </div>
              <div className="flex items-center text-sm font-medium text-purple-200 group-hover:text-white transition-colors">
                Start Chat <ChevronRight className="w-4 h-4 ml-1" />
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
                <p className="text-3xl font-bold text-gray-800">
                  {submissions.filter(s => s.submitted_at).length}
                </p>
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
                  {submissions.filter(s => s.submitted_at).length > 0
                    ? Math.round(
                        (submissions.filter(s => s.submitted_at).reduce((sum, s) => sum + s.total_score, 0) /
                          submissions.filter(s => s.submitted_at).length) *
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

        {/* Assessments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Available Assessments</h3>
            <span className="text-sm text-gray-500">Sorted by Status</span>
          </div>

          {assessments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No assessments available at the moment</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {paginatedAssessments.map((assessment) => {
                  const status = getStatus(assessment.id);
                  const submission = getSubmission(assessment.id);

                  return (
                    <div key={assessment.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{assessment.title}</h4>
                            
                            {status === 'new' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                New
                              </span>
                            )}
                            {status === 'in_progress' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                                In Progress
                              </span>
                            )}
                            {status === 'completed' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                Completed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <BookOpen className="w-3.5 h-3.5" />
                              {assessment.subject}
                            </span>
                            <span>Unit: {assessment.unit}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {assessment.duration_minutes} mins
                            </span>
                          </div>

                          {status === 'completed' && submission && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Your Score:</span>
                              <span className={`text-sm font-bold ${submission.total_score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                {submission.total_score}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {status === 'completed' ? (
                            <button
                              onClick={() => navigate(`/results/${submission?.id}`)}
                              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                              <CheckCircle className="w-4 h-4" />
                              View Results
                            </button>
                          ) : status === 'in_progress' ? (
                            <button
                              onClick={() => handleResumeTest(assessment.id)}
                              className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm font-medium"
                            >
                              <RotateCw className="w-4 h-4" />
                              Resume Test
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartTest(assessment)}
                              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm font-medium"
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

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageClick(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
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