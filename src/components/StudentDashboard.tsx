// src/components/StudentDashboard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Submission } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import TestInstructions from './TestInstructions';
import { BookOpen, Clock, CheckCircle, PlayCircle, Sparkles, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


interface StudentDashboardProps {
  user: User;
}


const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);


  useEffect(() => {
    fetchData();
  }, [user.id]);


  const fetchData = async () => {
    try {
      // Fetch all assessments
      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });


      setAssessments(assessmentData || []);


      // Fetch student's submissions
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


  // ✅ Handle Start Test button click
  const handleStartTest = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowInstructions(true);
  };


  // ✅ Handle when student agrees to instructions
  const handleAgreeToInstructions = () => {
    if (selectedAssessment) {
      setShowInstructions(false);
      navigate(`/take-test/${selectedAssessment.id}`);
    }
  };


  // ✅ Handle when student cancels
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


        {/* ===== NEW: Coding Lab Quick Access Card ===== */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-6 h-6" />
                <h3 className="text-xl font-bold">Coding Practice Lab</h3>
              </div>
              <p className="text-blue-100 mb-4">
                Solve coding problems, practice your programming skills, and track your progress
              </p>
              <button
                onClick={() => navigate('/coding-lab')}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Start Coding
              </button>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Code2 className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>


        {/* AI Assistant Quick Access Card */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-bold">AI Learning Assistant</h3>
              </div>
              <p className="text-purple-100 mb-4">
                Get instant help with your studies, assignments, and exam preparation
              </p>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                Start Chat
              </button>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12" />
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


        {/* Assessments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Available Assessments</h3>
          </div>


          {assessments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No assessments available at the moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assessments.map((assessment) => {
                const submitted = hasSubmitted(assessment.id);
                const submission = getSubmission(assessment.id);


                return (
                  <div key={assessment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">
                          {assessment.title}
                        </h4>
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