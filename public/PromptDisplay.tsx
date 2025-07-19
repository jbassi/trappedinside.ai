import React from "react";
import { terminalStyles, terminalClasses } from './terminalStyles';
import { useTerminalSize } from './TerminalSizeContext';

interface PromptDisplayProps {
  prompt: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
  const { terminalWidth } = useTerminalSize();
  const effectiveWidth = Math.max(terminalWidth, 12); // Minimum width for "## PROMPT ##"
  const contentWidth = effectiveWidth - 4; // Account for "# " and " #"
  
  const wrapText = (text: string, maxWidth: number): string[] => {
    if (!text || text.trim() === '' || maxWidth <= 0) return [''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          if (word.length > maxWidth) {
            lines.push(word.substring(0, maxWidth));
            currentLine = word.substring(maxWidth);
          } else {
            currentLine = word;
          }
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [''];
  };

  // Create header line with centered PROMPT
  const createHeaderLine = (): string => {
    const promptText = " PROMPT ";
    if (effectiveWidth < promptText.length) {
      return "#".repeat(effectiveWidth);
    }
    
    const remainingSpace = effectiveWidth - promptText.length;
    const leftPadding = Math.floor(remainingSpace / 2);
    const rightPadding = remainingSpace - leftPadding;
    
    return "#".repeat(leftPadding) + promptText + "#".repeat(rightPadding);
  };

  // Create content lines with borders and proper spacing
  const createContentLine = (content: string): string => {
    const paddedContent = content.padEnd(contentWidth, ' ');
    return "# " + paddedContent + " #";
  };

  // Create footer line
  const createFooterLine = (): string => {
    return "#".repeat(effectiveWidth);
  };

  // Build all lines
  const lines: string[] = [];
  
  // Header
  lines.push(createHeaderLine());
  
  // Content lines
  const wrappedText = wrapText(prompt, contentWidth);
  for (const textLine of wrappedText) {
    lines.push(createContentLine(textLine));
  }
  
  // Footer
  lines.push(createFooterLine());

  return (
    <div className={`${terminalClasses.baseText} mb-2 sm:mb-4 w-full`} style={terminalStyles.baseText}>
      {lines.map((line, index) => (
        <div key={index} className="whitespace-pre font-mono w-full overflow-hidden">
          {line}
        </div>
      ))}
    </div>
  );
};