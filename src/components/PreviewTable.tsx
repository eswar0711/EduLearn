
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ParsedQuestion } from '../hooks/bulkUpload';

interface PreviewTableProps {
  questions: ParsedQuestion[];
  onRemoveQuestion: (rowNumber: number) => void;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ questions, onRemoveQuestion }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Question</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Correct Answer</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700">Marks</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {questions.map((q, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600 font-medium">{idx + 1}</td>
              <td className="px-4 py-3 text-gray-800">
                <div className="max-w-md truncate">{q.question_text}</div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  <div>A: {q.option_a}</div>
                  <div>B: {q.option_b}</div>
                  <div>C: {q.option_c}</div>
                  <div>D: {q.option_d}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-800 font-medium">
                {q.correct_answer === q.option_a && 'A'}
                {q.correct_answer === q.option_b && 'B'}
                {q.correct_answer === q.option_c && 'C'}
                {q.correct_answer === q.option_d && 'D'}
              </td>
              <td className="px-4 py-3 text-center text-gray-800 font-medium">{q.marks}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onRemoveQuestion(q.rowNumber)}
                  className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewTable;