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
    selectedTab,
    textRef,
    queueRef,
    animatingRef,
    processingRef,
    restartingRef,
    cursorIntervalRef,
    animationGenerationRef,
    PROMPT,
    queueSignal,
  } = useTerminal();

  const { scrollToBottomIfNeeded } = useTerminalScroll();

  // Cursor blinking effect - controlled by animation state
  useEffect(() => {
    // Only blink cursor when in terminal tab
    if (selectedTab !== 'terminal') return;

    // Clear any existing interval
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
      cursorIntervalRef.current = null;
    }

    // Only start blinking when not animating, processing, or restarting
    if (!isAnimating && !isProcessing && !isRestarting) {
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible((prev) => !prev);
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
  }, [isAnimating, isProcessing, isRestarting, setCursorVisible, cursorIntervalRef, selectedTab]);

  // Helper to animate in new output - simplified version
  const animateOutput = useCallback(
    (output: string) => {
      const generationAtStart = animationGenerationRef.current;
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
          // Stop animation immediately if restarting, tab not visible, or generation changed
          if (
            restartingRef.current ||
            document.visibilityState !== 'visible' ||
            generationAtStart !== animationGenerationRef.current
          ) {
            // If tab became hidden, fast-append the remaining characters to avoid loss
            if (document.visibilityState !== 'visible' && i < output.length) {
              const remaining = output.slice(i);
              setLines((prev) => {
                const newLines = [...prev];
                newLines[newLines.length - 1] += remaining;
                return newLines;
              });
            }
            animatingRef.current = false;
            setIsAnimating(false);
            resolve();
            return;
          }

          const char = output.slice(i, i + 1);
          setLines((prev) => {
            const newLines = [...prev];
            newLines[newLines.length - 1] += char;
            return newLines;
          });

          // Only scroll if in terminal tab
          if (selectedTab === 'terminal') {
            scrollToBottomIfNeeded();
          }

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
    },
    [
      setIsAnimating,
      setCursorVisible,
      setLines,
      animatingRef,
      restartingRef,
      scrollToBottomIfNeeded,
      selectedTab,
      animationGenerationRef,
    ]
  );

  // Process a single text chunk with newlines
  const processTextChunk = useCallback(
    async (text: string) => {
      const generationAtStart = animationGenerationRef.current;
      if (!text) return;

      // Normalize line endings (handle CRLF and lone CR)
      const cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Split by newlines, preserving empty lines
      const textLines = cleanedText.split('\n');

      // Count leading empty segments to represent exact leading newlines
      let leadingEmptyCount = 0;
      while (leadingEmptyCount < textLines.length && textLines[leadingEmptyCount] === '') {
        leadingEmptyCount += 1;
      }

      // Process each line
      for (let i = 0; i < textLines.length; i++) {
        // Check if we're restarting
        if (restartingRef.current || generationAtStart !== animationGenerationRef.current) break;

        // Insert newlines:
        // - For each leading empty segment, we need a new prompt line
        // - For remaining segments, add a new prompt line BEFORE segments after the first content
        if (i < leadingEmptyCount) {
          // We're in the leading empty region: push a prompt per empty segment
          setLines((prev) => [...prev, PROMPT]);
          await new Promise((r) => setTimeout(r, 50));
          if (generationAtStart !== animationGenerationRef.current) break;
          if (selectedTab === 'terminal') {
            scrollToBottomIfNeeded();
          }
          // No content to animate for empty segment, continue
          continue;
        } else if (i > leadingEmptyCount) {
          // After first non-empty segment, each subsequent segment starts on a new prompt line
          setLines((prev) => [...prev, PROMPT]);
          await new Promise((r) => setTimeout(r, 50));
          if (generationAtStart !== animationGenerationRef.current) break;
          if (selectedTab === 'terminal') {
            scrollToBottomIfNeeded();
          }
        }

        // Get the current line (safely)
        const currentLine = textLines[i] || '';

        // Animate the line content when non-empty
        if (currentLine.length > 0) {
          await animateOutput(currentLine);
          if (generationAtStart !== animationGenerationRef.current) break;
          await new Promise((r) => setTimeout(r, 50)); // Small delay after content
          if (generationAtStart !== animationGenerationRef.current) break;
        }
      }

      // No extra newline needed here; loop already accounted for every '\n'
    },
    [
      animateOutput,
      setLines,
      scrollToBottomIfNeeded,
      restartingRef,
      PROMPT,
      selectedTab,
      animationGenerationRef,
    ]
  );

  // Animation queue processor
  const processQueue = useCallback(async () => {
    const generationAtStart = animationGenerationRef.current;
    if (processingRef.current || restartingRef.current) return;
    // Defer processing until tab is visible to avoid dropped/partial animations
    if (document.visibilityState !== 'visible') return;

    processingRef.current = true;
    setIsProcessing(true);

    try {
      while (
        queueRef.current.length > 0 &&
        !restartingRef.current &&
        generationAtStart === animationGenerationRef.current
      ) {
        const chunk = queueRef.current.shift();
        if (chunk === undefined) continue;

        await processTextChunk(chunk);
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [
    queueRef,
    processingRef,
    restartingRef,
    setIsProcessing,
    processTextChunk,
    animationGenerationRef,
  ]);

  // When tab becomes visible, resume processing if there is queued content
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      if (queueRef.current.length === 0 || processingRef.current || restartingRef.current) {
        return;
      }

      // Drain the backlog text
      const backlogChunks = queueRef.current.splice(0);
      const backlogText = backlogChunks.join('');
      if (backlogText.length === 0) {
        return;
      }

      const normalized = backlogText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Instantly apply ALL backlog characters, creating new lines on every \n
      setLines((prev) => {
        const newLines = [...prev];
        let currentLine = newLines[newLines.length - 1] ?? '';
        for (let i = 0; i < normalized.length; i++) {
          const ch = normalized[i] as string;
          if (ch === '\n') {
            newLines[newLines.length - 1] = currentLine;
            newLines.push(PROMPT);
            currentLine = PROMPT;
          } else {
            currentLine += ch;
          }
        }
        newLines[newLines.length - 1] = currentLine;
        return newLines;
      });

      // Force scroll to bottom after DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (selectedTab === 'terminal' && textRef.current) {
            textRef.current.scrollTop = textRef.current.scrollHeight + 30;
          }
        });
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queueRef, processingRef, restartingRef, setLines, PROMPT, selectedTab, textRef]);

  // Monitor the queue via signal and process when items are added
  useEffect(() => {
    if (queueRef.current.length > 0 && !processingRef.current && !restartingRef.current) {
      setTimeout(() => {
        processQueue();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueSignal]);

  return {
    animateOutput,
    processQueue,
    lines,
    cursorVisible,
  };
};
