// src/components/ScoreCalculator/AssignmentScoreCalc.tsx
import React, { useState } from 'react';
import CalculatorCard from './CalculatorCard';

interface Assignment {
  id: number;
  score: string;
  maxScore: string;
}

const AssignmentScoreCalc: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: 1, score: '', maxScore: '' }
  ]);
  const [result, setResult] = useState<{ average: number; percentage: number } | null>(null);

  const addAssignment = () => {
    setAssignments([...assignments, { id: Date.now(), score: '', maxScore: '' }]);
  };

  const removeAssignment = (id: number) => {
    if (assignments.length > 1) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const updateAssignment = (id: number, field: 'score' | 'maxScore', value: string) => {
    setAssignments(
      assignments.map(a => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const calculate = () => {
    const valid = assignments.filter(a => a.score && a.maxScore);
    if (valid.length === 0) {
      alert('Please enter at least one assignment score');
      return;
    }

    const totalScore = valid.reduce((sum, a) => sum + parseFloat(a.score), 0);
    const totalMaxScore = valid.reduce((sum, a) => sum + parseFloat(a.maxScore), 0);
    
    const average = totalScore / valid.length;
    const percentage = (totalScore / totalMaxScore) * 100;

    setResult({ average: parseFloat(average.toFixed(2)), percentage: parseFloat(percentage.toFixed(2)) });
  };

  const reset = () => {
    setAssignments([{ id: 1, score: '', maxScore: '' }]);
    setResult(null);
  };

  return (
    <CalculatorCard title="Assignment Score Calculator">
      <div className="space-y-3 mb-4">
        {assignments.map((assignment, index) => (
          <div key={assignment.id} className="flex gap-3 items-center">
            <span className="text-gray-600 w-24">Assignment {index + 1}</span>
            <input
              type="number"
              placeholder="Score"
              value={assignment.score}
              onChange={(e) => updateAssignment(assignment.id, 'score', e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">out of</span>
            <input
              type="number"
              placeholder="Max"
              value={assignment.maxScore}
              onChange={(e) => updateAssignment(assignment.id, 'maxScore', e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {assignments.length > 1 && (
              <button
                onClick={() => removeAssignment(assignment.id)}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={addAssignment}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          + Add Assignment
        </button>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Results</h3>
          <p className="text-gray-700">
            <span className="font-medium">Average Score:</span> {result.average}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Overall Percentage:</span> {result.percentage}%
          </p>
        </div>
      )}
    </CalculatorCard>
  );
};

export default AssignmentScoreCalc;
