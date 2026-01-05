import React from 'react';

interface PremiumLoaderProps {
  message?: string;
  fullHeight?: boolean;
}

const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  message = 'Loading...',
  fullHeight = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullHeight ? 'min-h-screen' : 'min-h-96'
      } bg-gray-50`}
    >
      {/* Loader */}
      <div className="relative w-16 h-16 mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin-slow" />

        {/* Inner pulse */}
        <div className="absolute inset-3 rounded-full bg-gray-500/10 animate-pulse" />

        {/* Center dot */}
        <div className="absolute inset-6 rounded-full bg-indigo-300 shadow-sm" />
      </div>

      {/* Message */}
      <p className="text-base font-medium text-gray-700 mb-2">
        {message}
      </p>

      {/* Subtext */}
      <p className="text-xs text-gray-500 tracking-wide animate-fade">
        Please wait a moment
      </p>

      {/* Progress bar */}
      <div className="mt-6 w-44 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-loader-bar" />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes loaderBar {
          0% {
            transform: translateX(-100%);
          }
          60% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-loader-bar {
          animation: loaderBar 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin 1.6s linear infinite;
        }

        .animate-fade {
          animation: fade 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PremiumLoader;
