import React, { useRef, useEffect, useState } from "react";
import { terminalStyles, terminalClasses } from './terminalStyles';

interface PromptDisplayProps {
  prompt: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicWidth, setDynamicWidth] = useState(50); // Default fallback

  useEffect(() => {
    const measureWidth = () => {
      if (!containerRef.current) return;
      
      // Create a test element with a known number of characters
      const testElement = document.createElement('div');
      testElement.style.fontFamily = 'monospace';
      testElement.style.fontSize = getComputedStyle(containerRef.current).fontSize;
      testElement.style.fontWeight = getComputedStyle(containerRef.current).fontWeight;
      testElement.style.visibility = 'hidden';
      testElement.style.position = 'absolute';
      testElement.style.whiteSpace = 'pre';
      testElement.style.top = '-9999px';
      testElement.textContent = '#'.repeat(100); // 100 characters
      
      document.body.appendChild(testElement);
      const testWidth = testElement.offsetWidth;
      document.body.removeChild(testElement);
      
      // Calculate how many characters fit in the container
      const containerWidth = containerRef.current.offsetWidth;
      const charWidth = testWidth / 100; // Width per character
      const availableChars = Math.floor(containerWidth / charWidth);
      
      setDynamicWidth(Math.max(availableChars, 20)); // Minimum 20 chars
    };

    // Initial measurement
    measureWidth();

    // Listen for resize events
    const handleResize = () => measureWidth();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Use ResizeObserver for container changes
    const observer = new ResizeObserver(measureWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
    };
  }, []);

  const effectiveWidth = dynamicWidth;
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
      className={`${terminalClasses.baseText} mb-2 sm:mb-4 w-full`}
      style={{
        ...terminalStyles.baseText,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {lines.map((line, index) => (
        <div key={index} className="whitespace-pre font-mono">
          {line}
        </div>
      ))}
    </div>
  );
};