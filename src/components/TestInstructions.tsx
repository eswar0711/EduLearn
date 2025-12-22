// src/components/TestInstructions.tsx
import React from 'react';
import { AlertCircle, CheckCircle, Clock, BookOpen } from 'lucide-react';

interface TestInstructionsProps {
  assessmentTitle: string;
  duration: number;
  onAgree: () => void;
  onCancel: () => void;
}

const TestInstructions: React.FC<TestInstructionsProps> = ({
  assessmentTitle,
  duration,
  onAgree,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Test Instructions</h2>
          </div>
          <p className="text-blue-100">Please read carefully before starting</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Assessment Info */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p className="text-gray-700">
              <strong>Assessment:</strong> <span className="text-blue-700">{assessmentTitle}</span>
            </p>
            <p className="text-gray-700 mt-1">
              <strong>Duration:</strong> <span className="text-blue-700">{duration} minutes</span>
            </p>
          </div>

          {/* Important Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Important Notes
            </h3>

            <div className="space-y-3">
              {/* Note 1: Auto Submission */}
              <div className="flex gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Auto-Submission</p>
                  <p className="text-red-800 text-sm mt-1">
                    Your test will be <strong>automatically submitted</strong> once the time limit is reached. You cannot submit after the timer expires.
                  </p>
                </div>
              </div>

              {/* Note 2: Score Validity */}
              <div className="flex gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900">Score Validity</p>
                  <p className="text-orange-800 text-sm mt-1">
                    Your score is <strong>ONLY VALID</strong> if you submit before the time expires. Late submissions are not accepted and will be marked as invalid.
                  </p>
                </div>
              </div>

              {/* Note 3: Timer Warning */}
              <div className="flex gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-600 mt-1" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-900">Timer Management</p>
                  <p className="text-yellow-800 text-sm mt-1">
                    Your timer is <strong>server-managed</strong> and secure. Refreshing the page will NOT reset your time. Always keep track of remaining time.
                  </p>
                </div>
              </div>

              {/* Note 4: Technical */}
              <div className="flex gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-1" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">Technical Requirements</p>
                  <p className="text-purple-800 text-sm mt-1">
                    Ensure you have a stable internet connection. Network interruptions may affect your test. Answer carefully before submitting.
                  </p>
                </div>
              </div>

              {/* Note 5: Best of Luck */}
              <div className="flex gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Good Luck! 🎉</p>
                  <p className="text-green-800 text-sm mt-1">
                    Do your best and answer all questions carefully. You have {duration} minutes to complete this assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox Agreement */}
          {/* <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="agree"
              className="w-4 h-4 mt-1 cursor-pointer"
              required
            />
            <label htmlFor="agree" className="text-gray-700 cursor-pointer text-sm">
              I understand the instructions and agree to the test conditions. I will complete this test within the given time and will not attempt to bypass the timer.
            </label>
          </div> */}

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel Test
            </button>
            <button
              onClick={onAgree}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              I Agree & Start Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
