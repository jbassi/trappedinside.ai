import { useEffect, useCallback } from 'react';
import { useTerminal } from '../TerminalContext';
import { useTerminalScroll } from './useTerminalScroll';

export const useTerminalAnimation = () => {
  const {
    lines,
    setLines,
    cursorVisible,
    setCursorVisible,
    isAnimating,
    setIsAnimating,
    isProcessing,
    setIsProcessing,
    isRestarting,
    queueRef,
    animatingRef,
    processingRef,
    restartingRef,
    cursorIntervalRef,
    PROMPT
  } = useTerminal();

  const { scrollToBottomIfNeeded } = useTerminalScroll();

  // Cursor blinking effect - controlled by animation state
  useEffect(() => {
    // Clear any existing interval
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
      cursorIntervalRef.current = null;
    }

    // Only start blinking when not animating, processing, or restarting
    if (!isAnimating && !isProcessing && !isRestarting) {
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500); // Blink every 500ms
    } else {
      // Keep cursor visible during animation, processing, or restarting
      setCursorVisible(true);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isAnimating, isProcessing, isRestarting, setCursorVisible, cursorIntervalRef]);

  // Helper to animate in new output - simplified version
  const animateOutput = useCallback((output: string) => {
    return new Promise<void>((resolve) => {
      animatingRef.current = true;
      setIsAnimating(true);
      setCursorVisible(true); // Keep cursor visible during animation
      let i = 0;
      function step() {
        // Stop animation immediately if restarting or tab is not visible
        if (restartingRef.current || document.visibilityState !== 'visible') {
          animatingRef.current = false;
          setIsAnimating(false);
          resolve();
          return;
        }
        
        const char = output.slice(i, i + 1);
        setLines(prev => {
          const newLines = [...prev];
          newLines[newLines.length - 1] += char;
          return newLines;
        });
        
        // Scroll to bottom if needed (only if user hasn't scrolled up)
        scrollToBottomIfNeeded();
        
        i += 1;
        if (i < output.length) {
          // More human-like typing with variable speed (25-50ms per character)
          const delay = Math.random() * 25 + 25;
          setTimeout(step, delay);
        } else {
          animatingRef.current = false;
          setIsAnimating(false);
          resolve();
        }
      }
      step();
    });
  }, [setIsAnimating, setCursorVisible, setLines, animatingRef, restartingRef, scrollToBottomIfNeeded]);

  // Animation queue processor - simplified version
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setCursorVisible(true); // Keep cursor visible during processing
    
    while (queueRef.current.length > 0) {
      // Stop processing immediately if restarting or tab is not visible
      if (restartingRef.current || document.visibilityState !== 'visible') {
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }
      
      const chunk = queueRef.current.shift();
      if (!chunk) continue;
      
      // Split chunk into parts, preserving all newlines
      const parts = chunk.split(/(\n)/g);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === undefined) continue;
        
        // Check for restart or tab visibility before each part
        if (restartingRef.current || document.visibilityState !== 'visible') {
          processingRef.current = false;
          setIsProcessing(false);
          return;
        }
        
        if (part === "\n") {
          // Add a new line with PROMPT
          setLines(prev => [...prev, PROMPT]);
          // Brief pause after newlines with instant scroll
          await new Promise(res => setTimeout(res, 100));
          // Scroll to bottom if needed (only if user hasn't scrolled up)
          scrollToBottomIfNeeded();
        } else {
          // Skip empty strings that are between two newlines (they're handled by the newlines themselves)
          if (i > 0 && parts[i-1] === "\n" && i < parts.length - 1 && parts[i+1] === "\n") {
            continue;
          }
          // Process the part even if it's empty to preserve spacing in other cases
          await animateOutput(part);
          await new Promise(res => setTimeout(res, 50 + part.length * 5));
        }
      }
    }
    
    processingRef.current = false;
    setIsProcessing(false);
  }, [
    setIsProcessing, 
    setCursorVisible, 
    setLines, 
    animateOutput, 
    processingRef, 
    queueRef, 
    restartingRef, 
    scrollToBottomIfNeeded, 
    PROMPT
  ]);

  return {
    animateOutput,
    processQueue,
    lines,
    cursorVisible
  };
};
