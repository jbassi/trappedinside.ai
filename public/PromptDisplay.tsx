import React from "react";
import { terminalStyles, terminalClasses } from './terminalStyles';

interface PromptDisplayProps {
  prompt: string;
  terminalWidth: number;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt, terminalWidth }) => {
  // Detect if we're in mobile portrait mode
  const isMobilePortrait = typeof window !== 'undefined' && 
    window.innerWidth <= 768 && 
    window.innerHeight > window.innerWidth;

  // Responsive width and line length calculation
  const getResponsiveSettings = () => {
    // For mobile portrait, use a wider border to fill the screen better
    const effectiveTerminalWidth = isMobilePortrait ? 
      Math.max(terminalWidth, Math.floor(window.innerWidth / 10)) : 
      terminalWidth;
    
    // Use full terminal width for borders to ensure they connect properly
    const fullBorderWidth = effectiveTerminalWidth;
    
    if (effectiveTerminalWidth < 40) {
      return {
        maxLineLength: Math.max(15, effectiveTerminalWidth - 8),
        borderWidth: fullBorderWidth,
        promptText: " PROMPT ",
      };
    } else if (effectiveTerminalWidth < 60) {
      return {
        maxLineLength: Math.max(25, effectiveTerminalWidth - 8),
        borderWidth: fullBorderWidth,
        promptText: " PROMPT ",
      };
    } else {
      return {
        maxLineLength: Math.max(35, effectiveTerminalWidth - 6),
        borderWidth: fullBorderWidth,
        promptText: " PROMPT ",
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
  
  // Calculate proper centering for PROMPT text
  const createCenteredHeader = () => {
    const textLength = promptText.length;
    const totalWidth = borderWidth;
    
    // Ensure we have enough space for the text
    if (totalWidth < textLength) {
      return promptText.substring(0, totalWidth);
    }
    
    const remainingSpace = totalWidth - textLength;
    const leftPadding = Math.floor(remainingSpace / 2);
    const rightPadding = remainingSpace - leftPadding;
    
    return "#".repeat(leftPadding) + promptText + "#".repeat(rightPadding);
  };

  // Calculate the content area width (accounting for left and right # borders)
  const contentWidth = Math.max(0, borderWidth - 2); // -2 for left and right #

  return (
    <div className={`${terminalClasses.baseText} mb-2 sm:mb-4 w-full px-1 sm:px-0`} style={terminalStyles.baseText}>
      {/* Header line with centered PROMPT */}
      <div className="w-full overflow-hidden whitespace-nowrap mb-1 sm:mb-0">
        <span className={terminalClasses.baseText} style={terminalStyles.baseText}>
          {createCenteredHeader()}
        </span>
      </div>
      
      {/* Content lines with # borders on left and right only */}
      {promptLines.map((line, index) => (
        <div key={index} className="w-full flex items-start">
          <span className={`${terminalClasses.baseText} flex-shrink-0`} style={terminalStyles.baseText}>#</span>
          <span 
            className={`${terminalClasses.baseText} break-words`} 
            style={{
              ...terminalStyles.baseText,
              width: `${contentWidth}ch`,
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem'
            }}
          >
            {line || ' '}
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
