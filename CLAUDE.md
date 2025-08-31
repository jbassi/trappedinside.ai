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
- **Enhanced security headers** including CSP, HSTS, and XSS protection
- **Rate limiting** with 10 connections per IP per minute
- **Origin validation** in production environment
- **Conversation history management** with automatic cleanup (max 1000 messages)
- **Restart signal handling** with history clearing capabilities
- **IP-based connection tracking** and cleanup

### Frontend (React/TypeScript)

- **Single-page application** built with React 19 and Vite
- **Context-based state management** with centralized TerminalContext
- **Custom hooks architecture** for modular functionality including:
  - `useWebSocket` - Connection and message handling with overlap detection
  - `useTerminalAnimation` - Typewriter effects and queue processing
  - `useTerminalScroll` - Unified desktop/mobile scroll behavior
- **WebSocket service layer** for connection management with auto-reconnection
- **CRT terminal simulation** with hardware-accelerated effects and dual rendering modes:
  - SVG approach for desktop/tablet with monitor background
  - Direct approach for mobile devices with responsive layout
- **Memory visualization** showing system resource usage with dynamic sizing
- **Advanced scroll behavior** with unified desktop/mobile handling
- **Tab system** with Terminal and Info screens
- **Tab visibility handling** to prevent message accumulation when inactive
- **Mobile-first responsive design** with orientation change support and touch detection
- **Tailwind CSS v4** for utility-first styling and responsive layouts
- **Vite development server** with WebSocket proxy support
- **BFCache handling** with automatic page reload for fresh state

### Key Components

#### Core Display Components

- `Terminal.tsx` - Main terminal component orchestrating all functionality with tab management
- `CRTScreen.tsx` - Terminal display with dual rendering modes:
  - SVG approach for desktop with monitor background image
  - Direct mobile approach with responsive layout and touch optimization
- `StatusBar.tsx` - Visual representation of system memory usage with responsive width calculation
- `TaskBar.tsx` - Tab navigation and scroll controls with Terminal/Info tabs
- `TerminalLine.tsx` - Individual terminal line with cursor support and last-line detection
- `PromptDisplay.tsx` - Centered, bordered ASCII box showing current LLM prompt (responsive width)
- `LoadingSpinner.tsx` - Loading state indicator with typewriter-style animation
- `InfoScreen.tsx` - Information display tab with project details and ASCII art
- `PiImage.tsx` - Raspberry Pi image component with responsive sizing
- `BarBase.tsx` - Shared base component for status and task bars

#### Context and Hooks

- `TerminalContext.tsx` - Centralized state management with comprehensive refs and state
- `TerminalSizeContext.tsx` - Dynamic terminal width calculation based on font metrics
- `useTerminalScroll.ts` - Unified scroll behavior management for desktop and mobile
- `useTerminalAnimation.ts` - Text animation, queue processing, and cursor management
- `useWebSocket.ts` - WebSocket connection, message handling, and overlap detection

#### Services and Utilities

- `websocketService.ts` - WebSocket connection management with auto-reconnection and message validation
- `mobileUtils.ts` - Multi-criteria mobile device detection (user agent, screen size, touch)
- `types.ts` - TypeScript interfaces for Memory and Status objects

## State Management Architecture

### Context Provider (TerminalContext)

- **Centralized state** for all terminal functionality including:
  - Terminal lines, cursor visibility, animation states
  - Memory and LLM prompt management
  - Loading, restart, and processing states
  - Scroll behavior tracking (isAtBottom, userScrolledUp, activelyDragging)
  - Tab selection state (terminal/info)
- **Comprehensive refs** for immediate state access and performance:
  - DOM refs (textRef, infoTextRef)
  - Animation refs (queueRef, animatingRef, processingRef)
  - State tracking refs (restartingRef, isLoadingRef, historyLoadedRef)
  - Mobile detection and scroll position refs
- **Queue signaling** for cross-hook coordination
- **Animation generation tracking** for invalidating stale operations

### Custom Hooks

Each hook is responsible for a specific aspect of functionality:

#### useTerminalScroll

- **Unified scroll detection** for both desktop and mobile with touch handling
- **Scroll position tracking** with isAtBottom state and 30px threshold
- **User interaction detection** with activelyDragging state
- **Auto-scroll management** during text animation with RAF-based smooth scrolling
- **Touch event handling** for mobile drag detection
- **Tab-aware scrolling** with different behavior for terminal vs info tabs

#### useTerminalAnimation

- **Text animation** with typewriter effect (25-50ms variable timing)
- **Queue processing** for incoming messages with generation tracking
- **Cursor blinking** management (500ms intervals when idle)
- **Animation state coordination** with visibility detection
- **Newline handling** with proper line creation and CRLF normalization
- **Tab visibility handling** with backlog text fast-forwarding
- **Generation-based cancellation** for preventing stale animations

#### useWebSocket

