import React from "react";
import { terminalStyles, terminalClasses } from './terminalStyles';

interface PromptDisplayProps {
  prompt: string;
  terminalWidth: number;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt, terminalWidth }) => {
  // Responsive width and line length calculation
  const getResponsiveSettings = () => {
    if (terminalWidth < 40) {
      return {
        maxLineLength: Math.max(20, terminalWidth - 6),
        borderWidth: Math.max(25, terminalWidth - 2),
        promptText: " P R O M P T ",
      };
    } else if (terminalWidth < 60) {
      return {
        maxLineLength: Math.max(30, terminalWidth - 6),
        borderWidth: Math.max(40, terminalWidth - 2),
        promptText: " P R O M P T ",
      };
    } else {
      return {
        maxLineLength: Math.max(40, terminalWidth - 4),
        borderWidth: Math.max(60, terminalWidth),
        promptText: " P R O M P T ",
      };
    }
  };
  
  const { maxLineLength, borderWidth, promptText } = getResponsiveSettings();
  
  const wrapText = (text: string, maxWidth: number): string[] => {
    if (!text || text.trim() === '') return [''];
    
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
    <div className={`${terminalClasses.baseText} mb-2 sm:mb-4 w-full px-1 sm:px-0`} style={terminalStyles.baseText}>
      {/* Header line with centered P R O M P T */}
      <div className="w-full overflow-hidden whitespace-nowrap mb-1 sm:mb-0">
        <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
          {(() => {
            const totalWidth = borderWidth;
            const textLength = promptText.length;
            const remainingSpace = Math.max(0, totalWidth - textLength);
            const leftPadding = Math.floor(remainingSpace / 2);
            const rightPadding = remainingSpace - leftPadding;
            return "#".repeat(leftPadding) + promptText + "#".repeat(rightPadding);
          })()}
        </span>
      </div>
      
      {/* Content lines with # borders on left and right only */}
      {promptLines.map((line, index) => (
        <div key={index} className="w-full flex items-start">
          <span className={`${terminalClasses.baseText} flex-shrink-0`} style={terminalStyles.baseText}>#</span>
          <span 
            className={`flex-1 px-1 sm:px-2 ${terminalClasses.baseText} break-words`} 
            style={terminalStyles.baseText}
          >
            {line}
          </span>
          <span className={`${terminalClasses.baseText} flex-shrink-0`} style={terminalStyles.baseText}>#</span>
        </div>
      ))}
      
      {/* Bottom border */}
      <div className="w-full overflow-hidden whitespace-nowrap">
        <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
          {"#".repeat(borderWidth)}
        </span>
      </div>
    </div>
  );
}; 