import type { Question } from './supabaseClient';

/**
 * Auto-grade MCQ questions by comparing student answers with correct answers
 * @param questions - Array of questions from the assessment
 * @param studentAnswers - Object mapping question IDs to student answers
 * @returns Total MCQ score
 */
export const autoGradeMCQ = (
  questions: Question[],
  studentAnswers: Record<string, string>
): number => {
  let mcqScore = 0;

  questions.forEach((question) => {
    // Only grade MCQ questions
    if (question.type === 'MCQ' && question.correct_answer) {
      const studentAnswer = studentAnswers[question.id];
      
      // Compare student answer with correct answer (case-insensitive)
      if (
        studentAnswer &&
        studentAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
      ) {
        mcqScore += question.marks;
      }
    }
  });

  return mcqScore;
};

/**
 * Calculate total marks for an assessment
 * @param questions - Array of questions
 * @returns Total possible marks
 */
export const calculateTotalMarks = (questions: Question[]): number => {
  return questions.reduce((total, question) => total + question.marks, 0);
};

/**
 * Calculate MCQ marks only
 * @param questions - Array of questions
 * @returns Total MCQ marks
 */
export const calculateMCQMarks = (questions: Question[]): number => {
  return questions
    .filter((q) => q.type === 'MCQ')
    .reduce((total, question) => total + question.marks, 0);
};

/**
 * Calculate Theory marks only
 * @param questions - Array of questions
 * @returns Total Theory marks
 */
export const calculateTheoryMarks = (questions: Question[]): number => {
  return questions
    .filter((q) => q.type === 'Theory')
    .reduce((total, question) => total + question.marks, 0);
};