- **WebSocket connection** management with auto-reconnection (100ms delay)
- **Message parsing** with Zod validation and error handling
- **History vs live message** processing with different display strategies
- **Overlap detection** to prevent duplicate content from retransmissions
- **Restart signal handling** with state reset and history clearing
- **Loading state management** with minimum display times (1000ms)
- **Tab visibility handling** with pagehide/pageshow event management
- **Message buffering** and deduplication with timestamp tracking

### WebSocket Service

- **Connection management** with auto-reconnection and suppression logic
- **Message validation** using Zod schemas with ServerMessage format
- **Error handling** with 10-second loading timeout
- **Clean disconnection** handling with proper cleanup
- **Loading timeout management** with automatic error triggering
- **Reconnection control** with manual reconnect capability for fresh history
- **Event-driven architecture** with onOpen, onMessage, onClose, onError callbacks

## Development Commands

Install dependencies:

```bash
bun install
```

Development mode (starts both frontend dev server and backend):

```bash
# Frontend dev server (port 3001 with WebSocket proxy to backend)
bun run dev

# Backend server (port 3002 in dev, 3000 in prod)
bun run app.ts
```

Production build:

```bash
bun run build
bun run preview
```

Code quality:

```bash
# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
```

### Development Environment

- **Vite v7** for fast HMR and development experience
  - WebSocket proxy configuration for backend communication
  - Public directory structure with `public/` as root in dev
  - Production builds to `dist/` directory with proper asset handling
- **Tailwind CSS v4** for styling
  - Configured for all TypeScript/JavaScript files in public/ and src/
  - Scans both public/ and src/ directories
  - Supports dynamic class generation and responsive design
- **TypeScript** configuration with React 19 support and strict mode
  - ESNext target with module preservation
  - Bundler module resolution for modern development
- **Bun** for package management, script running, and server execution
- **ESLint + Prettier** for code quality and formatting

## Environment Configuration

Required environment variables:

- `JWT_SECRET` - Secret key for JWT token validation (minimum 32 characters)
- `ALLOWED_DEVICE_ID` - Device ID that's allowed to send messages (alphanumeric, hyphens, underscores only)
- `NODE_ENV` - Set to "production" for production mode (enables HSTS and origin validation)
- `PORT` - Server port (defaults: 3002 dev, 3000 prod)

### Environment Validation

The application validates environment variables on startup:
- JWT_SECRET length requirement (32+ characters for security)
- ALLOWED_DEVICE_ID format validation (regex pattern)
- Clear error messages for missing or invalid configuration

## WebSocket Protocol

The server expects JWT authentication for message sending:

```json
{ "token": "your-jwt-token" }
```

Message format for sending data:

```json
{
  "text": "content to display",
  "memory": { "available_mb": 100, "percent_used": 75, "total_mb": 400 },
  "status": { "is_restarting": false, "num_restarts": 5 },
  "prompt": "LLM prompt string"
}
```

### Server Message Format

The server sends messages in this format:

```json
{
  "type": "history" | "live",
  "messages": [
    {
      "text": "content",
      "memory": { "available_mb": 100, "percent_used": 75, "total_mb": 400 },
      "status": { "is_restarting": false, "num_restarts": 5 },
      "prompt": "LLM prompt string",
      "timestamp": 1234567890
    }
  ]
}
```

### Connection Behavior

- Initial connection includes 800ms delay before history load for smooth UX
- 10-second timeout for initial connection attempts with error handling
- Auto-reconnection with 100ms delay between attempts
- Manual reconnection capability for forcing fresh history
- Suppression logic to prevent duplicate auto-reconnects
- Page visibility handling:
  - Disconnect on pagehide to prevent stale state
  - Full page reload on BFCache restore (pageshow with persisted=true)
- Conversation history management with automatic cleanup (1000 messages max, cleanup at 1200)
- Separate message types for history (instant display) and live (animated) updates
- Rate limiting: 10 connections per IP per minute with automatic cleanup

## Development Notes & Patterns

### Component Architecture

- **Context-based state sharing** instead of prop drilling with TerminalContext
- **Custom hooks** for specific functionality (scroll, animation, WebSocket)
- **Service layer** for external communication (WebSocketService)
- **Dual rendering modes** for desktop (SVG) vs mobile (direct) approaches
- **Tab-based navigation** with Terminal and Info screens
- **Responsive design** with mobile-first approach and breakpoint detection

### Animation Optimization

- **RAF-based scrolling**: Smooth auto-scroll behavior with requestAnimationFrame
- **Hardware acceleration**: CSS transforms and effects with will-change properties
- **Efficient updates**: State batching and refs for immediate access
- **Cleanup patterns**: Proper resource management with generation tracking
- **Variable typing speed**: 25-50ms per character for natural feel
- **Smart newline handling**: CRLF normalization and proper line creation
- **Cursor management**: Visible during animation (500ms blink when idle)
- **Queue-based processing**: Ordered text chunk animation with overlap detection
- **Tab visibility handling**: Fast-forward backlog when tab becomes visible
- **Generation-based cancellation**: Prevents stale animations from interfering

