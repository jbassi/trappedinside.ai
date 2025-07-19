# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a WebSocket-based real-time terminal application that simulates an AI living in a Raspberry Pi with limited resources. The architecture consists of:

### Backend (app.ts)
- **Bun server** serving both HTTP static files and WebSocket connections
- **JWT authentication** required for sending messages (but not for receiving)
- **Message broadcasting** system that distributes incoming messages to all connected clients
- **Environment-based configuration** supporting both development and production modes
- **Dual-mode serving**: Uses `public/` directory in dev, `dist/` in production

### Frontend (React/TypeScript)
- **Single-page application** built with React 19 and Vite
- **Real-time WebSocket client** that receives streamed text messages
- **CRT terminal simulation** with typewriter animation effects
- **Memory visualization** showing system resource usage
- **Smart scrolling behavior** that detects user interaction
- **Tab visibility handling** to prevent message accumulation when inactive

### Key Components
- `CRTScreen.tsx` - Main terminal display with CRT monitor styling
- `MemoryBar.tsx` - Visual representation of system memory usage
- `TerminalLine.tsx` - Individual terminal line with cursor support
- `PromptDisplay.tsx` - Shows the current LLM prompt being used
- `LoadingSpinner.tsx` - Loading state indicator

## Development Commands

Install dependencies:
```bash
bun install
```

Development mode (starts both frontend dev server and backend):
```bash
# Frontend dev server (port 3001 with proxy to backend)
bun run dev

# Backend server (port 3002 in dev, 3000 in prod)
bun run app.ts
```

Production build:
```bash
bun run build
bun run preview
```

## Environment Configuration

Required environment variables:
- `JWT_SECRET` - Secret key for JWT token validation
- `ALLOWED_DEVICE_ID` - Device ID that's allowed to send messages
- `NODE_ENV` - Set to "production" for production mode
- `PORT` - Server port (defaults: 3002 dev, 3000 prod)

## WebSocket Protocol

The server expects JWT authentication for message sending:
```json
{"token": "your-jwt-token"}
```

Message format for sending data:
```json
{
  "text": "content to display",
  "memory": {"available_mb": 100, "percent_used": 75, "total_mb": 400},
  "status": {"is_restarting": false},
  "prompt": "LLM prompt string"
}
```

## Development Notes

- Frontend runs on port 3001 with proxy to backend on 3002 during development
- Production mode serves built files from `dist/` directory
- WebSocket connection auto-reconnects on disconnection
- Terminal supports typewriter-style text animation with variable typing speed
- Memory bar dynamically adjusts width based on terminal dimensions
- System handles tab visibility changes to prevent message queue buildup