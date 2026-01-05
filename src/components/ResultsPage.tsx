// src/components/ResultsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Question, Submission } from '../utils/supabaseClient';
//import NavigationSidebar from './NavigationSidebar';
import { CheckCircle, XCircle, Clock, Home } from 'lucide-react';
//import LoadingSpinner from '../layouts/PremiumLoader';
import PremiumLoader from '../layouts/PremiumLoader';

interface ResultsPageProps {
  user: User;
}

const ResultsPage: React.FC<ResultsPageProps> = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      // Fetch submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;
      setSubmission(submissionData);

      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', submissionData.assessment_id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('assessment_id', submissionData.assessment_id);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      alert('Error loading results');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const isCorrect = (question: Question, studentAnswer: string) => {
    if (question.type === 'MCQ' && question.correct_answer) {
      return studentAnswer?.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
    }
    return null; // Theory questions are manually graded
  };

  if (loading) {
    return (
      <div className="flex">
        {/* <NavigationSidebar user={user} /> */}
        <div className="flex-1 flex items-center justify-center">
           <PremiumLoader message="Loading results..." />;
        </div>
      </div>
    );
  }

  if (!submission || !assessment) {
    return (
      <div className="flex">
        {/* <NavigationSidebar user={user} /> */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-red-600">Results not found</div>
        </div>
      </div>
    );
  }

  
  const mcqMarks = questions.filter(q => q.type === 'MCQ').reduce((sum, q) => sum + q.marks, 0);
  const theoryMarks = questions.filter(q => q.type === 'Theory').reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* <NavigationSidebar user={user} /> */}

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
            <h3 className="text-xl text-gray-700 mb-4">{assessment.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Score</p>
                <p className="text-3xl font-bold text-gray-600">{submission.total_score}%</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">MCQ Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {submission.mcq_score}/{mcqMarks}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Theory Score</p>
                <p className="text-3xl font-bold text-purple-600">
                  {submission.theory_score !== null ? `${submission.theory_score}/${theoryMarks}` : 'Pending'}
                </p>
              </div>
            </div>

            {submission.theory_score === null && theoryMarks > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Your theory answers are pending faculty review. The final score will be updated once grading is complete.
                </p>
              </div>
            )}
          </div>

          {/* Question Review */}
          <div className="space-y-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Question Review</h3>
            
            {questions.map((question, index) => {
              const studentAnswer = submission.answers[question.id];
              const correct = isCorrect(question, studentAnswer);

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Question {index + 1}
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({question.marks} {question.marks === 1 ? 'mark' : 'marks'})
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {question.type}
                      </span>
                      {correct !== null && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            correct
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {correct ? (
                            <>
                              <CheckCircle className="w-4 h-4" /> Correct
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" /> Incorrect
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{question.question_text}</p>

                  {question.type === 'MCQ' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => {
                        const isStudentAnswer = studentAnswer === option;
                        const isCorrectAnswer = question.correct_answer === option;

                        return (
                          <div
                            key={oIndex}
                            className={`p-3 border rounded-lg ${
                              isCorrectAnswer
                                ? 'bg-green-50 border-green-300'
                                : isStudentAnswer
                                ? 'bg-red-50 border-red-300'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                {String.fromCharCode(65 + oIndex)}. {option}
                              </span>
                              {isCorrectAnswer && (
                                <span className="text-green-700 text-sm font-medium">
                                  Correct Answer
                                </span>
                              )}
                              {isStudentAnswer && !isCorrectAnswer && (
                                <span className="text-red-700 text-sm font-medium">
                                  Your Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {studentAnswer || 'No answer provided'}
                          </p>
                        </div>
                      </div>
                      {submission.theory_score === null && (
                        <p className="text-sm text-gray-600 italic">
                          Pending faculty review
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-600 text-blue-900 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
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

export default ResultsPage;