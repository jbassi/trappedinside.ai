import React from 'react';

interface TerminalLineProps {
  line: string;
  isLastLine: boolean;
  isThinking: boolean;
  cursorVisible: boolean;
  prompt: string;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({ 
  line, 
  isLastLine, 
  isThinking, 
  cursorVisible, 
  prompt 
}) => {
  const isPromptLine = line.startsWith(prompt);
  const lineContent = isPromptLine ? line.slice(prompt.length) : line;
  const showThinking = isThinking && isLastLine && isPromptLine && lineContent.trim() === "";
  const showCursor = isLastLine; // Always show cursor on last line

  return (
    <div className="flex items-start min-h-[1.5em]">
      <span className="text-green-400 select-none">{isPromptLine ? prompt.trim() : ""}</span>
      <span className="ml-2 whitespace-pre-line text-green-400">
        {lineContent}
        {showThinking && "Thinking..."}
        {showCursor && (
          <span className={`text-green-400 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>
            █
          </span>
        )}
      </span>
    </div>
  );
};
