import { join } from "path";
import { existsSync, readFileSync } from "fs";
import jwt from "jsonwebtoken";

// Store all received JSON messages
const messages: any[] = [];
const clients = new Set<Bun.ServerWebSocket<unknown>>();

// Load secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_DEVICE_ID = process.env.ALLOWED_DEVICE_ID;
if (!JWT_SECRET || !ALLOWED_DEVICE_ID) {
  throw new Error("JWT_SECRET and ALLOWED_DEVICE_ID must be set in environment variables or .env file");
}

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
      (ws as any).isAuthenticated = false;
      clients.add(ws);
      // Always send the message list to any client
      ws.send(JSON.stringify({ messages: messages.map(m => ({ text: m.text ?? "" })) }));
    },
    message(ws: Bun.ServerWebSocket<unknown>, message) {
      // Only require JWT for sending messages
      if (!(ws as any).isAuthenticated) {
        let token: string | null = null;
        try {
          const data = JSON.parse(message.toString());
          token = data.token;
        } catch {}
        if (!token) {
          // Not authenticated, drop the connection if trying to send
          ws.send(JSON.stringify({ error: "Missing JWT: connection will be closed" }));
          ws.close();
          return;
        }
        try {
          const payload = jwt.verify(token, JWT_SECRET) as any;
          if (payload.device !== ALLOWED_DEVICE_ID) {
            ws.send(JSON.stringify({ error: "Unauthorized device" }));
            ws.close();
            return;
          }
          (ws as any).isAuthenticated = true;
          ws.send(JSON.stringify({ status: "authenticated" }));
        } catch (err) {
          ws.send(JSON.stringify({ error: "Invalid JWT" }));
          ws.close();
        }
        return;
      }

      // Only allow sending messages if authenticated
      let msgObj: any = null;
      try {
        msgObj = JSON.parse(message.toString());
      } catch {}
      if (msgObj && typeof msgObj.text === "string") {
        messages.push(msgObj);
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