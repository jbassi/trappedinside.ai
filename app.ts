import { join } from "path";
import { existsSync, readFileSync } from "fs";

// Store all received JSON messages
const messages: any[] = [];
const clients = new Set<Bun.ServerWebSocket<unknown>>();

const server = Bun.serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    // Serve static files from public/
    const url = new URL(req.url);
    let filePath = `public${url.pathname}`;
    if (url.pathname === "/") filePath = "public/index.html";
    try {
      const file = Bun.file(filePath);
      if (file.size > 0) {
        return new Response(file);
      }
    } catch {}
    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws: Bun.ServerWebSocket<unknown>) {
      clients.add(ws);
      // Only broadcast the text part
      ws.send(JSON.stringify({ messages: messages.map(m => ({ text: m.text ?? "" })) }));
    },
    message(ws: Bun.ServerWebSocket<unknown>, message) {
      let msgObj: any = null;
      try {
        msgObj = JSON.parse(message.toString());
      } catch {}
      if (msgObj) {
        messages.push(msgObj);
        // Only broadcast the text part
        const broadcast = { messages: messages.map(m => ({ text: m.text ?? "" })) };
        for (const client of clients) {
          if (client.readyState === 1) {
            client.send(JSON.stringify(broadcast));
          }
        }
        console.log("Received:", msgObj.text);
      }
    },
    close(ws: Bun.ServerWebSocket<unknown>) {
      clients.delete(ws);
      console.log("WebSocket connection closed");
    },
  },
});

console.log(`Listening on port ${server.port} (HTTP & WebSocket)...`);