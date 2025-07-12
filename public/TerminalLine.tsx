import React from 'react';
import { terminalStyles, terminalClasses } from './terminalStyles';

interface TerminalLineProps {
  line: string;
  isLastLine: boolean;
  cursorVisible: boolean;
  prompt: string;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({ 
  line, 
  isLastLine, 
  cursorVisible, 
  prompt 
}) => {
  const isPromptLine = line.startsWith(prompt);
  const lineContent = isPromptLine ? line.slice(prompt.length) : line;
  const showCursor = isLastLine; // Always show cursor on last line

  return (
    <div className="flex items-start min-h-[1.5em]">
      <span className={`${terminalClasses.baseText} select-none`} style={terminalStyles.baseText}>
        {isPromptLine ? prompt.trim() : ""}
      </span>
      <span className={`ml-2 whitespace-pre-line ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
        {lineContent}
        {showCursor && (
          <span className={`${terminalClasses.baseText} ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} style={terminalStyles.baseText}>
            █
          </span>
        )}
      </span>
    </div>
  );
};
