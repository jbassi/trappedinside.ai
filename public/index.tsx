import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";

const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

type Memory = {
  available_mb: number;
  percent_used: number;
  total_mb: number;
};

type Status = {
  is_restarting?: boolean;
  is_thinking?: boolean;
};

type Message = { text: string; memory?: Memory; status?: Status };

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
  const [lines, setLines] = useState<string[]>(["❯ "]);
  const [lastMemory, setLastMemory] = useState<Memory | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<string[]>([]);
  const animatingRef = useRef(false);
  const processingRef = useRef(false);

  // Helper to animate in new output, returns a Promise
  const animateOutput = (output: string) => {
    return new Promise<void>((resolve) => {
      animatingRef.current = true;
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
          // More human-like typing with variable speed (15-35ms per character)
          const delay = Math.random() * 20 + 15;
          setTimeout(step, delay);
        } else {
          animatingRef.current = false;
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
    
    while (queueRef.current.length > 0) {
      const chunk = queueRef.current.shift();
      if (!chunk) continue;
      
      // If chunk contains newlines, split and animate each part
      for (let part of chunk.split(/(\n)/g)) {
        if (part === "\n") {
          setLines(prev => [...prev, "❯ "]);
          await new Promise(res => setTimeout(res, 25));
        } else if (part.length > 0) {
          await animateOutput(part);
          await new Promise(res => setTimeout(res, 25 + part.length * 3));
        }
      }
    }
    
    processingRef.current = false;
  };

  // Add thinking line when thinking starts
  useEffect(() => {
    if (isThinking) {
      setLines(prev => {
        const newLines = [...prev];
        // If the last line doesn't end with a newline and has content, add a new line
        const lastLine = newLines[newLines.length - 1];
        if (lastLine && !lastLine.startsWith("❯ ") && lastLine.trim() !== "") {
          newLines.push("❯ ");
        } else if (lastLine && lastLine.startsWith("❯ ") && lastLine.slice(2).trim() !== "") {
          // If current prompt line has content, add a new prompt line
          newLines.push("❯ ");
        } else if (!lastLine || !lastLine.startsWith("❯ ")) {
          // If no prompt line exists, add one
          newLines.push("❯ ");
        }
        return newLines;
      });
    }
  }, [isThinking]);

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

  const percentUsed = lastMemory?.percent_used;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen m-0 p-4 gap-y-8">
      {/* Scrollable text area */}
      <div
        ref={textRef}
        className="box-border w-full max-w-3xl mx-auto overflow-y-auto rounded-xl p-4 pt-2 text-base bg-white/40 backdrop-blur-xl border border-white/40 whitespace-pre-line break-words shadow flex-1 font-mono text-black"
        style={{ minHeight: 0, fontFamily: 'monospace' }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex items-start">
            <span className="text-green-600 select-none">{line.startsWith("❯ ") ? "❯" : ""}</span>
            <span className="ml-2 whitespace-pre-line">{line.startsWith("❯ ") ? line.slice(2) : line}</span>
            {isThinking && i === lines.length - 1 && line.startsWith("❯ ") && (
              <span className="ml-2 text-green-600">Thinking...</span>
            )}
          </div>
        ))}
      </div>
      {/* Memory progress bar at the bottom */}
      <div
        className="w-full text-black text-center text-xs z-10 shadow-inner rounded-t-lg flex items-center justify-center"
        style={{ height: '36px', minHeight: '36px', maxHeight: '36px' }}
      >
        <div className="mx-auto max-w-md w-full">
          <div className="mb-0.5 font-semibold tracking-wide text-black">{percentUsed !== undefined ? `Memory Used: ${percentUsed.toFixed(1)}%` : "Memory Used: --"}</div>
          <div className="w-full h-3 bg-gray-300 rounded-lg overflow-hidden shadow">
            <div
              className={
                `h-full flex items-center justify-center text-white font-semibold text-xs transition-all duration-300 ease-in-out ` +
                (percentUsed !== undefined && percentUsed > 80 ? "bg-red-500" : "bg-gradient-to-r from-green-400 to-blue-500")
              }
              style={{ width: percentUsed !== undefined ? `${percentUsed}%` : "0%" }}
            >
              {percentUsed !== undefined ? `${percentUsed.toFixed(1)}%` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
