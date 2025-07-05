import { join } from "path";
import { existsSync, readFileSync } from "fs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const MemorySchema = z.object({
  available_mb: z.number(),
  percent_used: z.number(),
  total_mb: z.number(),
});
const IncomingMessageSchema = z.object({
  text: z.string(),
  memory: MemorySchema.optional(),
});
const AuthMessageSchema = z.object({
  token: z.string(),
});

// Store all received JSON messages
const messages: any[] = [];
const clients = new Set<Bun.ServerWebSocket<unknown>>();

// Load secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_DEVICE_ID = process.env.ALLOWED_DEVICE_ID;
if (!JWT_SECRET || !ALLOWED_DEVICE_ID) {
  throw new Error("JWT_SECRET and ALLOWED_DEVICE_ID must be set in environment variables or .env file");
}

// Determine environment
const isProd = process.env.NODE_ENV === "production";
const staticDir = isProd ? "dist" : "public";
const port = process.env.PORT ? Number(process.env.PORT) : (isProd ? 3000 : 3002);

const server = Bun.serve({
  port,
  fetch(req, server) {
    const url = new URL(req.url);
    // Only upgrade to WebSocket on /ws
    if (url.pathname === "/ws" && server.upgrade(req)) {
      return;
    }
    // Serve static files from the appropriate directory
    let filePath = `${staticDir}${url.pathname}`;
    if (url.pathname === "/") filePath = `${staticDir}/index.html`;
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
      // Don't send any historical messages to new connections
      // The message sender creates new connections for each chunk
    },
    message(ws: Bun.ServerWebSocket<unknown>, message) {
      let parsed: any;
      try {
        parsed = JSON.parse(message.toString());
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON" }));
        ws.close();
        return;
      }
      // Only require JWT for sending messages
      if (!(ws as any).isAuthenticated) {
        const authResult = AuthMessageSchema.safeParse(parsed);
        if (!authResult.success) {
          ws.send(JSON.stringify({ error: "Missing or invalid JWT" }));
          ws.close();
          return;
        }
        const token = authResult.data.token;
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
      const msgResult = IncomingMessageSchema.safeParse(parsed);
      if (!msgResult.success) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
        return;
      }
      const msgObj = msgResult.data;
      messages.push(msgObj);
      // Only broadcast the new message, not the entire history
      const broadcast = { messages: [{ text: msgObj.text ?? "", memory: msgObj.memory }] };
      for (const client of clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify(broadcast));
        }
      }
      console.log("Received:", msgObj.text, msgObj.memory ? JSON.stringify(msgObj.memory) : "");
    },
    close(ws: Bun.ServerWebSocket<unknown>) {
      clients.delete(ws);
      console.log("WebSocket connection closed");
    },
  },
});

console.log(`Listening on port ${port} (HTTP & WebSocket)...`);
console.log(`Serving static files from: ${staticDir}/`);