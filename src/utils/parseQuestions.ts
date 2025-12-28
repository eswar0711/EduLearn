
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParseResult, ValidationError, ParsedQuestion } from '../hooks/bulkUpload';
import {
  validateHeaders,
  validateQuestion,
  normalizeQuestion,
  buildValidationError,
} from './validateQuestion';

/**
 * Parse CSV file
 */
const parseCSV = (file: File): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.data.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        resolve(results.data as Record<string, any>[]);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
};

/**
 * Parse Excel file
 */
const parseExcel = (file: File): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Read only first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file has no sheets'));
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          reject(new Error('Excel sheet is empty'));
          return;
        }

        resolve(jsonData as Record<string, any>[]);
      } catch (error: any) {
        reject(new Error(`Excel parsing error: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Main parsing function - handles CSV and Excel
 */
export const parseQuestionsFile = async (file: File): Promise<ParseResult> => {
  // Validate file type
  const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
  const isExcel =
    file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.name.endsWith('.xlsx');

  if (!isCsv && !isExcel) {
    throw new Error('Unsupported file format. Please upload CSV or Excel (.xlsx) file');
  }

  // Validate file size (2 MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 2 MB limit');
  }

  let rows: Record<string, any>[] = [];

  try {
    if (isCsv) {
      rows = await parseCSV(file);
    } else if (isExcel) {
      rows = await parseExcel(file);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to parse file');
  }

  // Validate headers
  const headers = Object.keys(rows[0] || {});
  const headerValidation = validateHeaders(headers);

  if (!headerValidation.valid) {
    throw new Error(
      `Missing required columns: ${headerValidation.missing.join(', ')}\n\nRequired columns: question_text, option_a, option_b, option_c, option_d, correct_answer, marks`
    );
  }

  // Process each row
  const validQuestions: ParsedQuestion[] = [];
  const invalidQuestions: ValidationError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because header is row 1, data starts at row 2

    const validation = validateQuestion(row);

    if (validation.valid) {
      const normalized = normalizeQuestion(row);
      if (normalized) {
        // Set the rowNumber after normalization
        normalized.rowNumber = rowNumber;
        validQuestions.push(normalized);
      }
    } else {
      const error = buildValidationError(row, rowNumber, validation.errors);
      invalidQuestions.push(error);
    }
  });

  return {
    validQuestions,
    invalidQuestions,
    totalRows: rows.length,
  };
};

/**
 * Convert parsed questions to QuestionForm format for AssessmentCreation
 * The correct_answer value is already set to the actual text during normalization
 */
export const convertToQuestionForm = (parsedQuestion: ParsedQuestion) => {
  return {
    type: 'MCQ' as const,
    question_text: parsedQuestion.question_text,
    options: [
      parsedQuestion.option_a,
      parsedQuestion.option_b,
      parsedQuestion.option_c,
      parsedQuestion.option_d,
    ],
    correct_answer: parsedQuestion.correct_answer,
    marks: parsedQuestion.marks,
  };
};