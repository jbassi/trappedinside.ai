import jwt from "jsonwebtoken";
import { z } from "zod";

const MemorySchema = z.object({
  available_mb: z.number(),
  percent_used: z.number(),
  total_mb: z.number(),
});
const StatusSchema = z.object({
  is_restarting: z.boolean().optional(),
});
const IncomingMessageSchema = z.object({
  text: z.string(),
  memory: MemorySchema.optional(),
  status: StatusSchema.optional(),
  prompt: z.string().optional(),
});
const AuthMessageSchema = z.object({
  token: z.string(),
});

// Enhanced conversation history storage
interface ConversationMessage {
  text: string;
  memory?: { available_mb: number; percent_used: number; total_mb: number };
  status?: { is_restarting?: boolean };
  prompt?: string;
  timestamp: number;
}

// Store conversation history with timestamp and metadata
const conversationHistory: ConversationMessage[] = [];
const clients = new Set<Bun.ServerWebSocket<unknown>>();

// Configuration
const MAX_HISTORY_MESSAGES = 1000; // Limit history to prevent memory issues
const HISTORY_CLEANUP_THRESHOLD = 1200; // Clean up when we exceed this

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

// Helper function to manage history size
const cleanupHistory = () => {
  if (conversationHistory.length > HISTORY_CLEANUP_THRESHOLD) {
    // Keep only the most recent MAX_HISTORY_MESSAGES
    conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_MESSAGES);
    console.log(`History cleaned up, now containing ${conversationHistory.length} messages`);
  }
};

// Helper function to send conversation history to a client
const sendHistoryToClient = (ws: Bun.ServerWebSocket<unknown>) => {
  if (conversationHistory.length > 0) {
    const historyMessages = conversationHistory.map(msg => ({
      text: msg.text,
      memory: msg.memory,
      status: msg.status,
      prompt: msg.prompt,
      timestamp: msg.timestamp,
    }));

    const historyPayload = {
      type: 'history',
      messages: historyMessages
    };

    ws.send(JSON.stringify(historyPayload));
    console.log(`Sent ${historyMessages.length} historical messages to new client`);
  }
};

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
      
      // Send conversation history to new client after a brief delay
      // This allows the frontend to set up properly before receiving history
      // and provides a smoother loading experience
      setTimeout(() => {
        if (clients.has(ws) && ws.readyState === 1) {
          sendHistoryToClient(ws);
        }
      }, 800); // Increased from 100ms to 800ms for better loading UX
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
      
      // Check for restart signal and clear history if needed
      if (msgObj.status?.is_restarting) {
        console.log("Restart signal received - clearing conversation history");
        conversationHistory.length = 0; // Clear the history array
      }
      
      // Create conversation message with timestamp
      const conversationMessage: ConversationMessage = {
        text: msgObj.text,
        memory: msgObj.memory,
        status: msgObj.status,
        prompt: msgObj.prompt,
        timestamp: Date.now(),
      };
      
      // Add to history (unless it's just a restart signal with no content)
      if (msgObj.text || msgObj.memory || msgObj.prompt) {
        conversationHistory.push(conversationMessage);
        cleanupHistory(); // Manage history size
      }
      
      // Broadcast as live message to all clients
      const liveBroadcast = {
        type: 'live',
        messages: [{
          text: msgObj.text ?? "",
          memory: msgObj.memory,
          status: msgObj.status,
          prompt: msgObj.prompt,
          timestamp: conversationMessage.timestamp,
        }]
      };
      
      for (const client of clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify(liveBroadcast));
        }
      }
      
      console.log("Received:", msgObj.text, msgObj.memory ? JSON.stringify(msgObj.memory) : "", msgObj.status ? JSON.stringify(msgObj.status) : "", msgObj.prompt ? `Prompt: ${msgObj.prompt}` : "");
      console.log(`Conversation history now contains ${conversationHistory.length} messages`);
    },
    close(ws: Bun.ServerWebSocket<unknown>) {
      clients.delete(ws);
      console.log("WebSocket connection closed");
    },
  },
});

console.log(`Listening on port ${port} (HTTP & WebSocket)...`);
console.log(`Serving static files from: ${staticDir}/`);
console.log(`Conversation history management: Max ${MAX_HISTORY_MESSAGES} messages, cleanup at ${HISTORY_CLEANUP_THRESHOLD}`);