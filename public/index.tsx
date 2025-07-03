import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const WS_URL = window.location.protocol === "https:"
  ? `wss://${window.location.host}`
  : `ws://${window.location.host}`;

type Message = { text: string };

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
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

  return (
    <div style={{ fontFamily: "sans-serif", margin: "2em" }}>
      <h1>LLM Art</h1>
      <div style={{ border: "1px solid #ccc", padding: "1em", minHeight: "2em" }}>
        {messages.map((msg, i) => (
          <div key={i}>{msg.text}</div>
        ))}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
