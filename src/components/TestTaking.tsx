import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User, Question } from '../utils/supabaseClient';
import { autoGradeMCQ } from '../utils/autoGrading';
import NavigationSidebar from './NavigationSidebar';
import ConfirmationModal from './ConfirmationModal';
import {
  getOrCreateTestSession,
  calculateRemainingTime,
  completeTestSession,
  loadDraftAnswers,
  saveDraftAnswers,
  deleteDraftAnswers,
  type TestSession,
} from '../utils/testTimer';
import { Clock, Send, AlertCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface TestTakingProps {
  user: User;
}


const TestTaking: React.FC<TestTakingProps> = ({ user }) => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();


  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);


  useEffect(() => {
    if (!assessmentId) {
      setError('Assessment ID is missing');
      setLoading(false);
      return;
    }


    const initializeTest = async () => {
      try {
        setLoading(true);
        console.log('🔄 Initializing test...');


        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();


        if (assessmentError || !assessmentData) {
          console.error('❌ Assessment error:', assessmentError);
          setError('Failed to load assessment');
          toast.error('Failed to load assessment', {
            position: 'top-right',
            autoClose: 5000,
          });
          setLoading(false);
          return;
        }


        setAssessment(assessmentData);


        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('question_number', { ascending: true });


        if (questionsError) {
          console.error('❌ Questions error:', questionsError);
          setError('Failed to load questions');
          toast.error('Failed to load questions', {
            position: 'top-right',
            autoClose: 5000,
          });
          setLoading(false);
          return;
        }


        setQuestions(questionsData || []);


        const session = await getOrCreateTestSession(
          assessmentId,
          assessmentData.duration_minutes
        );
        
        setTestSession(session);


        const draftAnswers = await loadDraftAnswers(session.id);
        setAnswers(draftAnswers);


        const remaining = calculateRemainingTime(session);
        setTimeLeft(remaining);


        if (remaining <= 0) {
          setIsTimeExpired(true);
          toast.warning('⏱️ Time expired for this test', {
            position: 'top-right',
            autoClose: 5000,
          });
        }


        setLoading(false);
      } catch (error: any) {
        console.error('❌ Init error:', error);
        setError('Error loading test: ' + (error.message || 'Unknown'));
        toast.error('Error loading test: ' + (error.message || 'Unknown'), {
          position: 'top-right',
          autoClose: 5000,
        });
        setLoading(false);
      }
    };


    initializeTest();
  }, [assessmentId]);


  useEffect(() => {
    if (!testSession || isTimeExpired || submitting) return;


    const timer = setInterval(() => {
      const remaining = calculateRemainingTime(testSession);


      if (remaining <= 0) {
        console.warn('⏱️ Time expired!');
        setIsTimeExpired(true);
        setTimeLeft(0);
        clearInterval(timer);
        handleAutoSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);


    return () => clearInterval(timer);
  }, [testSession, isTimeExpired, submitting]);


  useEffect(() => {
    if (!testSession || submitting || Object.keys(answers).length === 0) return;


    console.log('💾 Auto-saving answers...');
    saveDraftAnswers(testSession.id, answers);


    const saveInterval = setInterval(() => {
      console.log('💾 Auto-saving answers...');
      saveDraftAnswers(testSession.id, answers);
    }, 5000);


    return () => clearInterval(saveInterval);
  }, [testSession, answers, submitting]);


  const handleAnswerChange = (questionId: string, answer: string) => {
    console.log(`✏️ Answer changed for Q${questionId}: ${answer}`);
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };


  const handleAutoSubmit = async () => {
    if (!testSession) return;
    await submitTest(true);
  };


  const handleSubmit = async () => {
    if (submitting) return;
    setShowConfirmModal(true);
  };


  const handleConfirmSubmit = async () => {
    await submitTest(false);
  };


  const submitTest = async (isAutoSubmit: boolean) => {
    if (!testSession) return;


    setSubmitting(true);


    try {
      await completeTestSession(testSession.id);


      const mcqScore = autoGradeMCQ(questions, answers);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const percentageScore = totalMarks > 0 ? Math.round((mcqScore / totalMarks) * 100) : 0;


      const { data: submission, error: submitError } = await supabase
        .from('submissions')
        .insert({
          assessment_id: assessmentId,
          student_id: user.id,
          test_session_id: testSession.id,
          answers: answers,
          mcq_score: mcqScore,
          theory_score: null,
          total_score: percentageScore,
          is_auto_submitted: isAutoSubmit,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();


      if (submitError) throw submitError;


      await deleteDraftAnswers(testSession.id);


      console.log('✅ Test submitted');
      
      // Show success toast
      toast.success(
        isAutoSubmit 
          ? '✅ Test auto-submitted successfully!' 
          : '✅ Test submitted successfully!',
        {
          position: 'top-right',
          autoClose: 2000,
          onClose: () => navigate(`/results/${submission.id}`),
        }
      );
      
      setShowConfirmModal(false);
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      setError('Error submitting: ' + error.message);
      
      // Show error toast
      toast.error(
        'Error submitting test. Please try again.',
        {
          position: 'top-right',
          autoClose: 5000,
        }
      );
      
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;


    if (hours > 0) {
      return `${hours}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };


  const getTimeColor = (): string => {
    if (timeLeft <= 300) return 'text-red-600';
    if (timeLeft <= 600) return 'text-yellow-600';
    return 'text-green-600';
  };


  const getTimeBgColor = (): string => {
    if (timeLeft <= 300) return 'bg-red-50';
    if (timeLeft <= 600) return 'bg-yellow-50';
    return 'bg-green-50';
  };


  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-lg text-gray-600">Loading test...</div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }


  if (!assessment || !testSession) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-lg text-red-600">Assessment not found</div>
        </div>
      </div>
    );
  }


  if (isTimeExpired) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">⏱️ Time Expired</h2>
            <p className="text-gray-600 mb-6">
              Your test has been auto-submitted.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }


  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {assessment.title}
                </h2>
                <p className="text-gray-600">
                  {assessment.subject} - Unit {assessment.unit}
                </p>
              </div>


              <div
                className={`text-right px-6 py-4 rounded-lg border-2 ${getTimeBgColor()} ${
                  timeLeft <= 300 ? 'border-red-200' : 'border-green-200'
                }`}
              >
                <div className={`flex items-center gap-2 text-2xl font-bold ${getTimeColor()}`}>
                  <Clock className="w-6 h-6" />
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-gray-600 mt-1">Time Remaining</p>
                {timeLeft <= 300 && (
                  <p className="text-xs text-red-600 font-semibold mt-2 animate-pulse">
                    ⚠️ Time running out!
                  </p>
                )}
              </div>
            </div>


            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              🔒 Your answers are auto-saved every 5 seconds. Refreshing will NOT lose your answers.
            </div>
          </div>


          <div className="space-y-6 mb-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question {index + 1}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({question.marks} {question.marks === 1 ? 'mark' : 'marks'})
                    </span>
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {question.type}
                  </span>
                </div>


                <p className="text-gray-700 mb-4">{question.question_text}</p>


                {question.type === 'MCQ' && question.options ? (
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-4 h-4 text-blue-600"
                          disabled={isTimeExpired}
                        />
                        <span className="ml-3 text-gray-700">
                          {String.fromCharCode(65 + oIndex)}. {option}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Type your answer here..."
                    disabled={isTimeExpired}
                  />
                )}
              </div>
            ))}
          </div>


          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {Object.keys(answers).length} of {questions.length} questions answered
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || isTimeExpired}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Submit Test?"
        message="Are you sure you want to submit your test? Once submitted, you won't be able to change your answers."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={submitting}
      />

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};


export default TestTaking;
