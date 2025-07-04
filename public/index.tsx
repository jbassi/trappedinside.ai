import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const WS_URL = window.location.protocol === "https:"
  ? `wss://${window.location.host}`
  : `ws://${window.location.host}`;

type Message = { text: string };

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  // Concatenate all message texts into a single string
  const allText = messages.map((msg) => msg.text).join("");

  // Scroll to bottom when new text arrives
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [allText]);

  return (
    <div style={{ fontFamily: "sans-serif", margin: 0, padding: 0, minHeight: "100vh", background: "#fafafa" }}>
      <h1 style={{ margin: 0, padding: "1em", background: "#222", color: "#fff", fontSize: "1.5em", textAlign: "center" }}>Musings of a LLM</h1>
      <div
        ref={textRef}
        style={{
          boxSizing: "border-box",
          width: "100vw",
          height: "calc(100vh - 4em)",
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
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
