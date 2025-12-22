// src/components/ScoreCalculator/MidExamCalc.tsx
import React, { useState } from 'react';

const MidExamCalc: React.FC = () => {
  const [marksObtained, setMarksObtained] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const marks = parseFloat(marksObtained);
    if (isNaN(marks) || marks < 0 || marks > 20) {
      alert('Please enter a valid mark between 0 and 20');
      return;
    }
    const percentage = (marks / 20) * 100;
    setResult(parseFloat(percentage.toFixed(2)));
  };

  const reset = () => {
    setMarksObtained('');
    setResult(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Mid-Exam Percentage Calculator</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Marks Obtained (out of 20)
        </label>
        <input
          type="number"
          placeholder="Enter marks"
          value={marksObtained}
          onChange={(e) => setMarksObtained(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          max="20"
          step="0.5"
        />
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={calculate}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Calculate
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
        >
          Reset
        </button>
      </div>

      {result !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Result</h3>
          <p className="text-gray-700 text-lg">
            <span className="font-medium">Percentage:</span> {result}%
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Grade: {result >= 90 ? 'A+' : result >= 80 ? 'A' : result >= 70 ? 'B' : result >= 60 ? 'C' : result >= 50 ? 'D' : 'F'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MidExamCalc;
