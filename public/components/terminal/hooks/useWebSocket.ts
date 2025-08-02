import { useEffect, useCallback, useRef } from 'react';
import { useTerminal } from '../TerminalContext';
import { WebSocketService } from '../../../services/websocketService';
import type { ServerMessage, Message } from '../../../services/websocketService';

// Define the WebSocket URL
const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

export const useWebSocket = () => {
  const {
    setLines,
    setLastMemory,
    setLlmPrompt,
    setIsLoading,
    setIsRestarting,
    setNumRestarts,
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
    setIsProcessing
  } = useTerminal();

  // Keep WebSocket service reference
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track last received message to prevent duplicates
  const lastMessageRef = useRef<string>("");
  const messageHashesRef = useRef<Set<string>>(new Set());
  const fullTextBufferRef = useRef<string>("");
  
  // Track if we're waiting for a message after restart
  const waitingForFirstMessageAfterRestartRef = useRef<boolean>(false);

  // Helper function to hide loading with minimum display time
  const hideLoadingAfterMinTime = useCallback((callback?: () => void) => {
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
  }, [setIsLoading, isLoadingRef, loadingStartTimeRef, minLoadingTimeRef]);

  // Helper function to show loading spinner
  const showLoading = useCallback(() => {
    setIsLoading(true);
    isLoadingRef.current = true;
    loadingStartTimeRef.current = Date.now();
  }, [setIsLoading, isLoadingRef, loadingStartTimeRef]);

  // Helper function to check for duplicate or overlapping messages
  const checkAndProcessMessage = useCallback((text: string): string | null => {
    if (!text || text.length === 0) return null;
    
    // Add to full text buffer for overlap detection
    const fullText = fullTextBufferRef.current + text;
    
    // Check for exact duplicates
    const messageHash = text.trim().substring(0, 50);
    if (messageHashesRef.current.has(messageHash)) {
      return null;
    }
    
    // Check for overlapping content (text that's already in our buffer)
    let newContent = text;
    
    // If we have previous content, check for overlaps
    if (fullTextBufferRef.current.length > 0) {
      // Look for overlapping segments (at least 10 chars to avoid false positives)
      for (let overlapSize = Math.min(text.length, fullTextBufferRef.current.length); overlapSize >= 10; overlapSize--) {
        const endOfBuffer = fullTextBufferRef.current.substring(fullTextBufferRef.current.length - overlapSize);
        const startOfNewText = text.substring(0, overlapSize);
        
        // If we found an overlap
        if (endOfBuffer === startOfNewText) {
          // Only keep the part after the overlap
          newContent = text.substring(overlapSize);
          console.log(`Found overlap of ${overlapSize} chars in message processing`);
          break;
        }
      }
    }
    
    // Update our tracking
    fullTextBufferRef.current = fullText;
    messageHashesRef.current.add(messageHash);
    
    // Limit set size to prevent memory growth
    if (messageHashesRef.current.size > 30) {
      const messagesArray = Array.from(messageHashesRef.current);
      messageHashesRef.current = new Set(messagesArray.slice(-15));
    }
    
    // Limit buffer size to prevent memory growth
    if (fullTextBufferRef.current.length > 5000) {
      fullTextBufferRef.current = fullTextBufferRef.current.substring(fullTextBufferRef.current.length - 2000);
    }
    
    // Return the non-duplicate content (or null if everything was a duplicate)
    return newContent.length > 0 ? newContent : null;
  }, []);

  // Helper function to process history messages (instant display)
  const processHistoryMessages = useCallback((messages: Message[]) => {
    // Reset message tracking on history load
    lastMessageRef.current = "";
    messageHashesRef.current.clear();
    fullTextBufferRef.current = "";
    
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
      if (msg.prompt && msg.prompt.trim() !== "") {
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
  }, [
    setLines, 
    setLastMemory, 
    setNumRestarts,
    setLlmPrompt, 
    hideLoadingAfterMinTime, 
    historyLoadedRef,
    textRef,
    PROMPT
  ]);

  // Handle WebSocket messages
  const handleMessage = useCallback((data: ServerMessage) => {
    const { type = 'live', messages } = data;
    
    // Handle different message types
    if (type === 'history') {
      // Process history messages instantly
      processHistoryMessages(messages);
    } else if (type === 'live') {
      // Hide loading spinner on first live message (if history wasn't received)
      if (isLoadingRef.current && !restartingRef.current && !waitingForFirstMessageAfterRestartRef.current) {
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
            const isSilentRestart = !msg.text || msg.text.trim() === "";
            
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
            lastMessageRef.current = "";
            messageHashesRef.current.clear();
            fullTextBufferRef.current = "";
            
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
          if (msg.prompt.trim() !== "") {
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
  }, [
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
    checkAndProcessMessage
  ]);

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
    
    // Reset refs
    queueRef.current = [];
    animatingRef.current = false;
    processingRef.current = false;
    restartingRef.current = false;
    isLoadingRef.current = true;
    historyLoadedRef.current = false;
    loadingStartTimeRef.current = Date.now();
    waitingForFirstMessageAfterRestartRef.current = false;
    
    // Reset message tracking
    lastMessageRef.current = "";
    messageHashesRef.current.clear();
    fullTextBufferRef.current = "";
  }, [
    setLines,
    setLastMemory,
    setLlmPrompt,
    setIsLoading,
    setIsRestarting,
    setIsAnimating,
    setIsProcessing,
    PROMPT,
    DEFAULT_LLM_PROMPT
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
      }
    });
    
    // Store service reference
    wsServiceRef.current = wsService;
    
    // Connect to WebSocket server
    wsService.connect();
    
    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Reset state after a brief delay to ensure clean slate
        reconnectTimeoutRef.current = setTimeout(() => {
          resetState();
          
          // Force WebSocket reconnection to get fresh history
          if (wsServiceRef.current) {
            wsServiceRef.current.reconnect();
          }
          
          reconnectTimeoutRef.current = null;
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsService.disconnect();
    };
  }, [handleMessage, resetState]);

  return {
    processHistoryMessages,
    hideLoadingAfterMinTime
  };
};
