import React, { useRef, useEffect, useState } from "react";
import { terminalStyles, terminalClasses } from './terminalStyles';
import { useTerminalSize } from './TerminalSizeContext';

interface PromptDisplayProps {
  prompt: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
  const { terminalWidth } = useTerminalSize();
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualWidth, setActualWidth] = useState(terminalWidth);

  // Measure the actual rendered width and calculate character count
  useEffect(() => {
    if (!containerRef.current) return;

    // Create a test element to measure character width in this exact container
    const testElement = document.createElement('div');
    const containerStyles = getComputedStyle(containerRef.current);
    
    testElement.style.fontFamily = containerStyles.fontFamily;
    testElement.style.fontSize = containerStyles.fontSize;
    testElement.style.fontWeight = containerStyles.fontWeight;
    testElement.style.letterSpacing = containerStyles.letterSpacing;
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    testElement.style.whiteSpace = 'pre';
    testElement.style.top = '-9999px';
    testElement.textContent = '#'.repeat(100);
    
    document.body.appendChild(testElement);
    const testWidth = testElement.offsetWidth;
    document.body.removeChild(testElement);
    
    // Calculate character count based on actual container width
    const containerWidth = containerRef.current.offsetWidth;
    const charWidth = testWidth / 100;
    // Add small buffer to ensure we use every available pixel
    const calculatedWidth = Math.floor((containerWidth + 1) / charWidth);
    
    setActualWidth(Math.max(calculatedWidth, 12));
  }, [terminalWidth]);

  const effectiveWidth = actualWidth;
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
    <div 
      ref={containerRef}
      className={`${terminalClasses.baseText} mb-2 sm:mb-4`}
      style={{
        ...terminalStyles.baseText,
        width: '100%',
        maxWidth: '100%',
        minWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {lines.map((line, index) => (
        <div 
          key={index} 
          className="whitespace-pre font-mono"
          style={{
            display: 'flex',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <span style={{ width: '100%', textAlign: 'left' }}>
            {line}
          </span>
        </div>
      ))}
    </div>
  );
};