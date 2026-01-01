import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User, Question } from '../utils/supabaseClient';
import { autoGradeMCQ } from '../utils/autoGrading';
import NavigationSidebar from './NavigationSidebar';
import ConfirmationModal from './ConfirmationModal';
import QuestionDisplay from '../components/TestManager/QuestionDisplay';
import {
  getOrCreateTestSession,
  calculateRemainingTime,
  completeTestSession,
  lockTestSession,
  loadDraftAnswers,
  saveDraftAnswers,
  deleteDraftAnswers,
  type TestSession,
} from '../utils/testTimer';
import { Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface TestTakingProps {
  user: User;
}


const TestTaking: React.FC<TestTakingProps> = ({ user }) => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();


  // ============ STATE MANAGEMENT ============
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [expandedHeader, setExpandedHeader] = useState(false);
  const [hasShownFiveMinWarning, setHasShownFiveMinWarning] = useState(false);
  const [hasShownOneMinWarning, setHasShownOneMinWarning] = useState(false);


  // ============ UTILITIES ============


  /**
   * Format time into compact HH:MM:SS or MM:SS format
   * @param seconds - Total seconds remaining
   * @returns Formatted time string (e.g., "2:05:30" or "45:30")
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;


    const padZero = (num: number) => num.toString().padStart(2, '0');


    if (hours > 0) {
      return `${hours}:${padZero(mins)}:${padZero(secs)}`;
    }
    return `${mins}:${padZero(secs)}`;
  };


  /**
   * Get timer color based on remaining time
   * @returns Tailwind color class
   */
  const getTimeColor = (): string => {
    if (timeLeft <= 300) return 'text-red-600'; // < 5 mins
    if (timeLeft <= 600) return 'text-amber-600'; // < 10 mins
    return 'text-teal-600'; // > 10 mins
  };


  /**
   * Get timer background color
   * @returns Tailwind background color class
   */
  const getTimeBgColor = (): string => {
    if (timeLeft <= 300) return 'bg-red-50 border-red-200';
    if (timeLeft <= 600) return 'bg-amber-50 border-amber-200';
    return 'bg-teal-50 border-teal-200';
  };


  /**
   * Get timer status label
   * @returns Status text (e.g., "Critical", "Low", "Good")
   */
  const getTimeStatus = (): string => {
    if (timeLeft <= 300) return 'Critical';
    if (timeLeft <= 600) return 'Low';
    return 'Good';
  };


  /**
   * Calculate percentage of questions answered
   * @returns Number between 0-100
   */
  const getProgressPercentage = (): number => {
    if (questions.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  };


  /**
   * Get unanswered question count
   * @returns Number of unanswered questions
   */
  const getUnansweredCount = (): number => {
    return questions.length - Object.keys(answers).length;
  };


  // ============ INITIALIZATION ============


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


        // Fetch assessment
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


        // Fetch questions
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


        // Get or create test session
        const session = await getOrCreateTestSession(
          assessmentId,
          assessmentData.duration_minutes
        );


        setTestSession(session);


        // Load draft answers
        const draftAnswers = await loadDraftAnswers(session.id);
        setAnswers(draftAnswers);


        // Calculate remaining time
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


  // ============ TIMER COUNTDOWN ============


  // useEffect(() => {
  //   if (!testSession || isTimeExpired || submitting) return;


  //   const timer = setInterval(() => {
  //     const remaining = calculateRemainingTime(testSession);


  //     if (remaining <= 0) {
  //       console.warn('⏱️ Time expired!');
  //       setIsTimeExpired(true);
  //       setTimeLeft(0);
  //       clearInterval(timer);
  //       handleAutoSubmit();
  //     } else {
  //       setTimeLeft(remaining);


  //       // ✅ SHOW 5-MINUTE WARNING (ONLY ONCE)
  //       if (remaining <= 300 && !hasShownFiveMinWarning) {
  //         setHasShownFiveMinWarning(true);
  //         toast.warning('⏰ Time is running out! You have only 5 minutes left!', {
  //           position: 'top-right',
  //           autoClose: 5000,
  //           className: 'bg-red-50 border-l-4 border-red-600',
  //           bodyClassName: 'text-red-700 font-semibold',
  //           icon: '⚠️',
  //         });
  //         console.warn('⏰ 5-minute warning shown');
  //       }


  //       // ✅ SHOW 1-MINUTE WARNING (ONLY ONCE)
  //       if (remaining <= 60 && !hasShownOneMinWarning) {
  //         setHasShownOneMinWarning(true);
  //         toast.error('🚨 CRITICAL! Only 1 minute remaining! Submit your answers now!', {
  //           position: 'top-right',
  //           autoClose: 3000,
  //           className: 'bg-red-100 border-l-4 border-red-800',
  //           bodyClassName: 'text-red-800 font-bold',
  //           icon: '🚨',
  //         });
  //         console.error('🚨 1-minute warning shown');
  //       }
  //     }
  //   }, 1000);


  //   return () => clearInterval(timer);
  // }, [testSession, isTimeExpired, submitting, hasShownFiveMinWarning, hasShownOneMinWarning]);
// Replace the timer countdown useEffect with this:

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

      // ✅ SHOW WARNING BASED ON CURRENT TIME (NOT FLAGS)
      // Only show 1-minute warning if time is between 1-60 seconds
      if (remaining > 60 && remaining <= 300 && !hasShownFiveMinWarning) {
        setHasShownFiveMinWarning(true);
        toast.warning('⏰ Time is running out! You have only 5 minutes left!', {
          position: 'top-right',
          autoClose: 5000,
          className: 'bg-amber-50 border-l-4 border-amber-600',
        });
        console.warn('⏰ 5-minute warning shown');
      }

      // Only show 1-minute warning if time is less than 60 seconds
      if (remaining <= 60 && !hasShownOneMinWarning) {
        setHasShownOneMinWarning(true);
        toast.error('🚨 CRITICAL! Only 1 minute remaining! Submit your answers now!', {
          position: 'top-right',
          autoClose: 3000,
          className: 'bg-red-100 border-l-4 border-red-800',
        });
        console.error('🚨 1-minute warning shown');
      }
    }
  }, 1000);

  return () => clearInterval(timer);
}, [testSession, isTimeExpired, submitting, hasShownFiveMinWarning, hasShownOneMinWarning]);


  // ============ AUTO-SAVE ANSWERS ============


  useEffect(() => {
    if (!testSession || submitting || Object.keys(answers).length === 0)
      return;


    console.log('💾 Auto-saving answers...');
    saveDraftAnswers(testSession.id, answers);


    const saveInterval = setInterval(() => {
      console.log('💾 Auto-saving answers...');
      saveDraftAnswers(testSession.id, answers);
    }, 5000);


    return () => clearInterval(saveInterval);
  }, [testSession, answers, submitting]);


  // ============ EVENT HANDLERS ============


  /**
   * Handle answer change for a question
   */
  const handleAnswerChange = (questionId: string, answer: string) => {
    console.log(`✏️ Answer changed for Q${questionId}: ${answer}`);
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };


  /**
   * Navigate to a specific question
   */
  const handleNavigateQuestion = (newIndex: number) => {
    console.log(`➡️ Navigating to question ${newIndex + 1}`);
    setCurrentQuestionIndex(newIndex);
    setExpandedHeader(false); // Collapse header on navigation
  };


  /**
   * Handle submit click - check for unanswered questions
   */
  const handleSubmitClick = () => {
    const unansweredQuestions = questions
      .map((q, idx) => (!answers[q.id] ? idx + 1 : null))
      .filter((n) => n !== null);


    if (unansweredQuestions.length > 0) {
      setShowUnansweredWarning(true);
    } else {
      setShowConfirmModal(true);
    }
  };


  /**
   * Confirm unanswered and proceed to final confirmation
   */
  const handleConfirmUnanswered = () => {
    setShowUnansweredWarning(false);
    setShowConfirmModal(true);
  };


  /**
   * Auto-submit when time expires
   */
  const handleAutoSubmit = async () => {
    if (!testSession) return;
    await submitTest(true);
  };


  /**
   * Handle final submit confirmation
   */
  const handleConfirmSubmit = async () => {
    await submitTest(false);
  };


  /**
   * Submit test to database
   */
  const submitTest = async (isAutoSubmit: boolean) => {
    if (!testSession) return;


    setSubmitting(true);


    try {
      // Mark session as completed
      await completeTestSession(testSession.id);


      // Calculate score
      const mcqScore = autoGradeMCQ(questions, answers);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const percentageScore =
        totalMarks > 0 ? Math.round((mcqScore / totalMarks) * 100) : 0;


      // Insert submission
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


      // Lock the test session
      await lockTestSession(testSession.id, submission.id);


      // Delete draft answers
      await deleteDraftAnswers(testSession.id);


      console.log('✅ Test submitted and session locked');


      // Show success toast and redirect
      toast.success(
        isAutoSubmit
          ? '✅ Test auto-submitted successfully!'
          : '✅ Test submitted successfully!',
        {
          position: 'top-right',
          autoClose: 2000,
          onClose: () => navigate(`/results-summary/${submission.id}`),
        }
      );


      setShowConfirmModal(false);
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      setError('Error submitting: ' + error.message);


      toast.error('Error submitting test. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
      });


      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };


  // ============ RENDER STATES ============


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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              ⏱️ Time Expired
            </h2>
            <p className="text-gray-600 mb-6">Your test has been auto-submitted.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }


  // ============ MAIN RENDER ============


  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />


      <div className="flex-1 flex flex-col">
        {/* ============ MOBILE-OPTIMIZED HEADER ============ */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          {/* MAIN HEADER ROW - COMPACT FOR MOBILE */}
          <div className={`px-4 py-3 sm:px-6 sm:py-4 border-2 ${getTimeBgColor()} transition-colors duration-300`}>
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              {/* LEFT: Title & Subject */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                  {assessment.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {assessment.subject} • U{assessment.unit}
                </p>
              </div>


              {/* RIGHT: TIMER - COMPACT & PROMINENT */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 font-mono text-lg sm:text-2xl font-bold ${getTimeColor()} transition-colors duration-300 ${
                  timeLeft <= 300 ? 'animate-pulse' : ''
                }`}>
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  timeLeft <= 300
                    ? 'bg-red-100 text-red-700'
                    : timeLeft <= 600
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-teal-100 text-teal-700'
                }`}>
                  {getTimeStatus()}
                </span>
              </div>
            </div>
          </div>


          {/* EXPANDABLE PROGRESS SECTION - MOBILE ONLY */}
          <div className="md:hidden border-t border-gray-100">
            <button
              onClick={() => setExpandedHeader(!expandedHeader)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                Question {currentQuestionIndex + 1}/{questions.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                  expandedHeader ? 'rotate-180' : ''
                }`}
              />
            </button>


            {/* EXPANDED DETAILS */}
            {expandedHeader && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3 animate-in fade-in duration-200">
                {/* PROGRESS BAR */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-gray-700">Progress</span>
                    <span className="text-xs font-bold text-teal-600">
                      {getProgressPercentage()}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>


                {/* ANSWER STATS */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-600">Answered</p>
                    <p className="text-sm font-bold text-teal-600">
                      {Object.keys(answers).length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-600">Unanswered</p>
                    <p className="text-sm font-bold text-amber-600">
                      {getUnansweredCount()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-sm font-bold text-gray-700">
                      {questions.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* DESKTOP PROGRESS ROW - HIDDEN ON MOBILE */}
          <div className="hidden md:block px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Progress: Question {currentQuestionIndex + 1}/{questions.length}
                  </span>
                  <span className="text-sm font-bold text-teal-600">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600 text-xs">Answered</p>
                  <p className="font-bold text-teal-600">
                    {Object.keys(answers).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-xs">Unanswered</p>
                  <p className="font-bold text-amber-600">
                    {getUnansweredCount()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ============ QUESTION DISPLAY ============ */}
        <QuestionDisplay
          questions={questions}
          answers={answers}
          currentQuestionIndex={currentQuestionIndex}
          onAnswerChange={handleAnswerChange}
          onNavigate={handleNavigateQuestion}
          onSubmit={handleSubmitClick}
          isTimeExpired={isTimeExpired}
          submitting={submitting}
          timeLeft={timeLeft}
        />
      </div>


      {/* ============ MODALS ============ */}


      {/* UNANSWERED QUESTIONS WARNING */}
      <ConfirmationModal
        isOpen={showUnansweredWarning}
        title="Unanswered Questions"
        message={`You have ${getUnansweredCount()} question(s) unanswered. Are you sure you want to submit?`}
        confirmLabel="Submit Anyway"
        cancelLabel="Continue"
        onConfirm={handleConfirmUnanswered}
        onCancel={() => setShowUnansweredWarning(false)}
        isLoading={false}
      />


      {/* FINAL CONFIRMATION */}
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


      {/* TOAST NOTIFICATIONS */}
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