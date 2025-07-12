import React, { useState, useEffect } from 'react';
import { terminalStyles, terminalClasses } from './terminalStyles';

interface LoadingSpinnerProps {
  terminalWidth?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ terminalWidth = 80 }) => {
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [dotsCount, setDotsCount] = useState(0);
  
  // Classic terminal spinner characters
  const spinnerChars = ['|', '/', '-', '\\'];
  
  useEffect(() => {
    const spinnerInterval = setInterval(() => {
      setSpinnerFrame(prev => (prev + 1) % spinnerChars.length);
    }, 150);
    
    const dotsInterval = setInterval(() => {
      setDotsCount(prev => (prev + 1) % 4);
    }, 500);
    
    return () => {
      clearInterval(spinnerInterval);
      clearInterval(dotsInterval);
    };
  }, []);
  
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${terminalClasses.container}`}>
      {/* Terminal-style connecting message with dynamic # borders */}
      <div className="text-center">
        {/* Header line with centered CONNECTING TO RASPBERRY PI */}
        <div className="w-full overflow-hidden whitespace-nowrap mb-2">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
            {(() => {
              const connectingText = " CONNECTING TO RASPBERRY PI ";
              const totalWidth = Math.max(60, terminalWidth);
              const textLength = connectingText.length;
              const remainingSpace = totalWidth - textLength;
              const leftPadding = Math.floor(remainingSpace / 2);
              const rightPadding = remainingSpace - leftPadding;
              return "#".repeat(leftPadding) + connectingText + "#".repeat(rightPadding);
            })()}
          </span>
        </div>
        
        {/* Content lines with # borders on left and right */}
        <div className="w-full flex items-center mb-2">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
          <span className={`flex-1 px-2 text-center ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
            [{spinnerChars[spinnerFrame]}] LOADING{'.'.repeat(dotsCount)}
          </span>
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
        </div>
        
        {/* Progress bar line with # borders */}
        <div className="w-full flex items-center mb-2">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
          <span className={`flex-1 px-2 text-center ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
            {'█'.repeat(Math.floor(spinnerFrame * 2) + 1)}{'░'.repeat(7 - Math.floor(spinnerFrame * 2))}
          </span>
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
        </div>
        
        {/* Bottom border */}
        <div className="w-full overflow-hidden whitespace-nowrap">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
            {"#".repeat(Math.max(60, terminalWidth))}
          </span>
        </div>
      </div>
    </div>
  );
};
