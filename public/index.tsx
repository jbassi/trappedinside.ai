import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import { CRTScreen } from "./CRTScreen";
import { MemoryBar } from "./MemoryBar";
import { TerminalLine } from "./TerminalLine";
import { PromptDisplay } from "./PromptDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
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
  const [terminalWidth, setTerminalWidth] = useState(80);
  const [, forceUpdate] = useState({});

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

  // Scroll to bottom when new text arrives
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [lines]);

  // Calculate terminal width based on container
  useEffect(() => {
    const calculateWidth = () => {
      if (textRef.current) {
        const containerWidth = textRef.current.clientWidth;
        const paddingLeft = parseFloat(getComputedStyle(textRef.current).paddingLeft) || 0;
        const paddingRight = parseFloat(getComputedStyle(textRef.current).paddingRight) || 0;
        const availableWidth = containerWidth - paddingLeft - paddingRight;
        
        // Use a more conservative character width estimate for monospace
        const charWidth = 9.6; // More accurate for typical monospace fonts
        const estimatedChars = Math.floor(availableWidth / charWidth);
        setTerminalWidth(estimatedChars);
        // Force re-render of memory bar when width changes
        forceUpdate({});
      }
    };

    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    return () => window.removeEventListener('resize', calculateWidth);
  }, []);

  const percentUsed = lastMemory?.percent_used;

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col p-4 resize overflow-auto">
      {/* Fixed, resizable, scrollable CRT screen */}
      <div className="flex-1 min-h-0 relative">
        <CRTScreen 
          textRef={textRef}
          memoryBar={!isLoading ? <MemoryBar memory={lastMemory} terminalWidth={terminalWidth} /> : undefined}
          promptDisplay={!isLoading ? <PromptDisplay prompt={llmPrompt} terminalWidth={terminalWidth} /> : undefined}
          loadingSpinner={isLoading ? <LoadingSpinner terminalWidth={terminalWidth} /> : undefined}
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
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
