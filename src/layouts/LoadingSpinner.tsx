import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullHeight?: boolean;
}

/**
 * Professional centered loading spinner with animation
 * 
 * Usage:
 * <LoadingSpinner message="Loading..." />
 * <LoadingSpinner message="Loading analytics..." fullHeight />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  fullHeight = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullHeight ? 'min-h-screen' : 'min-h-86'
      } bg-gray-50`}
    >
      {/* Animated spinner */}
      <div className="relative w-10 h-10 mb-6">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-gray-200"
          style={{
            animation: 'spin 3s linear infinite',
          }}
        />

        {/* Inner animated ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-500"
          style={{
            animation: 'spin 1.5s linear infinite',
          }}
        />

        {/* Center dot */}
        {/* <div className="absolute inset-2 rounded-full border-2 border-blue-300 opacity-50" /> */}
      </div>

      {/* Loading text */}
      <p className="text-base font-medium text-gray-700 mb-2">{message}</p>
      <p className="text-sm text-gray-500">Please wait...</p>

      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        <span
          className="w-2 h-2 bg-blue-600 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0s',
          }}
        />
        <span
          className="w-2 h-2 bg-blue-600 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.2s',
          }}
        />
        <span
          className="w-2 h-2 bg-blue-600 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.4s',
          }}
        />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;