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
- **Auto-reconnection logic** with 100ms delay for resilient connections

### Frontend (React/TypeScript)
- **Single-page application** built with React 19 and Vite
- **Context-based state management** with centralized TerminalContext
- **Custom hooks architecture** for modular functionality
- **WebSocket service layer** for connection management
- **CRT terminal simulation** with hardware-accelerated typewriter animation effects
- **Memory visualization** showing system resource usage with dynamic sizing
- **Advanced scroll behavior** with unified desktop/mobile handling
- **Tab visibility handling** to prevent message accumulation when inactive
- **Mobile-first responsive design** with orientation change support

### Key Components

#### Core Display Components
- `Terminal.tsx` - Main terminal component orchestrating all functionality
- `CRTScreen.tsx` - Terminal display with CRT monitor styling and mobile/desktop variants
- `MemoryBar.tsx` - Visual representation of system memory usage with responsive width calculation
- `TerminalLine.tsx` - Individual terminal line with cursor support and last-line detection
- `PromptDisplay.tsx` - Centered, bordered ASCII box showing current LLM prompt (responsive width)
- `LoadingSpinner.tsx` - Loading state indicator with typewriter-style animation
- `PiAsciiArt.tsx` - Raspberry Pi ASCII art with responsive scaling and orientation detection

#### Context and Hooks
- `TerminalContext.tsx` - Centralized state management and shared functionality
- `useTerminalScroll.ts` - Unified scroll behavior management
- `useTerminalAnimation.ts` - Text animation and queue processing
- `useWebSocket.ts` - WebSocket connection and message handling

#### Services
- `websocketService.ts` - WebSocket connection management and message parsing
- `mobileUtils.ts` - Mobile device detection using multiple criteria
- `terminalStyles.ts` - Centralized CRT effects and terminal styling

## State Management Architecture

### Context Provider (TerminalContext)
- **Centralized state** for all terminal functionality
- **Shared refs** for immediate state access
- **Animation state** management
- **Scroll behavior** state
- **Loading and restart** handling
- **Memory and prompt** management

### Custom Hooks
Each hook is responsible for a specific aspect of functionality:

#### useTerminalScroll
- **Unified scroll detection** for both desktop and mobile
- **Scroll position tracking** with isAtBottom state
- **User interaction** handling
- **Auto-scroll management** during text animation

#### useTerminalAnimation
- **Text animation** with typewriter effect
- **Queue processing** for incoming messages
- **Cursor blinking** management
- **Animation state** coordination

#### useWebSocket
- **WebSocket connection** management
- **Message parsing** with Zod validation
- **History message** processing
- **Live message** handling

### WebSocket Service
- **Connection management** with auto-reconnection
- **Message validation** using Zod schemas
- **Error handling** and timeout management
- **Clean disconnection** handling

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

## Development Notes & Patterns

### Component Architecture
- **Context-based state sharing** instead of prop drilling
- **Custom hooks** for specific functionality
- **Service layer** for external communication
- **Unified scroll behavior** across devices

### Performance Best Practices
- **RAF-based animations** for smooth performance
- **Proper cleanup** in useEffect hooks
- **Passive event listeners** for touch/scroll
- **Debounced handlers** for scroll events

### Mobile-First Considerations
- **Unified scroll handling** for touch and mouse
- **Orientation change** support
- **Device detection** with multiple criteria
- **Touch-friendly interactions**

### Error Handling & Edge Cases
- **WebSocket resilience** with auto-reconnection
- **Message validation** with Zod schemas
- **Loading timeouts** for connection issues
- **Tab visibility** handling

## Code Organization Philosophy

- **Context-based state management** for cleaner component interaction
- **Custom hooks** for reusable logic
- **Service layer** for external concerns
- **Clear separation** of responsibilities
- **Type safety** with TypeScript and Zod

## Testing & Debugging

The application requires testing on both mobile and desktop for:
- Scroll behavior during text animation
- WebSocket connection handling
- State management through context
- Hook interaction and cleanup
- Service layer reliability

## AI Documentation Maintenance

### When to Update This Documentation
- **Architecture changes** that affect component organization
- **New patterns** in hooks or context usage
- **Service layer** modifications
- **State management** improvements
- **Mobile interaction** changes

### How to Update Documentation
- **Document new patterns** as they emerge
- **Update architecture diagrams** with changes
- **Add examples** of hook usage
- **Include context patterns** and best practices
- **Note mobile considerations** in changes

### Documentation Maintenance Guidelines
- **Keep architecture clear** - document structure changes
- **Update patterns** - note new approaches
- **Test thoroughly** - validate on all devices
- **Document reasoning** - explain architectural decisions
- **Keep in sync** - update both .mdc and .md files