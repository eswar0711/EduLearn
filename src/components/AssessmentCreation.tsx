import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User } from '../utils/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import NavigationSidebar from './NavigationSidebar';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


interface AssessmentCreationProps {
  user: User;
}


interface QuestionForm {
  type: 'MCQ' | 'Theory';
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
}


const AssessmentCreation: React.FC<AssessmentCreationProps> = ({ user }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(false);


  const addQuestion = (type: 'MCQ' | 'Theory') => {
    setQuestions([
      ...questions,
      {
        type,
        question_text: '',
        options: type === 'MCQ' ? ['', '', '', ''] : [],
        correct_answer: '',
        marks: 1,
      },
    ]);
  };


  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };


  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };


  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim() || !subject.trim() || !unit.trim()) {
      toast.warning('Please fill in all basic information fields', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    // Validate all questions are complete
    const incompleteQuestion = questions.findIndex(q => !q.question_text.trim());
    if (incompleteQuestion !== -1) {
      toast.error(`Question ${incompleteQuestion + 1} is missing text`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    const mcqWithoutAnswer = questions.findIndex(q => q.type === 'MCQ' && !q.correct_answer);
    if (mcqWithoutAnswer !== -1) {
      toast.error(`MCQ ${mcqWithoutAnswer + 1} is missing a correct answer`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    setLoading(true);

    try {
      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          faculty_id: user.id,
          subject,
          unit,
          title,
          duration_minutes: duration,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create questions
      const questionsToInsert = questions.map((q) => ({
        assessment_id: assessment.id,
        type: q.type,
        question_text: q.question_text,
        options: q.type === 'MCQ' ? q.options : null,
        correct_answer: q.type === 'MCQ' ? q.correct_answer : null,
        marks: q.marks,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      // Success toast with custom styling
      toast.success('🎉 Assessment created successfully!', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Navigate after toast
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      toast.error(`❌ Error: ${error.message || 'Failed to create assessment'}`, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      {/* Toast Container - renders all notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Assessment</h2>
            <p className="text-gray-600">Design a new test for your students</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Questions ({questions.length})</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addQuestion('MCQ')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add MCQ
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('Theory')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Theory
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions added yet. Click the buttons above to add questions.
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">
                          Question {qIndex + 1} ({q.type})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Text *
                          </label>
                          <textarea
                            value={q.question_text}
                            onChange={(e) =>
                              updateQuestion(qIndex, 'question_text', e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows={2}
                            required
                          />
                        </div>

                        {q.type === 'MCQ' && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((option, oIndex) => (
                                <div key={oIndex}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Option {String.fromCharCode(65 + oIndex)} *
                                  </label>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(qIndex, oIndex, e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                              ))}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correct Answer *
                              </label>
                              <select
                                value={q.correct_answer}
                                onChange={(e) =>
                                  updateQuestion(qIndex, 'correct_answer', e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select correct answer</option>
                                {q.options.map((option, oIndex) => (
                                  <option key={oIndex} value={option}>
                                    {String.fromCharCode(65 + oIndex)}: {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}

                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marks *
                          </label>
                          <input
                            type="number"
                            value={q.marks}
                            onChange={(e) =>
                              updateQuestion(qIndex, 'marks', parseInt(e.target.value))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCreation;