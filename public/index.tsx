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
  const [cursorVisible, setCursorVisible] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<string[]>([]);
  const animatingRef = useRef(false);
  const processingRef = useRef(false);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [terminalWidth, setTerminalWidth] = useState(80);
  const [, forceUpdate] = useState({});

  // Cursor blinking effect
  useEffect(() => {
    // Clear any existing interval
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
      cursorIntervalRef.current = null;
    }

    // Start cursor blinking when idle
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500); // Blink every 500ms

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  // CRT Screen Component with CSS Bulge Distortion
  const CRTScreen = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="relative">
        {/* Outer CRT Monitor Bezel */}
        <div
          className="relative mx-auto"
          style={{ 
            border: '20px solid #d4c4a0',
            borderRadius: '20px',
            boxShadow: `
              inset 0 0 0 8px #1a1a1a,
              inset 0 0 0 12px #0a0a0a,
              inset 0 0 0 16px #1a1a1a,
              inset 0 0 0 20px #0a0a0a,
              0 8px 16px rgba(0, 0, 0, 0.3)
            `
          }}
        >
          {/* CRT Screen with True Barrel Distortion */}
          <div
            className="relative bg-black overflow-hidden"
            style={{
              borderRadius: '16px',
              background: `
                radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%),
                linear-gradient(45deg, rgba(0,255,0,0.02) 0%, transparent 50%, rgba(0,255,0,0.02) 100%)
              `,
              boxShadow: `
                inset 0 0 100px rgba(0,255,0,0.1),
                inset 0 0 20px rgba(0,0,0,0.8)
              `
            }}
          >
            {/* True Barrel Distortion Container */}
            <div
              className="relative"
              style={{
                borderRadius: '16px',
                // Apply barrel distortion using CSS filter
                filter: `
                  contrast(1.05) 
                  brightness(1.02)
                `,
                // Geometric barrel distortion using transform
                transform: `
                  perspective(800px) 
                  rotateX(2deg) 
                  rotateY(0deg) 
                  scale3d(1.02, 1.02, 1)
                `,
                transformOrigin: 'center center',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Content with barrel distortion warping */}
              <div
                className="relative"
                style={{
                  borderRadius: '16px',
                  // True barrel distortion using CSS transforms
                  transform: `
                    perspective(600px) 
                    rotateX(-1deg) 
                    scale3d(0.98, 0.98, 1)
                  `,
                  transformOrigin: 'center center',
                  // Apply barrel distortion using CSS clip-path for geometric warping
                  clipPath: `
                    polygon(
                      1% 0%, 5% 0%, 95% 0%, 99% 0%, 
                      100% 1%, 100% 5%, 100% 95%, 100% 99%, 
                      99% 100%, 95% 100%, 5% 100%, 1% 100%, 
                      0% 99%, 0% 95%, 0% 5%, 0% 1%
                    )
                  `
                }}
              >
                {/* Barrel distortion overlay with geometric warping */}
                <div
                  className="absolute inset-0"
                  style={{
                    // Apply counter-distortion to create barrel effect
                    transform: `
                      perspective(500px) 
                      rotateX(1.5deg) 
                      scale3d(1.03, 1.03, 1)
                    `,
                    transformOrigin: 'center center',
                    borderRadius: '16px'
                  }}
                >
                  {/* Scanlines that follow the barrel curvature */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 2px,
                        rgba(0,255,0,0.03) 2px,
                        rgba(0,255,0,0.03) 4px
                      )`,
                      borderRadius: '16px',
                      zIndex: 10,
                      // Make scanlines follow the barrel curve
                      transform: `
                        perspective(700px) 
                        rotateX(-0.5deg) 
                        scale3d(1.01, 1.01, 1)
                      `,
                      transformOrigin: 'center center'
                    }}
                  />
                  
                  {/* Barrel distortion vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(ellipse 90% 90% at 50% 50%, 
                          transparent 0%, 
                          transparent 60%, 
                          rgba(0,0,0,0.05) 70%, 
                          rgba(0,0,0,0.15) 80%, 
                          rgba(0,0,0,0.3) 90%, 
                          rgba(0,0,0,0.5) 95%, 
                          rgba(0,0,0,0.7) 100%
                        )
                      `,
                      borderRadius: '16px',
                      zIndex: 5,
                      // Vignette follows barrel distortion
                      transform: `
                        perspective(600px) 
                        rotateX(-0.8deg) 
                        scale3d(1.015, 1.015, 1)
                      `,
                      transformOrigin: 'center center'
                    }}
                  />

                  {/* Center bulge highlight */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(ellipse 15% 15% at 50% 50%, 
                          rgba(255,255,255,0.2) 0%, 
                          rgba(255,255,255,0.12) 40%, 
                          rgba(255,255,255,0.06) 60%, 
                          rgba(255,255,255,0.03) 80%, 
                          transparent 100%
                        )
                      `,
                      borderRadius: '16px',
                      zIndex: 15,
                      // Center highlight emphasizes the barrel bulge
                      transform: `
                        perspective(400px) 
                        rotateX(-1.2deg) 
                        scale3d(1.025, 1.025, 1)
                      `,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
                
                {/* Content with geometric barrel warping */}
                <div
                  ref={textRef}
                  className="relative px-12 py-8 text-base whitespace-pre-line break-words font-mono text-green-400 h-full overflow-y-auto"
                  style={{ 
                    minHeight: '70vh',
                    fontFamily: 'monospace',
                    textShadow: '0 0 5px rgba(0,255,0,0.5)',
                    borderRadius: '16px',
                    zIndex: 1,
                    // Apply barrel distortion to text geometry
                    transform: `
                      perspective(900px) 
                      rotateX(-0.8deg) 
                      scale3d(1.008, 1.008, 1)
                    `,
                    transformOrigin: 'center center',
                    // Additional barrel distortion using CSS filters
                    filter: `
                      contrast(1.02) 
                      brightness(1.01)
                    `,
                    // Subtle geometric warping of text container
                    clipPath: `
                      polygon(
                        0.5% 0%, 99.5% 0%, 
                        100% 0.5%, 100% 99.5%, 
                        99.5% 100%, 0.5% 100%, 
                        0% 99.5%, 0% 0.5%
                      )
                    `
                  }}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Memory component that looks like htop
  const MemoryBar = ({ memory }: { memory?: Memory }) => {
    // Always show the bar, use default values when no data
    const usedMB = memory ? memory.total_mb - memory.available_mb : 0;
    const usedGB = (usedMB / 1024).toFixed(2);
    const totalGB = memory ? (memory.total_mb / 1024).toFixed(2) : '0.00';
    const percentUsed = memory ? memory.percent_used : 0.0;
    
    // Calculate dynamic bar length based on terminal width
    const textPortion = `Mem[] Used ${percentUsed.toFixed(1)}% (${usedGB}G/${totalGB}G)`;
    const textLength = textPortion.length;
    const availableForBar = Math.max(15, terminalWidth - textLength - 3); // Reduced buffer to 3 chars
    const barLength = Math.min(availableForBar, 120); // Increased cap to 120 chars
    
    const filledLength = Math.round((percentUsed / 100) * barLength);
    const emptyLength = barLength - filledLength;
    const filledBar = '|'.repeat(filledLength);
    const emptyBar = '.'.repeat(emptyLength);
    
    return (
      <div className="text-black font-mono mb-2 select-none w-full overflow-hidden whitespace-nowrap bg-green-400 py-1 px-2 flex justify-center">
        <span>Mem[{filledBar}{emptyBar}] Used {percentUsed.toFixed(1)}% ({usedGB}G/{totalGB}G)</span>
      </div>
    );
  };

  // Helper to animate in new output, returns a Promise
  const animateOutput = (output: string) => {
    return new Promise<void>((resolve) => {
      animatingRef.current = true;
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
    setCursorVisible(true); // Keep cursor visible during processing
    
    while (queueRef.current.length > 0) {
      const chunk = queueRef.current.shift();
      if (!chunk) continue;
      
      // If chunk contains newlines, split and animate each part
      for (let part of chunk.split(/(\n)/g)) {
        if (part === "\n") {
          setLines(prev => [...prev, "❯ "]);
          await new Promise(res => setTimeout(res, 50));
        } else if (part.length > 0) {
          await animateOutput(part);
          await new Promise(res => setTimeout(res, 50 + part.length * 5));
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
        const lastLine = newLines[newLines.length - 1];
        
        // Add empty prompt line first, then thinking line
        if (lastLine && lastLine.startsWith("❯ ") && lastLine.slice(2).trim() === "") {
          // If the last line is already an empty prompt, add another for thinking
          newLines.push("❯ ");
          return newLines;
        } else {
          // Add empty prompt line, then thinking prompt line
          newLines.push("❯ ");
          newLines.push("❯ ");
          return newLines;
        }
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
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen m-0 p-4">
      {/* Scrollable text area */}
      <CRTScreen>
        <MemoryBar memory={lastMemory} />
        {lines.map((line, i) => {
          const isLastLine = i === lines.length - 1;
          const isPromptLine = line.startsWith("❯ ");
          const lineContent = isPromptLine ? line.slice(2) : line;
          const showThinking = isThinking && isLastLine && isPromptLine;
          const showCursor = isLastLine && !showThinking;
          
          return (
            <div key={i} className="flex items-start">
              <span className="text-green-400 select-none">{isPromptLine ? "❯" : ""}</span>
              <span className="ml-2 whitespace-pre-line text-green-400">
                {lineContent}
                {showThinking && "Thinking..."}
                {showCursor && (
                  <span className={`text-green-400 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>
                    █
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </CRTScreen>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
