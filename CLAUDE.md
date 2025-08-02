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
- **Tailwind CSS** for utility-first styling and responsive layouts
- **Vite development server** with WebSocket proxy support

### Key Components

#### Core Display Components

- `Terminal.tsx` - Main terminal component orchestrating all functionality
- `CRTScreen.tsx` - Terminal display with CRT monitor styling and mobile/desktop variants
- `StatusBar.tsx` - Visual representation of system memory usage with responsive width calculation
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
- **Error handling** with 10-second loading timeout
- **Clean disconnection** handling
- **History loading optimization** with 800ms delay
- **Smart tab visibility handling** with state reset and reconnection
- **Conversation history management** with automatic cleanup

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

### Development Environment

- **Vite** for fast HMR and development experience
  - WebSocket proxy configuration for backend communication
  - Public directory structure with `public/` in dev
  - Production builds to `dist/` directory
- **Tailwind CSS** for styling
  - Configured for all TypeScript/JavaScript files
  - Scans both public/ and src/ directories
  - Supports dynamic class generation
- **TypeScript** configuration with React 19 support
- **Bun** for package management and running scripts

## Environment Configuration

Required environment variables:

- `JWT_SECRET` - Secret key for JWT token validation
- `ALLOWED_DEVICE_ID` - Device ID that's allowed to send messages
- `NODE_ENV` - Set to "production" for production mode
- `PORT` - Server port (defaults: 3002 dev, 3000 prod)

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
  "status": { "is_restarting": false },
  "prompt": "LLM prompt string"
}
```

### Connection Behavior

- Initial connection includes 800ms delay before history load for smooth UX
- 10-second timeout for initial connection attempts
- Auto-reconnection with 100ms delay between attempts
- Smart tab visibility handling:
  - State reset on tab becoming visible
  - Forced reconnection to refresh history
  - 100ms delay before reconnection to ensure clean state
- Conversation history management with automatic cleanup
- Separate message types for history and live updates

## Development Notes & Patterns

### Component Architecture

- **Context-based state sharing** instead of prop drilling
- **Custom hooks** for specific functionality
- **Service layer** for external communication
- **Unified scroll behavior** across devices

### Animation Optimization

- **RAF-based scrolling**: Smooth auto-scroll behavior
- **Hardware acceleration**: CSS transforms and effects
- **Efficient updates**: State batching and refs
- **Cleanup patterns**: Proper resource management
- **Variable typing speed**: 25-50ms per character for natural feel
- **Smart newline handling**: Normalized consecutive newlines
- **Cursor management**: Visible during animation, blinking when idle
- **Queue-based processing**: Ordered text chunk animation

### Event Handling

- **Passive listeners**: Touch and scroll optimization
- **Unified scroll handling**: Desktop and mobile
- **Debounced handlers**: Prevent excessive updates
- **Proper cleanup**: Remove listeners and timeouts
- **Scroll threshold**: 30px margin for "at bottom" detection
- **Drag detection**: Prevents auto-scroll during active dragging
- **Visibility-aware**: Stops animation when tab inactive

### Performance Best Practices

- **RAF-based animations** for smooth performance
- **Proper cleanup** in useEffect hooks
- **Passive event listeners** for touch/scroll
- **Debounced handlers** for scroll events
- **Optimized history loading** with delayed send
- **Smart reconnection** on tab visibility changes
- **Efficient text chunking** with normalized line endings
- **Controlled animation timing** for consistent performance

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

## Code Organization

### File Structure

```
public/
  ├── components/
  │   ├── terminal/
  │   │   ├── Terminal.tsx
  │   │   ├── CRTScreen.tsx
  │   │   ├── TerminalContext.tsx
  │   │   └── hooks/
  │   │       ├── useTerminalScroll.ts
  │   │       ├── useTerminalAnimation.ts
  │   │       └── useWebSocket.ts
  ├── services/
  │   └── websocketService.ts
  └── utils/
      └── mobileUtils.ts

Build Configuration:
  ├── vite.config.ts      # Vite configuration with WebSocket proxy
  ├── tailwind.config.cjs # Tailwind CSS configuration
  ├── tsconfig.json       # TypeScript configuration
  └── package.json        # Dependencies and scripts
```

### Best Practices

- **Context-based state**: Centralized management
- **Custom hooks**: Reusable logic
- **Service layer**: External concerns
- **Clear separation**: Component responsibilities
- **Type safety**: TypeScript and Zod
- **Utility-first CSS**: Tailwind classes for styling
- **Build optimization**: Vite for development and production

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
