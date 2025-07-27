import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface TerminalSizeContextType {
  terminalWidth: number;
}

const TerminalSizeContext = createContext<TerminalSizeContextType | undefined>(undefined);

interface TerminalSizeProviderProps {
  children: ReactNode;
  textRef: React.RefObject<HTMLDivElement | null>; // Allow null in the ref type
}

export const TerminalSizeProvider: React.FC<TerminalSizeProviderProps> = ({ children, textRef }) => {
  const [terminalWidth, setTerminalWidth] = useState(80);

  useEffect(() => {
    const measureWidth = () => {
      if (!textRef.current) return;
      
      // Create a test element with accurate font measurement
      const testElement = document.createElement('div');
      const containerStyles = getComputedStyle(textRef.current);
      
      // Copy all font styles from the container
      testElement.style.fontFamily = containerStyles.fontFamily;
      testElement.style.fontSize = containerStyles.fontSize;
      testElement.style.fontWeight = containerStyles.fontWeight;
      testElement.style.letterSpacing = containerStyles.letterSpacing;
      testElement.style.visibility = 'hidden';
      testElement.style.position = 'absolute';
      testElement.style.whiteSpace = 'pre';
      testElement.style.top = '-9999px';
      testElement.textContent = '#'.repeat(100); // Use 100 characters for accuracy
      
      document.body.appendChild(testElement);
      const testWidth = testElement.offsetWidth;
      document.body.removeChild(testElement);
      
      // Use the full container width for components to span completely
      const containerWidth = textRef.current.offsetWidth;
      
      const charWidth = testWidth / 100; // Width per character
      const availableChars = Math.floor(containerWidth / charWidth);
      
      setTerminalWidth(Math.max(availableChars, 20)); // Minimum 20 chars
    };

    // Initial measurement
    measureWidth();

    // Listen for resize events
    const handleResize = () => measureWidth();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Use ResizeObserver for container changes
    const observer = new ResizeObserver(measureWidth);
    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
    };
  }, [textRef]);

  return (
    <TerminalSizeContext.Provider value={{ terminalWidth }}>
      {children}
    </TerminalSizeContext.Provider>
  );
};

export const useTerminalSize = (): TerminalSizeContextType => {
  const context = useContext(TerminalSizeContext);
  if (!context) {
    throw new Error('useTerminalSize must be used within a TerminalSizeProvider');
  }
  return context;
};