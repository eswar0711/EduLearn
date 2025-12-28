
import type { ParsedQuestion, ValidationError } from '../hooks/bulkUpload';

const REQUIRED_HEADERS = [
  'question_text',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'marks',
];

/**
 * Validate CSV headers
 */
export const validateHeaders = (headers: string[]): { valid: boolean; missing: string[] } => {
  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Validate individual question row
 */
export const validateQuestion = (
  row: Record<string, any>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate question_text
  if (!row.question_text || typeof row.question_text !== 'string' || !row.question_text.trim()) {
    errors.push('Question text is required and cannot be empty');
  }

  // Validate options exist and are not empty
  const options = ['option_a', 'option_b', 'option_c', 'option_d'];
  options.forEach(opt => {
    if (!row[opt] || typeof row[opt] !== 'string' || !row[opt].trim()) {
      errors.push(`${opt.toUpperCase()} is required and cannot be empty`);
    }
  });

  // Check for duplicate options
  const optionValues = options.map(opt => row[opt]?.trim().toLowerCase()).filter(Boolean);
  if (new Set(optionValues).size !== optionValues.length) {
    errors.push('Options cannot be duplicate');
  }

  // Validate correct_answer
  const correctAnswer = row.correct_answer?.trim();
  if (!correctAnswer) {
    errors.push('Correct answer is required');
  } else {
    // Check if correctAnswer matches any of the option VALUES
    const optionTexts = options.map(opt => row[opt]?.trim());
    const matchesOptionValue = optionTexts.some(
      optText => optText && optText.toLowerCase() === correctAnswer.toLowerCase()
    );

    if (!matchesOptionValue) {
      errors.push(
        `Correct answer "${correctAnswer}" does not match any of the provided options (A: ${row.option_a}, B: ${row.option_b}, C: ${row.option_c}, D: ${row.option_d})`
      );
    }
  }

  // Validate marks
  const marks = parseInt(row.marks, 10);
  if (isNaN(marks) || marks < 1) {
    errors.push('Marks must be a positive integer (>= 1)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Process and normalize a question row
 */
export const normalizeQuestion = (
  row: Record<string, any>
): ParsedQuestion | null => {
  const validation = validateQuestion(row);

  if (!validation.valid) {
    return null;
  }

  // Get the correct answer value
  const correctAnswerValue = row.correct_answer.trim();

  return {
    question_text: row.question_text.trim(),
    option_a: row.option_a.trim(),
    option_b: row.option_b.trim(),
    option_c: row.option_c.trim(),
    option_d: row.option_d.trim(),
    correct_answer: correctAnswerValue,
    marks: parseInt(row.marks, 10),
    rowNumber: 0,
  };
};

/**
 * Build validation error object
 */
export const buildValidationError = (
  row: Record<string, any>,
  rowNumber: number,
  errors: string[]
): ValidationError => {
  return {
    rowNumber,
    question_text: row.question_text?.trim() || '(No question text)',
    errors,
  };
};