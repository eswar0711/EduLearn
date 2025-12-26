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

  // Calculate progress percentage
  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  };

  // Determine if current question is answered
  const isCurrentAnswered = !!answers[currentQuestion.id];

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* ✅ TOP CONTROL BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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

      {/* ✅ MAIN CONTENT AREA - COMPACT & SINGLE PAGE */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* PROGRESS BAR */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Progress
              </div>
              <div className="text-xs font-semibold text-slate-600">
                {Math.round(getProgressPercentage())}%
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* QUESTION SECTION - COMPACT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQuestion.question_text}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold whitespace-nowrap">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {currentQuestion.type}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold whitespace-nowrap">
                    {currentQuestion.marks}
                    {currentQuestion.marks === 1 ? ' Mark' : ' Marks'}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Body */}
            <div className="px-6 py-5">
              {/* ✅ MCQ OPTIONS */}
              {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
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
                      <div className="ml-4 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-slate-900 text-base">
                            {String.fromCharCode(65 + oIndex)}.
                          </span>
                          <span className="text-slate-700 text-base leading-relaxed">
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
                // ✅ TEXTAREA FOR THEORY QUESTIONS
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Your Answer
                  </label>
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) =>
                      onAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none transition-all"
                    rows={6}
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

          {/* STATUS INDICATOR */}
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="flex items-center gap-2">
              {isCurrentAnswered ? (
                <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-green-200">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  ✓ Answered
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-amber-200">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  ○ Not Answered
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ BOTTOM NAVIGATION BAR - FIXED */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 sticky bottom-0 z-20 shadow-lg">
        <div className="max-w-5xl mx-auto">
          {/* QUICK JUMP GRID */}
          {showJumpMenu && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: totalQuestions }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleJumpToQuestion(idx + 1)}
                    className={`p-2 rounded text-xs font-bold transition-all ${
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

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between gap-4">
            {/* PREVIOUS BUTTON */}
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion || submitting || isTimeExpired}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800 rounded-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* JUMP TO QUESTION BUTTON */}
            <button
              onClick={() => setShowJumpMenu(!showJumpMenu)}
              className={`px-4 py-2.5 rounded-lg transition-all font-semibold text-sm shadow-sm ${
                showJumpMenu
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Jump ({currentQuestionIndex + 1}/{totalQuestions})
            </button>

            {/* NEXT OR SUBMIT BUTTON */}
            {!isLastQuestion ? (
              <button
                onClick={handleNext}
                disabled={submitting || isTimeExpired}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={submitting || isTimeExpired}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;