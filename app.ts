import { join } from "path";
import { existsSync, readFileSync } from "fs";

const messages: string[] = [];
const clients = new Set<WebSocket>();

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
    open(ws) {
      clients.add(ws);
      ws.send(JSON.stringify({ messages }));
    },
    message(ws, message) {
      const msg = message.toString();
      messages.push(msg);
      for (const client of clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ messages }));
        }
      }
      console.log("Received:", msg);
    },
    close(ws) {
      clients.delete(ws);
      console.log("WebSocket connection closed");
    },
  },
});

console.log(`Listening on port ${server.port} (HTTP & WebSocket)...`);