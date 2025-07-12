import React from "react";
import { terminalStyles, terminalClasses } from './terminalStyles';

interface PromptDisplayProps {
  prompt: string;
  terminalWidth: number;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt, terminalWidth }) => {
  // Use almost all available space for text wrapping
  const maxLineLength = Math.max(40, terminalWidth - 4);
  
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          // Word is too long, break it gracefully
          if (word.length > maxWidth) {
            lines.push(word.substring(0, maxWidth - 1) + '-');
            currentLine = word.substring(maxWidth - 1);
          } else {
            currentLine = word;
          }
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim());
    }
    return lines.length > 0 ? lines : [''];
  };
  
  const promptLines = wrapText(prompt, maxLineLength);
  
    return (
    <div className={`${terminalClasses.baseText} mb-4 w-full`} style={terminalStyles.baseText}>
      {/* Header line with centered P R O M P T */}
      <div className="w-full overflow-hidden whitespace-nowrap">
        <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
          {(() => {
            const promptText = " P R O M P T ";
            const totalWidth = Math.max(60, terminalWidth);
            const promptLength = promptText.length;
            const remainingSpace = totalWidth - promptLength;
            const leftPadding = Math.floor(remainingSpace / 2);
            const rightPadding = remainingSpace - leftPadding;
            return "#".repeat(leftPadding) + promptText + "#".repeat(rightPadding);
          })()}
        </span>
      </div>
      
      {/* Content lines with # borders on left and right only */}
      {promptLines.map((line, index) => (
        <div key={index} className="w-full flex items-center">
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
          <span className={`flex-1 px-2 ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
            {line}
          </span>
          <span className={terminalClasses.baseText} style={terminalStyles.baseText}>#</span>
        </div>
      ))}
      
      {/* Bottom border */}
      <div className="w-full overflow-hidden whitespace-nowrap">
        <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
          {"#".repeat(200)}
        </span>
      </div>
    </div>
  );
}; 