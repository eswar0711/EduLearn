
import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { parseQuestionsFile } from '../utils/parseQuestions';
import type { ParsedQuestion, ValidationError, QuestionFormData } from '../hooks/bulkUpload';
import PreviewTable from './PreviewTable';

interface BulkUploadModalProps {
  onClose: () => void;
  onQuestionsAdded: (questions: QuestionFormData[]) => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onClose, onQuestionsAdded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<{
    validQuestions: ParsedQuestion[];
    invalidQuestions: ValidationError[];
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);

    try {
      const result = await parseQuestionsFile(file);

      if (result.validQuestions.length === 0 && result.invalidQuestions.length > 0) {
        setError('No valid questions found in the file. Please check the errors below.');
      }

      setParseResult({
        validQuestions: result.validQuestions,
        invalidQuestions: result.invalidQuestions,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
      setParseResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = (rowNumber: number) => {
    if (parseResult) {
      setParseResult({
        ...parseResult,
        validQuestions: parseResult.validQuestions.filter(q => q.rowNumber !== rowNumber),
      });
    }
  };

  const handleConfirmUpload = () => {
    if (!parseResult || parseResult.validQuestions.length === 0) {
      setError('No valid questions to upload');
      return;
    }

    // Convert parsed questions to QuestionFormData
    const questionsToAdd: QuestionFormData[] = parseResult.validQuestions.map(pq => ({
      type: 'MCQ' as const,
      question_text: pq.question_text,
      options: [pq.option_a, pq.option_b, pq.option_c, pq.option_d],
      correct_answer: pq.correct_answer,
      marks: pq.marks,
    }));

    onQuestionsAdded(questionsToAdd);
  };

  const handleReset = () => {
    setParseResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Bulk Upload MCQs</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!parseResult ? (
            // Upload Section
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-800 mb-1">
                  Drop your CSV or Excel file here
                </p>
                <p className="text-sm text-gray-600 mb-4">or click to browse</p>

                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.xlsx"
                  onChange={handleFileInput}
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-medium transition-colors ${
                    loading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-purple-700 cursor-pointer'
                  }`}
                >
                  {loading ? 'Parsing...' : 'Select File'}
                </label>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Required Format:</p>
                  <div className="text-xs text-blue-800 space-y-1 font-mono">
                    <p>Columns: question_text, option_a, option_b, option_c, option_d, correct_answer, marks</p>
                    <p className="mt-2 text-blue-700">
                      Supported formats: CSV (.csv), Excel (.xlsx)
                    </p>
                    <p className="text-blue-700">Max file size: 2 MB</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Error:</p>
                    <p className="whitespace-pre-wrap">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Preview Section
            <div className="space-y-6">
              {/* Success Summary */}
              {parseResult.validQuestions.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">
                      ✅ {parseResult.validQuestions.length} valid question(s) ready to upload
                    </p>
                  </div>
                </div>
              )}

              {/* Error Summary */}
              {parseResult.invalidQuestions.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-semibold text-yellow-900 mb-3">
                    ⚠️ {parseResult.invalidQuestions.length} invalid question(s) (skipped):
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parseResult.invalidQuestions.map((inv, idx) => (
                      <div key={idx} className="text-sm text-yellow-800 bg-white p-2 rounded border border-yellow-100">
                        <p className="font-medium">Row {inv.rowNumber}: {inv.question_text}</p>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                          {inv.errors.map((err, errIdx) => (
                            <li key={errIdx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parseResult.validQuestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Preview</h3>
                  <PreviewTable
                    questions={parseResult.validQuestions}
                    onRemoveQuestion={handleRemoveQuestion}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    You can remove individual questions before confirming upload
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Error:</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          {!parseResult ? (
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Upload Another File
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={parseResult.validQuestions.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  parseResult.validQuestions.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Upload ({parseResult.validQuestions.length})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;