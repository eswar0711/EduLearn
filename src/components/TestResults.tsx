import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface TestResultsProps {
  user: User;
}

interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  answers: Record<string, string>;
  mcq_score: number;
  theory_score: number | null;
  total_score: number;
  is_auto_submitted: boolean;
  submitted_at: string;
  created_at: string;
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  unit: string;
  duration_minutes: number;
}

interface Question {
  id: string;
  question_text: string;
  type: string;
  options?: string[];
  correct_answer?: string;
  marks: number;
}

const TestResults: React.FC<TestResultsProps> = ({ user }) => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      if (!submissionId) {
        setError('Submission not found');
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
        return;
      }

      setAssessment(assessmentData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('assessment_id', submissionData.assessment_id);

      if (questionsError || !questionsData) {
        setError('Could not load questions');
        return;
      }

      setQuestions(questionsData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      setError('Error loading results');
      setLoading(false);
    }
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
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Results not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-50';
    if (score >= 50) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          {/* Results Summary */}
          <div
            className={`rounded-xl shadow-sm border border-gray-200 p-8 mb-8 ${getScoreBgColor(
              submission.total_score
            )}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {assessment.title}
                </h1>
                <p className="text-gray-600">
                  {assessment.subject} - Unit {assessment.unit}
                </p>
              </div>
              <div className="text-center">
                <div
                  className={`text-5xl font-bold ${getScoreColor(
                    submission.total_score
                  )}`}
                >
                  {submission.total_score}%
                </div>
                <p className="text-sm text-gray-600 mt-2">Score</p>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex gap-4 flex-wrap mt-6">
              <div className="px-4 py-2 bg-white rounded-lg border border-gray-300">
                <p className="text-xs text-gray-600">MCQ Score</p>
                <p className="text-xl font-bold text-gray-800">
                  {submission.mcq_score}
                </p>
              </div>

              {submission.theory_score !== null && (
                <div className="px-4 py-2 bg-white rounded-lg border border-gray-300">
                  <p className="text-xs text-gray-600">Theory Score</p>
                  <p className="text-xl font-bold text-gray-800">
                    {submission.theory_score}
                  </p>
                </div>
              )}

              <div className="px-4 py-2 bg-white rounded-lg border border-gray-300">
                <p className="text-xs text-gray-600">Submission Type</p>
                <p className="text-xl font-bold">
                  {submission.is_auto_submitted ? (
                    <span className="text-orange-600">⏱️ Auto-Submitted</span>
                  ) : (
                    <span className="text-green-600">✅ Manual Submit</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Questions Review */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your Answers
            </h2>

            <div className="space-y-8">
              {questions.map((question, index) => {
                const userAnswer = submission.answers[question.id];
                const isCorrect =
                  userAnswer &&
                  question.correct_answer &&
                  userAnswer === question.correct_answer;
                const answered = userAnswer !== undefined && userAnswer !== '';

                return (
                  <div
                    key={question.id}
                    className={`pb-8 border-b border-gray-200 last:border-b-0 ${
                      answered ? 'bg-blue-50' : 'bg-red-50'
                    } p-4 rounded-lg`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Question {index + 1}
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          ({question.marks} mark{question.marks > 1 ? 's' : ''})
                        </span>
                      </h3>
                      <div className="flex gap-2">
                        {answered ? (
                          <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Answered
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                            Not Answered
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 font-medium">
                      {question.question_text}
                    </p>

                    {question.type === 'MCQ' && question.options ? (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const selected = userAnswer === option;
                          const isCorrectOption =
                            option === question.correct_answer;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 border-2 rounded-lg ${
                                selected && isCorrect
                                  ? 'border-green-500 bg-green-100'
                                  : selected && !isCorrect
                                  ? 'border-red-500 bg-red-100'
                                  : isCorrectOption && !selected
                                  ? 'border-green-400 bg-green-50'
                                  : 'border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={selected}
                                  disabled
                                  className="w-4 h-4"
                                />
                                <span className="text-gray-700">{option}</span>
                                {selected && isCorrect && (
                                  <span className="ml-auto text-green-600 font-bold">
                                    ✓ Correct
                                  </span>
                                )}
                                {selected && !isCorrect && (
                                  <span className="ml-auto text-red-600 font-bold">
                                    ✗ Wrong
                                  </span>
                                )}
                                {isCorrectOption && !selected && (
                                  <span className="ml-auto text-green-600 font-bold">
                                    ✓ Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-gray-700 text-sm italic">
                          {userAnswer || 'No answer provided'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
