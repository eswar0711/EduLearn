
export interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  rowNumber: number; // For error reporting
}

export interface ValidationError {
  rowNumber: number;
  question_text?: string;
  errors: string[];
}

export interface ParseResult {
  validQuestions: ParsedQuestion[];
  invalidQuestions: ValidationError[];
  totalRows: number;
}

export interface QuestionFormData {
  type: 'MCQ' | 'Theory';
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
}