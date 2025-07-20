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

  // Helper function to hide loading with minimum display time
  const hideLoadingAfterMinTime = useCallback((callback?: () => void) => {
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

  // Helper function to process history messages (instant display)
  const processHistoryMessages = useCallback((messages: Message[]) => {
    // Build the complete conversation from history
    const conversationLines = [PROMPT];
    let currentLine = PROMPT;
    
    for (const msg of messages) {
      // Update memory if present
      if (msg.memory) {
        setLastMemory(msg.memory);
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
      // Handle live messages with existing animation logic
      
      // Hide loading spinner on first live message (if history wasn't received)
      if (isLoadingRef.current) {
        historyLoadedRef.current = true; // Consider history loaded
        hideLoadingAfterMinTime(); // Use minimum loading time
      }
      
      // Process each live message chunk
      for (const msg of messages) {
        if (msg.text) {
          // Only queue text if tab is visible to prevent accumulation
          if (document.visibilityState === 'visible') {
            queueRef.current.push(msg.text);
          }
        }
        // Update memory if present
        if (msg.memory) {
          setLastMemory(msg.memory);
        }
        // Handle restarting status synchronously
        if (msg.status?.is_restarting !== undefined) {
          setIsRestarting(msg.status.is_restarting);
          restartingRef.current = msg.status.is_restarting;
          
          // Clear terminal and reset state immediately when restarting
          if (msg.status.is_restarting) {
            setLines([PROMPT]);
            queueRef.current = [];
            animatingRef.current = false;
            processingRef.current = false;
            setLastMemory(undefined);
            setLlmPrompt(DEFAULT_LLM_PROMPT);
            historyLoadedRef.current = false; // Reset history state
          }
        }
        // Update prompt if present (check for non-empty string)
        if (msg.prompt && msg.prompt.trim() !== "") {
          setLlmPrompt(msg.prompt);
        } else if (msg.prompt !== undefined && msg.prompt.trim() === "") {
          // If server sends empty prompt, fall back to default
          setLlmPrompt(DEFAULT_LLM_PROMPT);
        }
      }
    }
  }, [
    processHistoryMessages,
    hideLoadingAfterMinTime,
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
    DEFAULT_LLM_PROMPT,
    PROMPT
  ]);

  // Helper to reset all state
  const resetState = useCallback(() => {
    // Reset state
    setLines([PROMPT]);
    setLastMemory(undefined);
    setLlmPrompt(DEFAULT_LLM_PROMPT);
    setIsLoading(true);
    setIsRestarting(false);
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
        if (isLoadingRef.current) {
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
