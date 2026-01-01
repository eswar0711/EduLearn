import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import type { Question } from '../../utils/supabaseClient';

interface QuestionDisplayProps {
  questions: Question[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  onAnswerChange: (questionId: string, answer: string) => void;
  onNavigate: (newIndex: number) => void;
  onSubmit: () => void;
  isTimeExpired: boolean;
  submitting: boolean;
  timeLeft: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questions,
  answers,
  currentQuestionIndex,
  onAnswerChange,
  onNavigate,
  onSubmit,
  isTimeExpired,
  submitting,
}) => {
  const [showJumpMenu, setShowJumpMenu] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // Navigate to previous question
  const handlePrevious = () => {
    if (!isFirstQuestion) {
      onNavigate(currentQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (!isLastQuestion) {
      onNavigate(currentQuestionIndex + 1);
    }
  };

  // Jump to specific question
  const handleJumpToQuestion = (questionNumber: number) => {
    if (questionNumber >= 1 && questionNumber <= totalQuestions) {
      onNavigate(questionNumber - 1);
      setShowJumpMenu(false);
    }
  };

  // // Calculate progress percentage
  // const getProgressPercentage = () => {
  //   return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  // };

  // Determine if current question is answered
  const isCurrentAnswered = !!answers[currentQuestion.id];

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* ✅ TOP CONTROL BAR - MOBILE OPTIMIZED */}
      <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 md:py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto">
          {/* MOBILE: STACKED LAYOUT */}
          <div className="md:hidden flex flex-col gap-2">
            {/* Row 1: Title */}
            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold text-slate-900">Assessment</h1>
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                Q {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            </div>
            
            {/* Row 2: Answer Count */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium text-xs">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>
          </div>

          {/* DESKTOP: HORIZONTAL LAYOUT */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900">Assessment</h1>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>

            <div className="text-right text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ PROGRESS BAR - VISIBLE ON MOBILE */}
      {/* <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-2 md:py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Progress
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {Math.round(getProgressPercentage())}%
            </div>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div> */}

      {/* ✅ MAIN CONTENT AREA - MOBILE OPTIMIZED */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6">
        <div className="max-w-5xl mx-auto">
          {/* QUESTION SECTION - COMPACT */}
          <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4 md:mb-5">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-3 md:py-4 border-b border-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug break-words">
                    {currentQuestion.question_text}
                  </h2>
                </div>
                
                {/* BADGES - STACKED ON MOBILE, INLINE ON DESKTOP */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-600 rounded-full"></span>
                    {currentQuestion.type}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap">
                    {currentQuestion.marks}
                    {currentQuestion.marks === 1 ? ' M' : ' M'}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Body */}
            <div className="px-4 md:px-6 py-4 md:py-5">
              {/* ✅ MCQ OPTIONS - MOBILE OPTIMIZED */}
              {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
                <div className="space-y-2 md:space-y-2.5">
                  {currentQuestion.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-start p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        answers[currentQuestion.id] === option
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      } ${isTimeExpired ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) =>
                          onAnswerChange(currentQuestion.id, e.target.value)
                        }
                        className="w-5 h-5 text-blue-600 cursor-pointer mt-0.5 flex-shrink-0"
                        disabled={isTimeExpired}
                      />
                      <div className="ml-3 md:ml-4 flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-slate-900 text-sm md:text-base flex-shrink-0">
                            {String.fromCharCode(65 + oIndex)}.
                          </span>
                          <span className="text-slate-700 text-sm md:text-base leading-relaxed break-words">
                            {option}
                          </span>
                        </div>
                      </div>
                      {answers[currentQuestion.id] === option && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                // ✅ TEXTAREA FOR THEORY QUESTIONS - MOBILE OPTIMIZED
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2 md:mb-3">
                    Your Answer
                  </label>
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) =>
                      onAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs md:text-sm resize-none transition-all"
                    rows={5}
                    placeholder="Type your answer here..."
                    disabled={isTimeExpired}
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    {answers[currentQuestion.id]?.length || 0} characters
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STATUS INDICATOR - MOBILE OPTIMIZED */}
          <div className="flex items-center justify-between gap-2 mb-4 md:mb-5 px-1">
            <div className="flex items-center gap-2 min-w-0">
              {isCurrentAnswered ? (
                <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold border border-green-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-600 rounded-full"></span>
                  ✓ Answered
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold border border-amber-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-600 rounded-full"></span>
                  ○ Not Answered
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ BOTTOM NAVIGATION BAR - MOBILE OPTIMIZED */}
      <div className="bg-white border-t border-slate-200 px-3 md:px-6 py-3 md:py-4 sticky bottom-0 z-20 shadow-lg">
        <div className="max-w-5xl mx-auto">
          {/* QUICK JUMP GRID - MOBILE RESPONSIVE */}
          {showJumpMenu && (
            <div className="mb-3 md:mb-4 p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(32px, 1fr))` }}>
                {Array.from({ length: totalQuestions }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleJumpToQuestion(idx + 1)}
                    className={`p-1.5 md:p-2 rounded text-xs font-bold transition-all ${
                      idx === currentQuestionIndex
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                        : answers[questions[idx].id]
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                    title={`Question ${idx + 1}${answers[questions[idx].id] ? ' (answered)' : ''}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS - MOBILE OPTIMIZED */}
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* PREVIOUS BUTTON */}
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion || submitting || isTimeExpired}
              className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800 rounded-lg transition-all font-semibold text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {/* JUMP TO QUESTION BUTTON */}
            <button
              onClick={() => setShowJumpMenu(!showJumpMenu)}
              className={`px-2 md:px-4 py-2 md:py-2.5 rounded-lg transition-all font-semibold text-xs md:text-sm shadow-sm whitespace-nowrap ${
                showJumpMenu
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="hidden sm:inline">Jump</span>
              <span className="sm:hidden">J</span>
            </button>

            {/* NEXT OR SUBMIT BUTTON */}
            {!isLastQuestion ? (
              <button
                onClick={handleNext}
                disabled={submitting || isTimeExpired}
                className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-all font-semibold text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Nxt</span>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={submitting || isTimeExpired}
                className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg transition-all font-semibold text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{submitting ? 'Submitting...' : 'Submit'}</span>
                <span className="sm:hidden">{submitting ? '...' : 'Submit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;