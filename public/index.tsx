import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const WS_URL = `ws://${window.location.host}`;

type Message = { text: string };

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
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

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem("msg") as HTMLInputElement;
    if (wsRef.current && input.value) {
      // Send as JSON with a 'text' property
      wsRef.current.send(JSON.stringify({ text: input.value }));
      input.value = "";
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", margin: "2em" }}>
      <h1>React WebSocket Messages</h1>
      <div style={{ border: "1px solid #ccc", padding: "1em", minHeight: "2em" }}>
        {messages.map((msg, i) => (
          <div key={i}>{msg.text}</div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ marginTop: "1em" }}>
        <input name="msg" type="text" placeholder="Type a message..." autoComplete="off" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
