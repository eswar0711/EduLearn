// src/components/ScoreCalculator/ScoreCalculatorModule.tsx
import React, { useState } from 'react';
import AssignmentScoreCalc from './AssignmentScoreCalc';
import MidExamCalc from './MidExamCalc';
import AttendanceCalc from './AttendanceCalc';
import { useNavigate } from 'react-router-dom';

type CalculatorType = 'assignment' | 'midexam' | 'attendance';

const ScoreCalculatorModule: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>('assignment');
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Score Calculator</h1>
        <p className="text-gray-600 mb-6">
          Calculate your academic performance metrics accurately
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveCalc('assignment')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCalc === 'assignment'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Assignment Scores
          </button>
          <button
            onClick={() => setActiveCalc('midexam')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCalc === 'midexam'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Mid-Exam
          </button>
          <button
            onClick={() => setActiveCalc('attendance')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCalc === 'attendance'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Attendance
          </button>
        </div>

        {/* Active Calculator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeCalc === 'assignment' && <AssignmentScoreCalc />}
          {activeCalc === 'midexam' && <MidExamCalc />}
          {activeCalc === 'attendance' && <AttendanceCalc />}
        </div>
      </div>

      {/* Back to Dashboard Button */}
      <div className="flex-1 flex flex-col justify-end items-center">
        <button
          onClick={() => navigate('/')}
          className="mt-10 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ScoreCalculatorModule;
