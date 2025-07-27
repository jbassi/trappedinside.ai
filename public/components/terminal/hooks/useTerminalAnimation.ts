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
      if (output.length === 0) {
        resolve();
        return;
      }
      
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

  // Process a single text chunk with newlines
  const processTextChunk = useCallback(async (text: string) => {
    if (!text) return;
    
    // Normalize line endings
    const normalizedText = text.replace(/\r\n/g, '\n');
    
    // Normalize consecutive newlines to prevent excessive empty lines
    // Replace sequences of more than 2 newlines with exactly 2
    const cleanedText = normalizedText.replace(/\n{3,}/g, '\n\n');
    
    // Check for leading/trailing newlines
    const hasLeadingNewline = cleanedText.startsWith('\n');
    const hasTrailingNewline = cleanedText.endsWith('\n');
    
    // Split by newlines, preserving empty lines
    const textLines = cleanedText.split('\n');
    
    // Process each line
    for (let i = 0; i < textLines.length; i++) {
      // Check if we're restarting
      if (restartingRef.current) break;
      
      // For lines after the first one, or if there's a leading newline,
      // add a new prompt line before processing the content
      if (i > 0 || (i === 0 && hasLeadingNewline)) {
        setLines(prev => [...prev, PROMPT]);
        await new Promise(r => setTimeout(r, 50)); // Small delay for newline
        scrollToBottomIfNeeded();
      }
      
      // Get the current line (safely)
      const currentLine = textLines[i] || "";
      
      // Animate the line content (even if empty, to preserve spacing)
      if (currentLine.length > 0) {
        await animateOutput(currentLine);
        await new Promise(r => setTimeout(r, 50)); // Small delay after content
      }
    }
    
    // Add a final newline if the text ended with one
    // But only if we haven't already added a newline for an empty last line
    if (hasTrailingNewline && !(textLines.length > 0 && textLines[textLines.length - 1] === "")) {
      setLines(prev => [...prev, PROMPT]);
      await new Promise(r => setTimeout(r, 50));
      scrollToBottomIfNeeded();
    }
  }, [animateOutput, setLines, scrollToBottomIfNeeded, restartingRef, PROMPT]);

  // Animation queue processor
  const processQueue = useCallback(async () => {
    if (processingRef.current || restartingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      while (queueRef.current.length > 0 && !restartingRef.current) {
        const chunk = queueRef.current.shift();
        if (chunk === undefined) continue;
        
        await processTextChunk(chunk);
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [queueRef, processingRef, restartingRef, setIsProcessing, processTextChunk]);

  // Monitor the queue and process when items are added
  useEffect(() => {
    if (queueRef.current.length > 0 && !processingRef.current && !restartingRef.current) {
      // Use setTimeout to avoid potential state update issues
      setTimeout(() => {
        processQueue();
      }, 0);
    }
  }, [queueRef.current.length, processQueue, processingRef, restartingRef]);

  return {
    animateOutput,
    processQueue,
    lines,
    cursorVisible
  };
};
