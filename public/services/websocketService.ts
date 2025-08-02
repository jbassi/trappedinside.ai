import { z } from 'zod';

// Define the message schema
export const MessageSchema = z.object({
  text: z.string(),
  memory: z
    .object({
      available_mb: z.number(),
      percent_used: z.number(),
      total_mb: z.number(),
    })
    .optional(),
  status: z
    .object({
      is_restarting: z.boolean().optional(),
      num_restarts: z.number().optional(),
    })
    .optional(),
  prompt: z.string().optional(),
  timestamp: z.number().optional(),
});

export const ServerMessageSchema = z.object({
  type: z.enum(['history', 'live']).optional(), // Optional for backward compatibility
  messages: z.array(MessageSchema),
});

// Define message types
export type Message = z.infer<typeof MessageSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// WebSocket connection options
export interface WebSocketOptions {
  onOpen?: () => void;
  onMessage?: (data: ServerMessage) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
}

// WebSocket service
export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketOptions;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private loadingTimeout: NodeJS.Timeout | null = null;
  private isReconnecting: boolean = false;
  private isDisconnecting: boolean = false;

  constructor(url: string, options: WebSocketOptions) {
    this.url = url;
    this.options = {
      reconnectDelay: 100,
      ...options,
    };
  }

  // Force a reconnection to get fresh history
  reconnect(): void {
    // Only reconnect if not already in progress
    if (!this.isReconnecting) {
      this.isReconnecting = true;
      this.disconnect();
      this.connect();
    }
  }

  // Connect to WebSocket server
  connect(): void {
    // Don't connect if intentionally disconnecting
    if (this.isDisconnecting) {
      return;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.ws = new WebSocket(this.url);

    // Set loading timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    this.loadingTimeout = setTimeout(() => {
      this.options.onError?.(new Event('timeout'));
      this.loadingTimeout = null;
    }, 10000); // 10 second timeout

    // Set up event handlers
    this.ws.onopen = () => {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
      this.isReconnecting = false;
      this.options.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const result = ServerMessageSchema.safeParse(data);
        if (result.success) {
          this.options.onMessage?.(result.data);
        } else {
          console.error('Invalid message format received');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message');
      }
    };

    this.ws.onclose = () => {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }

      // Only call onClose if not intentionally disconnecting
      if (!this.isDisconnecting) {
        this.options.onClose?.();
      }

      // Only auto-reconnect if not manually disconnecting
      if (!this.isDisconnecting && !this.isReconnecting) {
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, this.options.reconnectDelay);
      }

      this.ws = null;
    };

    this.ws.onerror = (error) => {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
      this.options.onError?.(error);

      // Close connection on error to trigger reconnect
      if (this.ws) {
        this.ws.close();
      }
    };
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.isDisconnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Reset flags after cleanup
    this.isDisconnecting = false;
    this.isReconnecting = false;
  }

  // Send message to WebSocket server
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }
}
