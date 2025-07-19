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

    const measureWidth = () => {
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
      
      // More conservative padding calculation for mobile
      // Mobile: px-4 (32px) + scrollbar space + browser margins + safety buffer
      const isMobile = window.innerWidth <= 768;
      let paddingBuffer = isMobile ? 16 : 8; // Much less aggressive
      
      // Additional mobile-specific adjustments
      if (isMobile) {
        // Account for potential viewport scaling issues
        const viewportScale = window.visualViewport?.scale || 1;
        if (viewportScale !== 1) {
          paddingBuffer = Math.ceil(paddingBuffer * viewportScale);
        }
        
        // Add smaller buffer for very small screens
        if (containerWidth < 350) {
          paddingBuffer += 4; // Reduced from 8
        }
      }
      
      // Account for container padding and add safety buffer
      const availableWidth = Math.max(containerWidth - paddingBuffer, 100); // Ensure minimum
      const calculatedWidth = Math.floor(availableWidth / charWidth);
      
      // Ensure minimum width but be less conservative
      const minWidth = isMobile ? 15 : 12; // Reduced from 25
      const maxWidth = Math.floor(containerWidth / (charWidth * 0.9)); // Increased from 0.8 to 0.9
      
      const finalWidth = Math.max(Math.min(calculatedWidth, maxWidth), minWidth);
      setActualWidth(finalWidth);
    };

    // Initial measurement with delay to ensure layout is complete
    requestAnimationFrame(() => {
      setTimeout(measureWidth, 100);
    });

    // Set up ResizeObserver for dynamic width changes
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize events
      setTimeout(measureWidth, 50);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback for orientation changes on mobile
    const handleResize = () => {
      setTimeout(measureWidth, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
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
        minWidth: 0, // Allow shrinking below content size
        boxSizing: 'border-box',
        overflow: 'hidden', // Prevent any overflow
        wordBreak: 'keep-all', // Keep words intact
        whiteSpace: 'pre', // Preserve whitespace and prevent wrapping
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center horizontally
        justifyContent: 'center' // Center vertically if needed
      }}
    >
      <div style={{
        display: 'inline-block',
        textAlign: 'left' // Keep text left-aligned within the centered block
      }}>
        {lines.map((line, index) => (
          <div 
            key={index} 
            className="font-mono"
            style={{
              display: 'block',
              overflow: 'hidden',
              whiteSpace: 'pre',
              textOverflow: 'clip', // Clean cut if overflow occurs
              boxSizing: 'border-box'
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};