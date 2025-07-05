import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";

const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

type Memory = {
  available_mb: number;
  percent_used: number;
  total_mb: number;
};

type Message = { text: string; memory?: Memory };

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
    })
  ),
});

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const result = ServerMessageSchema.safeParse(data);
        if (result.success) {
          setMessages(result.data.messages);
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  // Concatenate all message texts into a single string
  const allText = messages.map((msg) => msg.text).join("");

  // Get the most recent memory.percent_used value
  const lastMemory = [...messages].reverse().find((msg) => msg.memory && typeof msg.memory.percent_used === "number");
  const percentUsed = lastMemory?.memory?.percent_used;

  // Scroll to bottom when new text arrives
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [allText]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen m-0 p-0 gap-y-8">
      {/* Header */}
      <h1
        className="m-0 text-lg text-center font-extrabold shadow rounded-b-lg tracking-wide flex items-center justify-center"
        style={{ color: '#000', opacity: 1, height: '48px', minHeight: '48px', maxHeight: '48px' }}
      >
        Musings of a LLM
      </h1>
      {/* Scrollable text area */}
      <div
        ref={textRef}
        className="box-border w-full max-w-3xl mx-auto overflow-y-auto rounded-xl p-4 pt-2 text-base bg-white/40 backdrop-blur-xl border border-white/40 whitespace-pre-line break-words shadow flex-1"
        style={{ minHeight: 0 }}
      >
        {allText}
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