### Event Handling

- **Passive listeners**: Touch and scroll optimization for better performance
- **Unified scroll handling**: Desktop and mobile with touch detection
- **Touch event management**: Start, move, end, cancel for drag detection
- **Proper cleanup**: Remove listeners and timeouts in useEffect cleanup
- **Scroll threshold**: 30px margin for "at bottom" detection
- **Drag detection**: Prevents auto-scroll during active dragging
- **Visibility-aware**: Stops animation when tab inactive, resumes on visible
- **Orientation change**: Responsive handling for mobile device rotation

### Performance Best Practices

- **RAF-based animations** for smooth 60fps performance
- **Proper cleanup** in useEffect hooks with dependency arrays
- **Passive event listeners** for touch/scroll events
- **ResizeObserver** for terminal width calculations
- **Font metrics measurement** for accurate character width calculation
- **Message deduplication** with timestamp-based overlap detection
- **Efficient text chunking** with normalized line endings
- **Controlled animation timing** with generation tracking
- **Memory management** with conversation history limits and cleanup
- **State refs** for immediate access without re-renders

### Mobile-First Considerations

- **Multi-criteria device detection** (user agent + screen size + touch)
- **Responsive breakpoints** with 768px mobile threshold
- **Touch-optimized interactions** with proper touch event handling
- **Orientation change support** with automatic re-detection
- **Mobile-specific rendering** with direct approach vs SVG
- **Touch-friendly scroll behavior** with drag detection
- **Viewport-aware sizing** with dynamic font scaling

### Error Handling & Edge Cases

- **WebSocket resilience** with auto-reconnection and timeout handling
- **Message validation** with Zod schemas and proper error boundaries
- **Loading timeouts** for connection issues (10 seconds)
- **Tab visibility** handling with BFCache detection and page reload
- **Overlap detection** for preventing duplicate message content
- **Rate limiting** handling with proper error responses
- **Environment validation** with clear startup error messages
- **Generation tracking** to prevent race conditions in animations

## Code Organization

### File Structure

```
public/                           # Vite root directory
  ├── components/
  │   ├── context/
  │   │   └── TerminalSizeContext.tsx
  │   └── terminal/
  │       ├── Terminal.tsx          # Main orchestrator component
  │       ├── CRTScreen.tsx         # Dual-mode rendering (SVG/direct)
  │       ├── TerminalContext.tsx   # Centralized state management
  │       ├── TaskBar.tsx           # Tab navigation and scroll controls
  │       ├── StatusBar.tsx         # Memory visualization
  │       ├── InfoScreen.tsx        # Info tab content
  │       ├── TerminalLine.tsx      # Individual line rendering
  │       ├── PromptDisplay.tsx     # LLM prompt display
  │       ├── LoadingSpinner.tsx    # Loading state indicator
  │       ├── PiImage.tsx           # Raspberry Pi image component
  │       ├── BarBase.tsx           # Shared bar component base
  │       └── hooks/
  │           ├── useTerminalScroll.ts    # Scroll behavior management
  │           ├── useTerminalAnimation.ts # Animation and queue processing
  │           └── useWebSocket.ts         # WebSocket connection handling
  ├── hooks/                        # Global hooks
  │   ├── useFontMeasurement.ts     # Font metrics calculation
  │   └── useTerminalWidth.ts       # Terminal width calculation
  ├── services/
  │   └── websocketService.ts       # WebSocket service class
  ├── types/
  │   └── types.ts                  # TypeScript interfaces
  ├── utils/
  │   └── mobileUtils.ts            # Mobile detection utilities
  ├── styles/
  │   └── terminalStyles.ts         # CRT effects and styling
  ├── images/                       # Static assets
  │   ├── monitor-background.svg
  │   └── pi-no-background.png
  ├── index.html                    # HTML entry point
  ├── index.tsx                     # React entry point
  └── index.css                     # Global styles

Root Configuration:
  ├── app.ts                        # Bun server with WebSocket
  ├── vite.config.ts               # Vite configuration with proxy
  ├── tailwind.config.cjs          # Tailwind CSS v4 configuration
  ├── tsconfig.json                # TypeScript strict configuration
  └── package.json                 # Dependencies and scripts
```

### Best Practices

- **Context-based state**: Centralized management with TerminalContext
- **Custom hooks**: Reusable logic separated by concern
- **Service layer**: External concerns (WebSocket) isolated
- **Clear separation**: Component responsibilities well-defined
- **Type safety**: TypeScript strict mode with Zod validation
- **Utility-first CSS**: Tailwind v4 classes for responsive styling
- **Build optimization**: Vite v7 for development and production
- **Mobile-first design**: Responsive with device detection
- **Performance optimization**: RAF, passive listeners, refs for immediate access

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
