import jwt from 'jsonwebtoken';
import { z } from 'zod';

const MemorySchema = z.object({
  available_mb: z.number(),
  percent_used: z.number(),
  total_mb: z.number(),
});
const StatusSchema = z.object({
  is_restarting: z.boolean().optional(),
  num_restarts: z.number().optional(),
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
  status?: { is_restarting?: boolean; num_restarts?: number };
  prompt?: string;
  timestamp: number;
}

// Store conversation history with timestamp and metadata
const conversationHistory: ConversationMessage[] = [];
const clients = new Set<Bun.ServerWebSocket<unknown>>();

// Configuration
const MAX_HISTORY_MESSAGES = 1000; // Limit history to prevent memory issues
const HISTORY_CLEANUP_THRESHOLD = 1200; // Clean up when we exceed this

// Rate limiting configuration
const connectionCounts = new Map<string, { count: number; lastReset: number }>();
const MAX_CONNECTIONS_PER_IP = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Helper function to check rate limits
const checkRateLimit = (clientIP: string): boolean => {
  const now = Date.now();
  const clientData = connectionCounts.get(clientIP);

  if (!clientData) {
    connectionCounts.set(clientIP, { count: 1, lastReset: now });
    return true;
  }

  // Reset if window expired
  if (now - clientData.lastReset > RATE_LIMIT_WINDOW) {
    clientData.count = 1;
    clientData.lastReset = now;
    return true;
  }

  if (clientData.count >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }

  clientData.count++;
  return true;
};

// Load and validate secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_DEVICE_ID = process.env.ALLOWED_DEVICE_ID;

if (!JWT_SECRET || !ALLOWED_DEVICE_ID) {
  throw new Error(
    'JWT_SECRET and ALLOWED_DEVICE_ID must be set in environment variables or .env file'
  );
}

// Validate JWT_SECRET strength
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

// Validate ALLOWED_DEVICE_ID format
if (!/^[a-zA-Z0-9_-]+$/.test(ALLOWED_DEVICE_ID)) {
  throw new Error(
    'ALLOWED_DEVICE_ID must contain only alphanumeric characters, hyphens, and underscores'
  );
}

// Determine environment
const isProd = process.env.NODE_ENV === 'production';
const staticDir = isProd ? 'dist' : 'public';
const port = process.env.PORT ? Number(process.env.PORT) : isProd ? 3000 : 3002;

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
    const historyMessages = conversationHistory.map((msg) => ({
      text: msg.text,
      memory: msg.memory,
      status: msg.status,
      prompt: msg.prompt,
      timestamp: msg.timestamp,
    }));

    const historyPayload = {
      type: 'history',
      messages: historyMessages,
    };

    ws.send(JSON.stringify(historyPayload));
    console.log(`Sent ${historyMessages.length} historical messages to new client`);
  }
};

Bun.serve({
  port,
  fetch(req, server) {
    const url = new URL(req.url);

    // Security headers for all responses
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:; font-src 'self';",
      'Strict-Transport-Security': isProd ? 'max-age=31536000; includeSubDomains' : undefined,
    };

    // WebSocket upgrade with origin validation and rate limiting
    if (url.pathname === '/ws') {
      const clientIP =
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

      // Rate limit check
      if (!checkRateLimit(clientIP)) {
        return new Response('Too many connections', { status: 429 });
      }

      // Origin validation in production
      if (isProd) {
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');
        if (origin && !origin.includes(host || '')) {
          return new Response('Forbidden', { status: 403 });
        }
      }

      if (server.upgrade(req)) {
        return;
      }
    }

    // Serve static files from the appropriate directory
    let filePath = `${staticDir}${url.pathname}`;
    if (url.pathname === '/') filePath = `${staticDir}/index.html`;

    try {
      const file = Bun.file(filePath);
      if (file.size > 0) {
        // Clean undefined headers
        const cleanHeaders: Record<string, string> = {};
        Object.entries(securityHeaders).forEach(([key, value]) => {
          if (value !== undefined) cleanHeaders[key] = value;
        });
        return new Response(file, { headers: cleanHeaders });
      }
    } catch (err) {
      // File not found or other error, continue to 404 response
    }

    const cleanHeaders: Record<string, string> = {};
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value !== undefined) cleanHeaders[key] = value;
    });
    return new Response('Not found', { status: 404, headers: cleanHeaders });
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
        ws.send(JSON.stringify({ error: 'Invalid JSON' }));
        ws.close();
        return;
      }
      // Only require JWT for sending messages
      if (!(ws as any).isAuthenticated) {
        const authResult = AuthMessageSchema.safeParse(parsed);
        if (!authResult.success) {
          ws.send(JSON.stringify({ error: 'Missing or invalid JWT' }));
          ws.close();
          return;
        }
        const token = authResult.data.token;
        try {
          const payload = jwt.verify(token, JWT_SECRET) as any;
          if (payload.device !== ALLOWED_DEVICE_ID) {
            ws.send(JSON.stringify({ error: 'Unauthorized device' }));
            ws.close();
            return;
          }
          (ws as any).isAuthenticated = true;
          ws.send(JSON.stringify({ status: 'authenticated' }));
        } catch (err) {
          ws.send(JSON.stringify({ error: 'Invalid JWT' }));
          ws.close();
        }
        return;
      }
      // Only allow sending messages if authenticated
      const msgResult = IncomingMessageSchema.safeParse(parsed);
      if (!msgResult.success) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
        return;
      }
      const msgObj = msgResult.data;

      // Check for restart signal and clear history if needed
      if (msgObj.status?.is_restarting) {
        console.log('Restart signal received - clearing conversation history');
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
        messages: [
          {
            text: msgObj.text ?? '',
            memory: msgObj.memory,
            status: msgObj.status,
            prompt: msgObj.prompt,
            timestamp: conversationMessage.timestamp,
          },
        ],
      };

      for (const client of clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify(liveBroadcast));
        }
      }

      console.log('Received message from authenticated client');
      console.log(`Conversation history now contains ${conversationHistory.length} messages`);
    },
    close(ws: Bun.ServerWebSocket<unknown>) {
      clients.delete(ws);

      // Clean up rate limiting data periodically
      const now = Date.now();
      for (const [ip, data] of connectionCounts.entries()) {
        if (now - data.lastReset > RATE_LIMIT_WINDOW * 2) {
          connectionCounts.delete(ip);
        } else if (data.count > 0) {
          data.count = Math.max(0, data.count - 1);
        }
      }

      console.log('WebSocket connection closed');
    },
  },
});

console.log(`Listening on port ${port} (HTTP & WebSocket)...`);
console.log(`Serving static files from: ${staticDir}/`);
console.log(
  `Conversation history management: Max ${MAX_HISTORY_MESSAGES} messages, cleanup at ${HISTORY_CLEANUP_THRESHOLD}`
);
