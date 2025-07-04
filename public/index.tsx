import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";

const WS_URL = window.location.protocol === "https:"
  ? `wss://${window.location.host}`
  : `ws://${window.location.host}`;

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
    <div
      style={{
        fontFamily: "sans-serif",
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        background: "#fafafa",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        height: "100vh",
      }}
    >
      {/* Header */}
      <h1
        style={{
          margin: 0,
          padding: "1em",
          background: "#222",
          color: "#fff",
          fontSize: "1.5em",
          textAlign: "center",
        }}
      >
        Musings of a LLM
      </h1>
      {/* Scrollable text area */}
      <div
        ref={textRef}
        style={{
          boxSizing: "border-box",
          width: "100vw",
          overflowY: "auto",
          border: "none",
          padding: "2em 1em 1em 1em",
          fontSize: "1.2em",
          background: "#fff",
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}
      >
        {allText}
      </div>
      {/* Memory progress bar at the bottom */}
      <div
        style={{
          width: "100vw",
          background: "#222",
          color: "#fff",
          textAlign: "center",
          fontSize: "1.1em",
          padding: "0.7em 0 1.2em 0",
          letterSpacing: "0.05em",
          zIndex: 1000,
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: 400 }}>
          <div style={{ marginBottom: 4 }}>{percentUsed !== undefined ? `Memory Used: ${percentUsed.toFixed(1)}%` : "Memory Used: --"}</div>
          <div style={{
            width: "100%",
            height: 18,
            background: "#444",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>
            <div style={{
              width: percentUsed !== undefined ? `${percentUsed}%` : "0%",
              height: "100%",
              background: percentUsed !== undefined && percentUsed > 80 ? "#e74c3c" : "#4caf50",
              transition: "width 0.3s cubic-bezier(.4,2,.6,1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
            }}>
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
