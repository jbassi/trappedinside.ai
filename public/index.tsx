import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import { CRTScreen } from "./CRTScreen";
import { MemoryBar } from "./MemoryBar";
import { TerminalLine } from "./TerminalLine";
import type { Memory, Status, Message } from "./types";

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
          is_thinking: z.boolean().optional(),
        })
        .optional(),
    })
  ),
});

function App() {
  // Terminal prompt configuration
  const PROMPT = "❯ ";
  
  const [lines, setLines] = useState<string[]>([PROMPT]);
  const [lastMemory, setLastMemory] = useState<Memory | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<string[]>([]);
  const animatingRef = useRef(false);
  const processingRef = useRef(false);
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

    // Only start blinking when not animating or processing
    if (!isAnimating && !isProcessing) {
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500); // Blink every 500ms
    } else {
      // Keep cursor visible during animation
      setCursorVisible(true);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isAnimating, isProcessing]); // Re-run when animation state changes

  // Helper to animate in new output, returns a Promise
  const animateOutput = (output: string) => {
    return new Promise<void>((resolve) => {
      animatingRef.current = true;
      setIsAnimating(true);
      setCursorVisible(true); // Keep cursor visible during animation
      let i = 0;
      function step() {
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
      const chunk = queueRef.current.shift();
      if (!chunk) continue;
      
      // If chunk contains newlines, split and animate each part
      for (let part of chunk.split(/(\n)/g)) {
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

  // Add thinking line when thinking starts
  useEffect(() => {
    if (isThinking) {
      setLines(prev => {
        const newLines = [...prev];
        const lastLine = newLines[newLines.length - 1];
        
        // Add empty prompt line if the last line has content
        if (lastLine && lastLine.startsWith(PROMPT) && lastLine.slice(PROMPT.length).trim() !== "") {
          newLines.push(PROMPT);
        }
        
        // Add thinking prompt line
        newLines.push(PROMPT);
        
        return newLines;
      });
    } else {
      // When thinking stops, remove empty thinking line if it exists
      setLines(prev => {
        const newLines = [...prev];
        const lastLine = newLines[newLines.length - 1];
        
        // Remove the last line if it's an empty prompt (the thinking line)
        if (lastLine && lastLine === PROMPT) {
          newLines.pop();
        }
        
        // Ensure we always have at least one prompt line
        if (newLines.length === 0) {
          newLines.push(PROMPT);
        }
        
        return newLines;
      });
    }
  }, [isThinking]);

  // Ensure we always have at least one prompt line
  useEffect(() => {
    if (lines.length === 0) {
      setLines([PROMPT]);
    }
  }, [lines, PROMPT]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const result = ServerMessageSchema.safeParse(data);
          if (result.success) {
            const messages = result.data.messages;
            
            // Process each message chunk
            for (const msg of messages) {
              if (msg.text) {
                queueRef.current.push(msg.text);
              }
              // Update memory if present
              if (msg.memory) {
                setLastMemory(msg.memory);
              }
              // Update thinking status if present
              if (msg.status?.is_thinking !== undefined) {
                setIsThinking(msg.status.is_thinking);
              }
            }
            
            // Process queue without overlapping
            processQueue();
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        // Automatically reconnect after a short delay
        reconnectTimeout = setTimeout(connect, 100);
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimeout);
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
      <div className="flex-1 min-h-0">
              <CRTScreen 
        textRef={textRef}
        memoryBar={<MemoryBar memory={lastMemory} terminalWidth={terminalWidth} />}
      >
        {lines.map((line, i) => (
          <TerminalLine
            key={i}
            line={line}
            isLastLine={i === lines.length - 1}
            isThinking={isThinking}
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
