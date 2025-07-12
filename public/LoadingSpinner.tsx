import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-900 border-solid rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-green-400 rounded-full animate-spin"></div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="text-green-400 font-mono text-lg">
        <span className="animate-pulse">Connecting to terminal...</span>
      </div>
      
      {/* Dots animation */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
      </div>
    </div>
  );
};
