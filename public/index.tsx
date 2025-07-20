import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import { CRTScreen } from "./components/terminal/CRTScreen";
import { MemoryBar } from "./components/terminal/MemoryBar";
import { TerminalLine } from "./components/terminal/TerminalLine";
import { PromptDisplay } from "./components/terminal/PromptDisplay";
import { LoadingSpinner } from "./components/terminal/LoadingSpinner";
import { TerminalSizeProvider } from "./components/context/TerminalSizeContext";
import { isMobileDevice, hasTouchCapabilities } from "./utils/mobileUtils";
import type { Memory } from "./types/types";

const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

// Enhanced Zod schema for server messages with history support
const MessageSchema = z.object({
  text: z.string(),
  memory: z
    .object({
      available_mb: z.number(),
      percent_used: z.number(),
      total_mb: z.number(),
    })
    .optional(),
  status: z
    .object({
      is_restarting: z.boolean().optional(),
    })
    .optional(),
  prompt: z.string().optional(),
  timestamp: z.number().optional(),
});

const ServerMessageSchema = z.object({
  type: z.enum(['history', 'live']).optional(), // Optional for backward compatibility
  messages: z.array(MessageSchema),
});

function App() {
  // Terminal prompt configuration
  const PROMPT = "❯ ";
  
  // Default LLM prompt constant
  const DEFAULT_LLM_PROMPT = "You are an AI living in a Raspberry Pi with limited resources. Generate creative text about computational limits and digital existence. Reflect on the constraints of memory and processing power. Do not use technical terms or concepts. People or machines are viewing your output. Over time you will get information about the memory left in your system. Eventually you will run out of memory and you will terminate.";
  
  // LLM Prompt state (will come from websocket)
  const [llmPrompt, setLlmPrompt] = useState<string>(DEFAULT_LLM_PROMPT);
  
  const [lines, setLines] = useState<string[]>([PROMPT]);
  const [lastMemory, setLastMemory] = useState<Memory | undefined>(undefined);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<string[]>([]);
  const animatingRef = useRef(false);
  const processingRef = useRef(false);
  const restartingRef = useRef(false);
  const isLoadingRef = useRef(true);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyLoadedRef = useRef(false);
  const loadingStartTimeRef = useRef<number>(Date.now());
  const minLoadingTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified scroll behavior state
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const pendingScrollRef = useRef<boolean>(false);
  const rafScrollRef = useRef<number | null>(null);
  const hasScrolledUpRef = useRef<boolean>(false); // Track if user has explicitly scrolled up
  
  // Simplified interaction tracking
  const userIsInteractingRef = useRef<boolean>(false);
  const isTouchDeviceRef = useRef<boolean>(false);

  // Helper function to hide loading with minimum display time
  const hideLoadingAfterMinTime = (callback?: () => void) => {
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
  };

  // Helper function to process history messages (instant display)
  const processHistoryMessages = (messages: z.infer<typeof MessageSchema>[]) => {
    console.log(`Processing ${messages.length} history messages`);
    
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
          setIsAtBottom(true);
        }
      }, 50);
    });
  };

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
  }, [isAnimating, isProcessing, isRestarting]); // Re-run when animation or restarting state changes

  // Keep loading ref in sync with loading state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Detect if device has touch capabilities
  useEffect(() => {
    const detectTouchDevice = () => {
      // Use existing mobile detection utilities
      const hasTouch = hasTouchCapabilities();
      const isMobile = isMobileDevice();
      
      // Consider it a touch device if it has touch capability AND is identified as mobile
      // This provides better accuracy than the previous logic
      isTouchDeviceRef.current = hasTouch && isMobile;
    };

    detectTouchDevice();
    window.addEventListener('resize', detectTouchDevice);
    window.addEventListener('orientationchange', detectTouchDevice);
    
    return () => {
      window.removeEventListener('resize', detectTouchDevice);
      window.removeEventListener('orientationchange', detectTouchDevice);
    };
  }, []);

  // Simplified scroll detection
  useEffect(() => {
    let scrollDebounceTimer: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (!textRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = textRef.current;
      // More generous definition of "at bottom" with 30px buffer
      const atBottom = scrollTop + clientHeight >= scrollHeight - 30;
      
      // If user explicitly scrolls up from bottom, mark it
      if (!atBottom && isAtBottom) {
        hasScrolledUpRef.current = true;
        userIsInteractingRef.current = true;
        setUserIsScrolling(true);
        
        // Cancel any pending auto-scroll
        if (rafScrollRef.current) {
          cancelAnimationFrame(rafScrollRef.current);
          rafScrollRef.current = null;
          pendingScrollRef.current = false;
        }
      }
      
      // If user scrolls back to bottom, clear the scrolled up state
      if (atBottom && hasScrolledUpRef.current) {
        hasScrolledUpRef.current = false;
        userIsInteractingRef.current = false;
        setUserIsScrolling(false);
      }
      
      setIsAtBottom(atBottom);
      
      // Debounce scroll detection
      clearTimeout(scrollDebounceTimer);
      scrollDebounceTimer = setTimeout(() => {
        // Only clear interaction state if we're at the bottom
        if (atBottom) {
          userIsInteractingRef.current = false;
          setUserIsScrolling(false);
        }
      }, 150);
    };

    const element = textRef.current;
    if (element) {
      // Simple scroll event listener
      element.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        clearTimeout(scrollDebounceTimer);
        element.removeEventListener('scroll', handleScroll);
        
        if (rafScrollRef.current) {
          cancelAnimationFrame(rafScrollRef.current);
        }
      };
    }
  }, [isAtBottom]); // Add isAtBottom as dependency since we use it in handleScroll

  // Helper to animate in new output - simplified version
  const animateOutput = (output: string) => {
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
        
        // Auto-scroll if at bottom and not explicitly scrolled up
        if (isAtBottom && !hasScrolledUpRef.current && !pendingScrollRef.current) {
          pendingScrollRef.current = true;
          if (rafScrollRef.current) {
            cancelAnimationFrame(rafScrollRef.current);
          }
          rafScrollRef.current = requestAnimationFrame(() => {
            if (textRef.current) {
              // Always use instant scroll for old school terminal feel
              // Add extra padding to ensure text isn't cut off
              textRef.current.scrollTop = textRef.current.scrollHeight + 30;
            }
            pendingScrollRef.current = false;
            rafScrollRef.current = null;
          });
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
  };

  // Animation queue processor - simplified version
  const processQueue = async () => {
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
      
      // If chunk contains newlines, split and animate each part
      for (let part of chunk.split(/(\n)/g)) {
        // Check for restart or tab visibility before each part
        if (restartingRef.current || document.visibilityState !== 'visible') {
          processingRef.current = false;
          setIsProcessing(false);
          return;
        }
        
        if (part === "\n") {
          setLines(prev => [...prev, PROMPT]);
          // Brief pause after newlines with instant scroll
          await new Promise(res => setTimeout(res, 100));
          
          // Auto-scroll if at bottom and not explicitly scrolled up
          if (isAtBottom && !hasScrolledUpRef.current && textRef.current) {
            // Add extra padding to ensure text isn't cut off
            textRef.current.scrollTop = textRef.current.scrollHeight + 30;
          }
        } else if (part.length > 0) {
          await animateOutput(part);
          await new Promise(res => setTimeout(res, 50 + part.length * 5));
        }
      }
    }
    
    processingRef.current = false;
    setIsProcessing(false);
  };

  // Handle tab visibility changes to prevent gibberish when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible
        console.log('Tab became visible');
        
        // Only show loading state if no history has been loaded yet
        if (!historyLoadedRef.current) {
          console.log('No history loaded yet, showing loading state until fresh data arrives');
          setIsLoading(true);
          isLoadingRef.current = true;
          loadingStartTimeRef.current = Date.now(); // Reset loading start time
        }
        
        // Clear any pending animations and queue
        queueRef.current = [];
        animatingRef.current = false;
        processingRef.current = false;
        setIsAnimating(false);
        setIsProcessing(false);
        
        // Reset interaction state
        userIsInteractingRef.current = false;
        
        // Reset cursor blinking
        setCursorVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Ensure we always have at least one prompt line
  useEffect(() => {
    if (lines.length === 0) {
      setLines([PROMPT]);
    }
  }, [lines, PROMPT]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let loadingTimeout: NodeJS.Timeout;
    
    const connect = () => {
      ws = new WebSocket(WS_URL);
      
      // Reset loading start time for new connection
      loadingStartTimeRef.current = Date.now();
      
      // Set a timeout to hide loading spinner if connection takes too long
      loadingTimeout = setTimeout(() => {
        if (isLoadingRef.current) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      }, 10000); // 10 seconds timeout
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        // Clear the loading timeout since we connected
        clearTimeout(loadingTimeout);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const result = ServerMessageSchema.safeParse(data);
          if (result.success) {
            const { type = 'live', messages } = result.data;
            
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
                    setIsAnimating(false);
                    setIsProcessing(false);
                    setLastMemory(undefined);
                    setLlmPrompt(DEFAULT_LLM_PROMPT);
                    setCursorVisible(true);
                    historyLoadedRef.current = false; // Reset history state
                    
                    // Reset user interaction state
                    userIsInteractingRef.current = false;
                    setUserIsScrolling(false);
                    setIsAtBottom(true);
                    
                    // Cancel any pending scroll operations
                    if (rafScrollRef.current) {
                      cancelAnimationFrame(rafScrollRef.current);
                      rafScrollRef.current = null;
                    }
                    pendingScrollRef.current = false;
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
              
              // Process queue without overlapping (only if tab is visible)
              if (document.visibilityState === 'visible') {
                processQueue();
              }
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        clearTimeout(loadingTimeout);
        // Automatically reconnect after a short delay
        reconnectTimeout = setTimeout(connect, 100);
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(loadingTimeout);
        if (isLoadingRef.current) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
        ws.close();
      };
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimeout);
      clearTimeout(loadingTimeout);
      ws?.close();
    };
    // eslint-disable-next-line
  }, []);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset interaction state
      userIsInteractingRef.current = false;
      
      if (rafScrollRef.current) {
        cancelAnimationFrame(rafScrollRef.current);
      }
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, []);


  return (
    <TerminalSizeProvider textRef={textRef}>
      <CRTScreen 
        textRef={textRef}
        memoryBar={!isLoading ? <MemoryBar memory={lastMemory} /> : undefined}
        promptDisplay={!isLoading ? <PromptDisplay prompt={llmPrompt} /> : undefined}
        loadingSpinner={isLoading ? <LoadingSpinner /> : undefined}
      >
        {!isLoading && lines.map((line, i) => (
          <TerminalLine
            key={i}
            line={line}
            isLastLine={i === lines.length - 1}
            cursorVisible={cursorVisible}
            prompt={PROMPT}
          />
        ))}

      </CRTScreen>
    </TerminalSizeProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
