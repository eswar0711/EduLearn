// src/components/ScoreCalculator/AttendanceCalc.tsx
import React, { useState } from 'react';

const AttendanceCalc: React.FC = () => {
  const [totalClasses, setTotalClasses] = useState('');
  const [attendedClasses, setAttendedClasses] = useState('');
  const [result, setResult] = useState<{ percentage: number; status: string } | null>(null);

  const calculate = () => {
    const total = parseFloat(totalClasses);
    const attended = parseFloat(attendedClasses);

    if (isNaN(total) || isNaN(attended) || total <= 0 || attended < 0 || attended > total) {
      alert('Please enter valid values');
      return;
    }

    const percentage = (attended / total) * 100;
    const status = percentage >= 75 ? 'Good Standing' : percentage >= 65 ? 'Warning' : 'At Risk';
    
    setResult({ percentage: parseFloat(percentage.toFixed(2)), status });
  };

  const reset = () => {
    setTotalClasses('');
    setAttendedClasses('');
    setResult(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Attendance Percentage Calculator</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Total Classes Conducted
          </label>
          <input
            type="number"
            placeholder="Enter total classes"
            value={totalClasses}
            onChange={(e) => setTotalClasses(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Classes Attended
          </label>
          <input
            type="number"
            placeholder="Enter attended classes"
            value={attendedClasses}
            onChange={(e) => setAttendedClasses(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>
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

      {result && (
        <div className={`rounded-lg p-4 border ${
          result.percentage >= 75 
            ? 'bg-green-50 border-green-200' 
            : result.percentage >= 65 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            result.percentage >= 75 
              ? 'text-green-900' 
              : result.percentage >= 65 
              ? 'text-yellow-900' 
              : 'text-red-900'
          }`}>
            Attendance Result
          </h3>
          <p className="text-gray-700 text-lg">
            <span className="font-medium">Percentage:</span> {result.percentage}%
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Status:</span> {result.status}
          </p>
          {result.percentage < 75 && (
            <p className="text-sm text-gray-600 mt-2">
              ⚠️ You need {Math.ceil((0.75 * parseFloat(totalClasses)) - parseFloat(attendedClasses))} more classes to reach 75%
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceCalc;
