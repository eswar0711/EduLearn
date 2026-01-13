import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User, Question } from '../utils/supabaseClient';
import { autoGradeMCQ } from '../utils/autoGrading';
import ConfirmationModal from './ConfirmationModal';
import QuestionDisplay from '../components/TestManager/QuestionDisplay';
import PremiumLoader from '../layouts/PremiumLoader';

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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 🟢 FIX 3: Track success to unmount "Time Expired" screen
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [expandedHeader, setExpandedHeader] = useState(false);
  const [hasShownFiveMinWarning, setHasShownFiveMinWarning] = useState(false);
  const [hasShownOneMinWarning, setHasShownOneMinWarning] = useState(false);

  // Refs for accessing latest state in closures
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const submittingRef = useRef(submitting);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);

  // ============ UTILITIES ============
  const formatTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    const padZero = (num: number) => num.toString().padStart(2, '0');
    if (hours > 0) return `${hours}:${padZero(mins)}:${padZero(secs)}`;
    return `${mins}:${padZero(secs)}`;
  };

  const getTimeColor = (): string => {
    if ((timeLeft || 0) <= 300) return 'text-red-600';
    if ((timeLeft || 0) <= 600) return 'text-amber-600';
    return 'text-teal-600';
  };

  const getTimeBgColor = (): string => {
    if ((timeLeft || 0) <= 300) return 'bg-red-50 border-red-200';
    if ((timeLeft || 0) <= 600) return 'bg-amber-50 border-amber-200';
    return 'bg-teal-50 border-teal-200';
  };

  const getTimeStatus = (): string => {
    if ((timeLeft || 0) <= 300) return 'Critical';
    if ((timeLeft || 0) <= 600) return 'Low';
    return 'Good';
  };

  const getProgressPercentage = (): number => {
    if (questions.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  };

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

        // 1. Check if ALREADY SUBMITTED
        const { data: existingSubmission } = await supabase
          .from('submissions')
          .select('id, submitted_at')
          .eq('assessment_id', assessmentId)
          .eq('student_id', user.id)
          .maybeSingle();

        if (existingSubmission && existingSubmission.submitted_at) {
          console.log('✅ Test already submitted. Redirecting...');
          navigate(`/results-summary/${existingSubmission.id}`, { replace: true });
          return;
        }

        // 2. Load Assessment
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (assessmentError || !assessmentData) throw new Error('Failed to load assessment');
        setAssessment(assessmentData);

        // 3. Load Questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('question_number', { ascending: true });

        if (questionsError) throw new Error('Failed to load questions');
        
        setQuestions(questionsData || []);
        questionsRef.current = questionsData || [];

        // 4. Init Session
        const session = await getOrCreateTestSession(assessmentId, assessmentData.duration_minutes);
        setTestSession(session);

        // 5. Load Drafts
        const draftAnswers = await loadDraftAnswers(session.id);
        setAnswers(draftAnswers);
        answersRef.current = draftAnswers;

        // 6. Calculate Time
        const remaining = calculateRemainingTime(session);
        setTimeLeft(remaining);

        // Check expiry on load
        if (remaining <= 0) {
          console.warn('⚠️ Test loaded but already expired. Triggering submit...');
          setIsTimeExpired(true);
          setTimeout(() => handleAutoSubmit(), 500); 
        }

        setLoading(false);
      } catch (error: any) {
        console.error('❌ Init error:', error);
        setError(error.message || 'Unknown error');
        setLoading(false);
      }
    };

    initializeTest();
  }, [assessmentId, user.id, navigate]);

  // ============ 🟢 FIX 1: TIMER COUNTDOWN (Removed timeLeft from deps) ============
  useEffect(() => {
    if (loading || isTimeExpired || submitting || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isTimeExpired, submitting]); // ✅ timeLeft removed to prevent infinite loops

  // ============ 🟢 FIX 2: WATCHER (Added missing deps) ============
  useEffect(() => {
    // Check expiry
    if (timeLeft !== null && timeLeft <= 0 && !isTimeExpired && !loading && !submittingRef.current) {
      console.warn('⏱️ Timer finished! Triggering auto-submit...');
      setIsTimeExpired(true);
      handleAutoSubmit();
    }
    
    // Check warnings
    if (timeLeft !== null && timeLeft > 0) {
       if (timeLeft <= 300 && timeLeft > 60 && !hasShownFiveMinWarning) {
          setHasShownFiveMinWarning(true);
          toast.warning('⏰ 5 Minutes Remaining!');
       }
       if (timeLeft <= 60 && !hasShownOneMinWarning) {
          setHasShownOneMinWarning(true);
          toast.error('🚨 1 Minute Remaining! Submit now!');
       }
    }
  }, [
    timeLeft, 
    isTimeExpired, 
    loading, 
    hasShownFiveMinWarning, 
    hasShownOneMinWarning
  ]); // ✅ Deps are exhaustive

  // ============ AUTO-SAVE ANSWERS ============
  useEffect(() => {
    if (!testSession || submitting || Object.keys(answers).length === 0) return;

    const saveInterval = setInterval(() => {
      saveDraftAnswers(testSession.id, answers);
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [testSession, answers, submitting]);

  // ============ EVENT HANDLERS ============
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNavigateQuestion = (newIndex: number) => {
    setCurrentQuestionIndex(newIndex);
    setExpandedHeader(false);
  };

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

  const handleConfirmUnanswered = () => {
    setShowUnansweredWarning(false);
    setShowConfirmModal(true);
  };

  const handleAutoSubmit = async () => {
    if (submittingRef.current) return;
    await submitTest(true);
  };

  const handleConfirmSubmit = async () => {
    await submitTest(false);
  };

  // ============ SUBMIT LOGIC ============
  const submitTest = async (isAutoSubmit: boolean) => {
    if (!testSession) return;
    if (submittingRef.current) return;
    
    setSubmitting(true);

    try {
      const currentAnswers = answersRef.current;
      const currentQuestions = questionsRef.current;

      await completeTestSession(testSession.id);

      const mcqScore = autoGradeMCQ(currentQuestions, currentAnswers);
      const totalMarks = currentQuestions.reduce((sum, q) => sum + q.marks, 0);
      const percentageScore = totalMarks > 0 ? Math.round((mcqScore / totalMarks) * 100) : 0;

      // Check for EXISTING submission
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('student_id', user.id)
        .maybeSingle();

      const submissionPayload = {
        assessment_id: assessmentId,
        student_id: user.id,
        test_session_id: testSession.id,
        answers: currentAnswers, 
        mcq_score: mcqScore,
        theory_score: null,
        total_score: percentageScore,
        is_auto_submitted: isAutoSubmit,
        submitted_at: new Date().toISOString(), // Marks as COMPLETED
      };

      let submissionId;

      if (existingSubmission) {
        const { data, error } = await supabase
          .from('submissions')
          .update(submissionPayload)
          .eq('id', existingSubmission.id)
          .select()
          .single();
        if (error) throw error;
        submissionId = data.id;
      } else {
        const { data, error } = await supabase
          .from('submissions')
          .insert(submissionPayload)
          .select()
          .single();
        if (error) throw error;
        submissionId = data.id;
      }

      await lockTestSession(testSession.id, submissionId);
      await deleteDraftAnswers(testSession.id);

      console.log('✅ Test submitted successfully');
      
      // 🟢 FIX 3: Update success state so we don't show "Time Expired" anymore
      setSubmissionSuccess(true); 

      toast.success(
        isAutoSubmit ? '✅ Time expired. Test submitted.' : '✅ Test submitted successfully!',
        {
          position: 'top-right',
          autoClose: 2000,
          onClose: () => navigate(`/results-summary/${submissionId}`),
        }
      );

      // Force redirect fallback
      if(isAutoSubmit) {
         setTimeout(() => navigate(`/results-summary/${submissionId}`), 2500);
      }

      setShowConfirmModal(false);

    } catch (error: any) {
      console.error('❌ Submit error:', error);
      
      if (isAutoSubmit) {
        toast.error("Saving... Redirecting...");
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError('Error submitting: ' + error.message);
        setSubmitting(false);
        setShowConfirmModal(false);
      }
    }
  };

  // ============ RENDER STATES ============

  if (loading) return <div className="flex justify-center items-center h-screen"><PremiumLoader message="Loading test..." /></div>;

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // 🟢 FIX 3: Only show "Time Expired" if we haven't successfully submitted yet
  if (isTimeExpired && !submissionSuccess) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Time Expired</h2>
          <p className="text-gray-600 mb-6">Submitting your answers...</p>
          
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-6">
             <div className="h-full bg-blue-600 animate-progress"></div>
          </div>

          <button 
            onClick={() => handleAutoSubmit()} 
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Stuck? Click here to retry submission
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  // ============ MAIN RENDER ============
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className={`px-4 py-3 sm:px-6 sm:py-4 border-2 ${getTimeBgColor()} transition-colors duration-300`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-gray-800 truncate">{assessment.title}</h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{assessment.subject} • U{assessment.unit}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1.5 font-mono text-lg sm:text-2xl font-bold ${getTimeColor()}`}>
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(timeLeft || 0)}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${timeLeft && timeLeft <= 300 ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
                  {getTimeStatus()}
                </span>
              </div>
            </div>
          </div>
          {/* Mobile Header */}
          <div className="md:hidden border-t border-gray-100">
            <button onClick={() => setExpandedHeader(!expandedHeader)} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Question {currentQuestionIndex + 1}/{questions.length}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedHeader ? 'rotate-180' : ''}`} />
            </button>
            {expandedHeader && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 animate-in fade-in">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-700">Progress</span>
                  <span className="text-xs font-bold text-teal-600">{getProgressPercentage()}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-teal-500" style={{ width: `${getProgressPercentage()}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Display */}
        <QuestionDisplay
          questions={questions}
          answers={answers}
          currentQuestionIndex={currentQuestionIndex}
          onAnswerChange={handleAnswerChange}
          onNavigate={handleNavigateQuestion}
          onSubmit={handleSubmitClick}
          isTimeExpired={isTimeExpired}
          submitting={submitting}
          timeLeft={timeLeft || 0}
        />
      </div>

      <ConfirmationModal
        isOpen={showUnansweredWarning}
        title="Unanswered Questions"
        message={`You have ${getUnansweredCount()} unanswered questions.`}
        confirmLabel="Submit Anyway"
        cancelLabel="Continue"
        onConfirm={handleConfirmUnanswered}
        onCancel={() => setShowUnansweredWarning(false)}
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Submit Test?"
        message="Are you sure? You cannot change answers after submitting."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={submitting}
      />

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default TestTaking;