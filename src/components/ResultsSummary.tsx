import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
//import type { User } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import { CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react';

interface ResultsSummaryProps {
  user: any;
}

interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  mcq_score: number;
  theory_score: number | null;
  total_score: number;
  is_auto_submitted: boolean;
  submitted_at: string;
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  unit: string;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ user }) => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      if (!submissionId) {
        setError('Submission not found');
        setLoading(false);
        return;
      }

      // Fetch submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError || !submissionData) {
        setError('Could not load submission');
        setLoading(false);
        return;
      }

      setSubmission(submissionData);

      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', submissionData.assessment_id)
        .single();

      if (assessmentError || !assessmentData) {
        setError('Could not load assessment');
        setLoading(false);
        return;
      }

      setAssessment(assessmentData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      setError('Error loading results');
      setLoading(false);
    }
  };

  const getPassStatus = (score: number, passingScore: number = 50) => {
    return score >= passingScore;
  };

  const isPassed = submission && assessment 
    ? getPassStatus(submission.total_score, 50)
    : false;

  const handleBackToDashboard = () => {
    // Navigate immediately without any delays
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-lg text-gray-600">Loading results...</div>
        </div>
      </div>
    );
  }

  if (error || !submission || !assessment) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Results not found'}</p>
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Result Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Status Icon */}
            <div className="mb-6">
              {isPassed ? (
                <div className="flex justify-center">
                  <CheckCircle className="w-24 h-24 text-green-600 animate-pulse" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <XCircle className="w-24 h-24 text-red-600" />
                </div>
              )}
            </div>

            {/* Status Text */}
            <h1
              className={`text-4xl font-bold mb-2 ${
                isPassed ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPassed ? 'PASSED ✓' : 'FAILED ✗'}
            </h1>

            {/* Assessment Details */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                {assessment.title}
              </h2>
              <p className="text-gray-600">
                {assessment.subject} - Unit {assessment.unit}
              </p>
            </div>

            {/* Score Display */}
            <div
              className={`rounded-xl p-6 mb-6 ${
                isPassed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <p className="text-gray-600 text-sm mb-2">Your Score</p>
              <div
                className={`text-5xl font-bold mb-2 ${
                  isPassed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {submission.total_score}%
              </div>
              <p className={`text-sm ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                {isPassed 
                  ? '🎉 Great job! You passed the test.'
                  : '⚠️ You need 50% to pass. Keep practicing!'
                }
              </p>
            </div>

            {/* Score Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">MCQ Score</span>
                <span className="font-semibold text-gray-800">{submission.mcq_score}</span>
              </div>
              {submission.theory_score !== null && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Theory Score</span>
                  <span className="font-semibold text-gray-800">{submission.theory_score}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-gray-600">Submission Type</span>
                <span className="font-semibold text-gray-800">
                  {submission.is_auto_submitted ? '⏱️ Auto-Submitted' : '✅ Manual Submit'}
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                📝 You can view your detailed answers and explanations from the Dashboard later.
              </p>
            </div>

            {/* Action Button - FIXED */}
            <button
              onClick={handleBackToDashboard}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary;
