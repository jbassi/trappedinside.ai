import React, { useState, useEffect } from 'react';
import { terminalStyles, terminalClasses } from './terminalStyles';
import { useTerminalSize } from './TerminalSizeContext';

interface LoadingSpinnerProps {}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = () => {
  const { terminalWidth } = useTerminalSize();
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
  
  const effectiveWidth = Math.max(terminalWidth, 30); // Use full terminal width with minimum
  
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 sm:space-y-4 ${terminalClasses.container} px-4 sm:px-6 md:px-2`}>
      {/* Terminal-style connecting message with dynamic # borders */}
      <div className="text-center w-full max-w-full">
        {/* Header line with centered CONNECTING TO RASPBERRY PI */}
        <div className="w-full overflow-hidden whitespace-nowrap mb-1 sm:mb-2">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
            {(() => {
              const connectingText = terminalWidth < 50 ? " CONNECTING TO PI " : " CONNECTING TO RASPBERRY PI ";
              const totalWidth = effectiveWidth;
              const textLength = connectingText.length;
              const remainingSpace = Math.max(0, totalWidth - textLength);
              const leftPadding = Math.floor(remainingSpace / 2);
              const rightPadding = remainingSpace - leftPadding;
              return "#".repeat(leftPadding) + connectingText + "#".repeat(rightPadding);
            })()}
          </span>
        </div>
        
        {/* Content lines with # borders on left and right */}
        <div className="w-full flex items-center mb-1 sm:mb-2">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
          <span className={`flex-1 px-1 sm:px-2 text-center ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
            {`[${spinnerChars[spinnerFrame]}] LOADING${'.'.repeat(dotsCount)}`}
          </span>
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
        </div>
        
        {/* Progress bar line with # borders */}
        <div className="w-full flex items-center mb-1 sm:mb-2">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
          <span className={`flex-1 px-1 sm:px-2 text-center ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
            {(() => {
              const barLength = Math.max(4, Math.floor(effectiveWidth / 8));
              const filled = Math.floor(spinnerFrame * (barLength / 4)) + 1;
              const empty = barLength - filled;
              return '█'.repeat(filled) + '░'.repeat(empty);
            })()}
          </span>
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
        </div>
        
        {/* Bottom border */}
        <div className="w-full overflow-hidden whitespace-nowrap">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
            {"#".repeat(effectiveWidth)}
          </span>
        </div>
      </div>
    </div>
  );
};
