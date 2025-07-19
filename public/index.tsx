import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import { CRTScreen } from "./CRTScreen";
import { MemoryBar } from "./MemoryBar";
import { TerminalLine } from "./TerminalLine";
import { PromptDisplay } from "./PromptDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { TerminalSizeProvider } from "./TerminalSizeContext";
import type { Memory } from "./types";

const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

// Zod schema for server messages
const ServerMessageSchema = z.object({
  messages: z.array(
    z.object({
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
    })
  ),
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

  // Handle tab visibility changes to prevent gibberish when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - show loading state until we get fresh data
        console.log('Tab became visible, showing loading state until fresh data arrives');
        
        // Show loading spinner
        setIsLoading(true);
        isLoadingRef.current = true;
        
        // Clear any pending animations and queue
        queueRef.current = [];
        animatingRef.current = false;
        processingRef.current = false;
        setIsAnimating(false);
        setIsProcessing(false);
        
        // Reset cursor blinking
        setCursorVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Helper to animate in new output, returns a Promise
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
        
        // Scroll to bottom during animation if user hasn't manually scrolled up
        if (!userHasScrolledRef.current && textRef.current) {
          requestAnimationFrame(() => {
            if (textRef.current && !userHasScrolledRef.current) {
              const maxScroll = textRef.current.scrollHeight - textRef.current.clientHeight;
              textRef.current.scrollTop = Math.max(0, maxScroll);
            }
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

  // Animation queue processor
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
          await new Promise(res => setTimeout(res, 50));
        } else if (part.length > 0) {
          await animateOutput(part);
          await new Promise(res => setTimeout(res, 50 + part.length * 5));
        }
      }
    }
    
    processingRef.current = false;
    setIsProcessing(false);
  };

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
          // Hide loading spinner on first message
          if (isLoadingRef.current) {
            setIsLoading(false);
            isLoadingRef.current = false;
          }
          
          const data = JSON.parse(event.data);
          const result = ServerMessageSchema.safeParse(data);
          if (result.success) {
            const messages = result.data.messages;
            
            // Process each message chunk
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

  // Smart scrolling behavior - detect user scroll and delay auto-scroll
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [autoScrollTimeout, setAutoScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const lastLinesLengthRef = useRef(lines.length);
  const userHasScrolledRef = useRef(false);
  

  // Detect when user manually scrolls up
  useEffect(() => {
    const handleScroll = () => {
      if (textRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = textRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance
        
        // If user scrolled up from the bottom, mark as manually scrolled
        if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
          setUserHasScrolled(true);
          userHasScrolledRef.current = true;
          
          // Clear any existing timeout
          if (autoScrollTimeout) {
            clearTimeout(autoScrollTimeout);
          }
          
          // Set a 2-second timeout to resume auto-scroll (regardless of new content)
          const timeout = setTimeout(() => {
            setUserHasScrolled(false);
            userHasScrolledRef.current = false;
            setAutoScrollTimeout(null);
            
            // Scroll to bottom if not already at bottom
            if (textRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = textRef.current;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
              
              if (!isAtBottom) {
                requestAnimationFrame(() => {
                  if (textRef.current) {
                    const maxScroll = textRef.current.scrollHeight - textRef.current.clientHeight;
                    textRef.current.scrollTop = Math.max(0, maxScroll);
                  }
                });
              }
            }
          }, 2000);
          
          setAutoScrollTimeout(timeout);
        }
        
        // If user scrolled back to bottom manually, resume auto-scroll
        if (isAtBottom && userHasScrolled) {
          setUserHasScrolled(false);
          userHasScrolledRef.current = false;
          if (autoScrollTimeout) {
            clearTimeout(autoScrollTimeout);
            setAutoScrollTimeout(null);
          }
        }
        
        lastScrollTopRef.current = scrollTop;
      }
    };

    const element = textRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [userHasScrolled, autoScrollTimeout]);

  // Detect new content and manage auto-scroll behavior
  useEffect(() => {
    // Check if new content has arrived
    if (lines.length > lastLinesLengthRef.current) {
      lastLinesLengthRef.current = lines.length;
      
      // If user hasn't scrolled up, scroll immediately after DOM update
      if (!userHasScrolled) {
        if (textRef.current) {
          // Use requestAnimationFrame to ensure DOM is updated before scrolling
          requestAnimationFrame(() => {
            if (textRef.current) {
              const maxScroll = textRef.current.scrollHeight - textRef.current.clientHeight;
              textRef.current.scrollTop = Math.max(0, maxScroll);
            }
          });
        }
      }
    }
  }, [lines, userHasScrolled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimeout) {
        clearTimeout(autoScrollTimeout);
      }
    };
  }, [autoScrollTimeout]);


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
