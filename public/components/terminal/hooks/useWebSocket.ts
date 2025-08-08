import { useEffect, useCallback, useRef } from 'react';
import { useTerminal } from '../TerminalContext';
import { WebSocketService } from '../../../services/websocketService';
import type { ServerMessage, Message } from '../../../services/websocketService';

// Define the WebSocket URL
const WS_URL =
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';

export const useWebSocket = () => {
  const {
    setLines,
    setLastMemory,
    setLlmPrompt,
    setIsLoading,
    setIsRestarting,
    setNumRestarts,
    setIsAtBottom,
    setUserScrolledUp,
    setActivelyDragging,
    setSelectedTab,
    setCursorVisible,
    queueRef,
    animatingRef,
    processingRef,
    restartingRef,
    isLoadingRef,
    historyLoadedRef,
    loadingStartTimeRef,
    minLoadingTimeRef,
    DEFAULT_LLM_PROMPT,
    PROMPT,
    textRef,
    setIsAnimating,
    setIsProcessing,
    cursorIntervalRef,
    prevScrollTopRef,
    prevScrollHeightRef,
    animationGenerationRef,
    setQueueSignal,
  } = useTerminal();


  // Keep WebSocket service reference
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track last received message/chunk for overlap handling
  const lastMessageRef = useRef<string>('');
  const lastChunkRef = useRef<string>('');
  const lastChunkTimeRef = useRef<number>(0);
  const fullTextBufferRef = useRef<string>('');

  // Track if we're waiting for a message after restart
  const waitingForFirstMessageAfterRestartRef = useRef<boolean>(false);

  // Helper function to hide loading with minimum display time
  const hideLoadingAfterMinTime = useCallback(
    (callback?: () => void) => {
      // If we're waiting for first message after restart, don't hide loading yet
      if (waitingForFirstMessageAfterRestartRef.current) {
        return;
      }

      const minLoadingTime = 1000; // Show loader for at least 1 second
      const elapsedTime = Date.now() - loadingStartTimeRef.current;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }

      minLoadingTimeRef.current = setTimeout(() => {
        setIsLoading(false);
        isLoadingRef.current = false;
        if (callback) callback();
        minLoadingTimeRef.current = null;
      }, remainingTime);
    },
    [setIsLoading, isLoadingRef, loadingStartTimeRef, minLoadingTimeRef]
  );

  // Helper function to show loading spinner
  const showLoading = useCallback(() => {
    setIsLoading(true);
    isLoadingRef.current = true;
    loadingStartTimeRef.current = Date.now();
  }, [setIsLoading, isLoadingRef, loadingStartTimeRef]);

  // Helper function to handle overlapping messages (no dedupe of exact repeats)
  const checkAndProcessMessage = useCallback((text: string): string | null => {
    if (!text || text.length === 0) return null;

    // Drop exact immediate retransmits (same chunk within a short window)
    const now = Date.now();
    if (text === lastChunkRef.current && now - lastChunkTimeRef.current < 750) {
      return null;
    }

    // Overlap detection only against last chunk to avoid false positives
    let newContent = text;
    const previousChunk = lastChunkRef.current;
    if (previousChunk.length > 0) {
      const maxOverlap = Math.min(text.length, previousChunk.length);
      // Require a minimum overlap size to consider trimming
      const minOverlap = 10;
      for (let overlapSize = maxOverlap; overlapSize >= minOverlap; overlapSize--) {
        const endOfPrev = previousChunk.substring(previousChunk.length - overlapSize);
        const startOfNew = text.substring(0, overlapSize);
        if (endOfPrev === startOfNew) {
          // If new text has extra beyond the overlap, trim the overlap prefix
          if (text.length > overlapSize) {
            newContent = text.substring(overlapSize);
          } else {
            // Exact repeat of the overlapped part: keep as-is (do not drop)
            newContent = text;
          }
          break;
        }
      }
    }

    // Update buffer with only the truly new content
    if (newContent.length > 0) {
      fullTextBufferRef.current = fullTextBufferRef.current + newContent;
    }

    // Update lastChunk for next comparison
    lastChunkRef.current = text;
    lastChunkTimeRef.current = now;

    // Limit buffer size to prevent memory growth
    if (fullTextBufferRef.current.length > 5000) {
      fullTextBufferRef.current = fullTextBufferRef.current.substring(
        fullTextBufferRef.current.length - 2000
      );
    }

    return newContent.length > 0 ? newContent : null;
  }, []);

  // Helper function to process history messages (instant display)
  const processHistoryMessages = useCallback(
    (messages: Message[]) => {
      // Reset message tracking on history load
      lastMessageRef.current = '';
      lastChunkRef.current = '';
      lastChunkTimeRef.current = 0;
      fullTextBufferRef.current = '';

      // Build the complete conversation from history
      const conversationLines = [PROMPT];
      let currentLine = PROMPT;

      for (const msg of messages) {
        // Update memory if present
        if (msg.memory) {
          setLastMemory(msg.memory);
        }

        // Update status if present
        if (msg.status) {
          // Handle num_restarts from history
          if (msg.status.num_restarts !== undefined) {
            setNumRestarts(msg.status.num_restarts);
          }
        }

        // Update prompt if present
        if (msg.prompt && msg.prompt.trim() !== '') {
          setLlmPrompt(msg.prompt);
        }

        // Process text content
        if (msg.text) {
          for (const char of msg.text) {
            if (char === '\n') {
              // Finish current line and start new one
              conversationLines[conversationLines.length - 1] = currentLine;
              conversationLines.push(PROMPT);
              currentLine = PROMPT;
            } else {
              currentLine += char;
            }
          }
          // Update the current line
          conversationLines[conversationLines.length - 1] = currentLine;
        }
      }

      // Set all lines at once for instant display
      setLines(conversationLines);
      historyLoadedRef.current = true;

      // Hide loading spinner with minimum display time
      hideLoadingAfterMinTime(() => {
        // Scroll to bottom after history loads and loading is hidden
        setTimeout(() => {
          if (textRef.current) {
            textRef.current.scrollTop = textRef.current.scrollHeight;
          }
        }, 50);
      });
    },
    [
      setLines,
      setLastMemory,
      setNumRestarts,
      setLlmPrompt,
      hideLoadingAfterMinTime,
      historyLoadedRef,
      textRef,
      PROMPT,
    ]
  );

  // Handle WebSocket messages
  const handleMessage = useCallback(
    (data: ServerMessage) => {
      const { type = 'live', messages } = data;

      // Handle different message types
      if (type === 'history') {
        // Process history messages instantly
        processHistoryMessages(messages);
      } else if (type === 'live') {
        // Hide loading spinner on first live message (if history wasn't received)
        if (
          isLoadingRef.current &&
          !restartingRef.current &&
          !waitingForFirstMessageAfterRestartRef.current
        ) {
          historyLoadedRef.current = true; // Consider history loaded
          hideLoadingAfterMinTime(); // Use minimum loading time
        }

        // Process each live message chunk
        for (const msg of messages) {
          // Handle status updates first and synchronously
          if (msg.status) {
            // Handle restarting status
            if (msg.status.is_restarting !== undefined) {
              const isRestarting = msg.status.is_restarting;
              setIsRestarting(isRestarting);
              restartingRef.current = isRestarting;
            }

            // Handle num_restarts
            if (msg.status.num_restarts !== undefined) {
              setNumRestarts(msg.status.num_restarts);
            }

            // Handle restart state change
            if (restartingRef.current) {
              // Check if this is a silent restart (no message content)
              const isSilentRestart = !msg.text || msg.text.trim() === '';

              // Always clear the terminal for restarts
              setLines([PROMPT]);
              queueRef.current = [];
              animatingRef.current = false;
              processingRef.current = false;

              // Reset state
              setLastMemory(undefined);
              setLlmPrompt(DEFAULT_LLM_PROMPT);
              historyLoadedRef.current = false;

              // Reset message tracking
              lastMessageRef.current = '';
              lastChunkRef.current = '';
              lastChunkTimeRef.current = 0;
              fullTextBufferRef.current = '';

              // Show loading spinner for all restarts
              showLoading();

              // Set flag to wait for first message after restart
              waitingForFirstMessageAfterRestartRef.current = true;

              // Force WebSocket reconnection after a brief delay
              setTimeout(() => {
                if (wsServiceRef.current) {
                  wsServiceRef.current.reconnect();
                }
              }, 100);

              // Skip processing for silent restarts
              if (isSilentRestart) {
                return; // Skip processing any remaining message content
              }
              // For non-silent restarts, continue to process the message content
            } else if (!restartingRef.current && waitingForFirstMessageAfterRestartRef.current) {
              // We received a message with is_restarting = false after a restart
              waitingForFirstMessageAfterRestartRef.current = false;

              // Now we can hide the loading spinner (with minimum display time)
              hideLoadingAfterMinTime();
            }
          }

          // Update memory if present
          if (msg.memory) {
            setLastMemory(msg.memory);
          }

          // Update prompt if present (check for non-empty string)
          if (msg.prompt !== undefined) {
            if (msg.prompt.trim() !== '') {
              setLlmPrompt(msg.prompt);
            } else {
              setLlmPrompt(DEFAULT_LLM_PROMPT);
            }
          }

          // Process text content if text exists
          if (msg.text !== undefined) {
            // Check for duplicates and get only new content
            const newContent = checkAndProcessMessage(msg.text);

            // Only queue non-duplicate content
             if (newContent) {
              queueRef.current.push(newContent);

              // Signal queue update for animation hook to process promptly
              setQueueSignal((s) => s + 1);

              // If we're waiting for first message after restart and received text,
              // we can now hide the loading spinner
              if (waitingForFirstMessageAfterRestartRef.current) {
                waitingForFirstMessageAfterRestartRef.current = false;
                hideLoadingAfterMinTime();
              }
            }
          }
        }
      }
    },
    [
      processHistoryMessages,
      hideLoadingAfterMinTime,
      showLoading,
      setLines,
      setLastMemory,
      setLlmPrompt,
      setIsRestarting,
      queueRef,
      animatingRef,
      processingRef,
      restartingRef,
      isLoadingRef,
      historyLoadedRef,
      wsServiceRef,
      DEFAULT_LLM_PROMPT,
      PROMPT,
      checkAndProcessMessage,
    ]
  );

  // Helper to reset all state
  const resetState = useCallback(() => {
    // Reset state
    setLines([PROMPT]);
    setLastMemory(undefined);
    setLlmPrompt(DEFAULT_LLM_PROMPT);
    setIsLoading(true);
    setIsRestarting(false);
    setNumRestarts(0);
    setIsAnimating(false);
    setIsProcessing(false);

    // Reset UI state to mimic hard reload
    setSelectedTab('terminal');
    setCursorVisible(true);
    setIsAtBottom(true);
    setUserScrolledUp(false);
    setActivelyDragging(false);

    // Reset refs
    queueRef.current = [];
    animatingRef.current = false;
    processingRef.current = false;
    restartingRef.current = false;
    isLoadingRef.current = true;
    historyLoadedRef.current = false;
    loadingStartTimeRef.current = Date.now();
    waitingForFirstMessageAfterRestartRef.current = false;

    // Clear any pending loading timeout
    if (minLoadingTimeRef.current) {
      clearTimeout(minLoadingTimeRef.current);
      minLoadingTimeRef.current = null;
    }

    // Reset scroll tracking
    prevScrollTopRef.current = 0;
    prevScrollHeightRef.current = 0;

    // Ensure no stale cursor intervals remain
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
      cursorIntervalRef.current = null;
    }

    // Invalidate any in-flight animations/processing loops
    animationGenerationRef.current += 1;

    // Reset message tracking
    lastMessageRef.current = '';
    lastChunkRef.current = '';
    lastChunkTimeRef.current = 0;
    fullTextBufferRef.current = '';
  }, [
    setLines,
    setLastMemory,
    setLlmPrompt,
    setIsLoading,
    setIsRestarting,
    setIsAnimating,
    setIsProcessing,
    setSelectedTab,
    setCursorVisible,
    setIsAtBottom,
    setUserScrolledUp,
    setActivelyDragging,
    PROMPT,
    DEFAULT_LLM_PROMPT,
  ]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket service
    const wsService = new WebSocketService(WS_URL, {
      onOpen: () => {
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      },
      onMessage: handleMessage,
      onClose: () => {
        // No need to handle close - service will auto-reconnect
      },
      onError: () => {
        if (isLoadingRef.current && !waitingForFirstMessageAfterRestartRef.current) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      },
    });

    // Store service reference
    wsServiceRef.current = wsService;

    // Connect to WebSocket server
    wsService.connect();

    // Explicitly avoid resetting on simple visibility changes.
    // We handle true BFCache restores with a full reload in public/index.tsx.
    const handlePageHide = () => {
      // Proactively disconnect to avoid stale state while in BFCache/hidden
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup on unmount
    return () => {
      // No visibility/pageshow listeners registered
      window.removeEventListener('pagehide', handlePageHide);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsService.disconnect();
    };
  }, [handleMessage, resetState]);

  return {
    processHistoryMessages,
    hideLoadingAfterMinTime,
  };
};
