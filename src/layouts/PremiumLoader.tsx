import React from 'react';

interface DotLoaderProps {
  message?: string;
  fullHeight?: boolean;
}

const DotLoader: React.FC<DotLoaderProps> = ({
  message = 'Loading...',
  fullHeight = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullHeight ? 'min-h-screen' : 'min-h-96'
      } bg-gray-50`}
    >
      {/* Dots */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" />
      </div>

      {/* Text */}
      <p className="text-sm font-medium text-gray-700">
        {message}
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Please wait
      </p>
    </div>
  );
};

export default DotLoader;
