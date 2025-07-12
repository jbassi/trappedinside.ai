import React from 'react';

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
      <span className="text-green-400 select-none">{isPromptLine ? prompt.trim() : ""}</span>
      <span className="ml-2 whitespace-pre-line text-green-400">
        {lineContent}
        {showCursor && (
          <span className={`text-green-400 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>
            █
          </span>
        )}
      </span>
    </div>
  );
};
