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
- **Real-time WebSocket client** that receives streamed text messages
- **CRT terminal simulation** with hardware-accelerated typewriter animation effects
- **Memory visualization** showing system resource usage with dynamic sizing
- **Advanced scroll behavior** with mobile/desktop differentiation and touch momentum detection
- **Tab visibility handling** to prevent message accumulation when inactive
- **Mobile-first responsive design** with orientation change support

### Key Components

#### Core Display Components
- `CRTScreen.tsx` - Main terminal display with CRT monitor styling and mobile/desktop variants
- `MemoryBar.tsx` - Visual representation of system memory usage with responsive width calculation
- `TerminalLine.tsx` - Individual terminal line with cursor support and last-line detection
- `PromptDisplay.tsx` - Centered, bordered ASCII box showing current LLM prompt (responsive width)
- `LoadingSpinner.tsx` - Loading state indicator with typewriter-style animation
- `PiAsciiArt.tsx` - Raspberry Pi ASCII art with responsive scaling and orientation detection

#### Utility Components
- `TerminalSizeContext.tsx` - Context for terminal dimensions and responsive behavior
- `mobileUtils.ts` - Mobile device detection using multiple criteria (UA, screen size, touch)
- `terminalStyles.ts` - Centralized CRT effects and terminal styling

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

## Advanced Technical Features

### Mobile Optimization & Touch Handling
The application implements sophisticated mobile-first design patterns:

#### Touch Scroll Behavior
- **Device Detection**: Uses `mobileUtils.ts` with 3-criteria detection (UA + screen size + touch capability)
- **Touch Momentum Handling**: 2-3 second protection windows after touch ends to respect momentum scrolling
- **Separate Event Logic**: Different timing thresholds for mobile (1000ms) vs desktop (500ms) interactions
- **Passive Event Listeners**: All touch/scroll events use passive listeners for optimal performance

#### Responsive Animation Performance
- **RAF-based Scrolling**: Uses `requestAnimationFrame` for smooth auto-scroll coordination
- **Batched Updates**: Reduces scroll attempts during animation (every 5th character on desktop)
- **Dynamic Timing**: Mobile uses 32ms debouncing (30fps), desktop uses 16ms (60fps)
- **Hardware Acceleration**: CSS transforms, `will-change`, and `contain` properties

### Scroll Behavior Architecture
Complex scroll management system handles:

#### Race Condition Prevention
- **Multiple State Tracking**: Uses both React state and refs for immediate access
- **Intersection Observer**: Reliable "at bottom" detection with mobile-aware delays  
- **Touch Momentum Detection**: Tracks momentum state for up to 3 seconds after touch end
- **Animation Conflict Resolution**: Different scroll methods during active animation vs idle

#### Performance Optimizations
- **Instant vs Smooth Scrolling**: Instant scroll during animation, smooth when idle
- **Debounced Event Handling**: Device-specific timing to prevent excessive processing
- **Container Measurement**: ResizeObserver + orientation events for dynamic width calculation
- **Memory Leak Prevention**: Comprehensive cleanup of timeouts, listeners, and observers

### Character Width & Layout Calculations
Sophisticated responsive text layout system:

#### Dynamic Width Calculation
- **Character Measurement**: Creates test elements to measure exact character width in current font
- **Container Padding Awareness**: Accounts for `px-4` (32px) + scrollbar + browser margins
- **Mobile Safety Buffers**: Different padding buffers for mobile (16px) vs desktop (8px)
- **Viewport Scaling**: Handles browser zoom and mobile viewport scaling
- **Minimum/Maximum Constraints**: Ensures readable content while preventing overflow

#### ASCII Art & Border Rendering
- **Centered Layout**: Flexbox centering with proper text alignment preservation
- **Border Character Protection**: Prevents right-side `#` border cutoff on mobile
- **Responsive Scaling**: CSS transforms for ASCII art scaling (not font-size changes)
- **Overflow Protection**: `textOverflow: 'clip'` with proper container constraints

## Development Notes & Patterns

### State Management Patterns
- **useRef for Immediate Access**: User interaction tracking, animation state, device detection
- **useState for UI Updates**: Loading states, cursor visibility, scroll position
- **Event Handler Debouncing**: Device-specific timing with cleanup patterns
- **Tab Visibility Optimization**: Prevents data accumulation when browser tab inactive

### Performance Best Practices
- **Hardware Acceleration**: CSS transforms, GPU-optimized animations
- **Event Listener Cleanup**: Always remove listeners in useEffect cleanup
- **Animation Timing**: Variable typewriter speed (25-50ms) with smooth cursor blinking
- **Memory Management**: Proper timeout cancellation and RAF cleanup

### Mobile-First Considerations
- **Touch Event Coordination**: `touchstart`, `touchmove`, `touchend`, `touchcancel` handling
- **Momentum Scrolling**: iOS Safari and Android Chrome momentum detection
- **Orientation Changes**: Dynamic remeasurement on device rotation
- **Status Bar Integration**: Dark theme with `theme-color="#000000"` and iOS-specific meta tags

### Error Handling & Edge Cases
- **WebSocket Resilience**: 10-second loading timeout with auto-reconnection
- **Message Parsing**: Zod schema validation with error boundaries
- **Container Measurement Failures**: Fallback width calculations with minimum constraints
- **Animation State Synchronization**: Proper restart handling with state reset

## Code Organization Philosophy

- **Component Composition**: Single responsibility with clear prop interfaces
- **Utility Centralization**: Mobile detection, styling, and measurement utilities
- **Type Safety**: Strict TypeScript with Zod runtime validation
- **Performance Monitoring**: Console logging for development debugging
- **Responsive Architecture**: Mobile/desktop logic separation rather than unified approaches

## Testing & Debugging

The application requires testing on both mobile and desktop for:
- Scroll behavior during text animation
- Touch momentum handling and interaction timing
- Container width calculations and overflow prevention
- WebSocket connection resilience and state synchronization
- Memory visualization accuracy and responsive sizing

## AI Documentation Maintenance

### When to Update This Documentation
- **New technical patterns** discovered during development that improve performance or UX
- **Mobile behavior changes** requiring updated timing, interaction patterns, or device detection
- **Performance optimizations** that should become standard practice across the codebase
- **Common bugs or edge cases** that need prevention guidelines for future development
- **New component patterns** that follow established architecture principles
- **Updated browser APIs** or React patterns that significantly affect the codebase
- **Architecture shifts** that change how components interact or state is managed

### How to Update Documentation
- **Add new technical sections** for emerging patterns, technologies, or performance improvements
- **Update existing patterns** when better approaches are discovered through development
- **Include specific code examples** for complex patterns, optimizations, or troubleshooting
- **Document performance improvements** with concrete timing, behavior, or measurement changes
- **Add troubleshooting sections** for common development issues and their solutions
- **Update mobile-specific guidelines** as new device behaviors, browser updates, or interaction patterns are discovered
- **Expand testing guidelines** when new edge cases or platform-specific issues are identified

### Documentation Maintenance Guidelines
- **Keep technical details practical** - focus on patterns that actually improve the codebase
- **Maintain architectural consistency** - ensure new documentation aligns with existing patterns
- **Test thoroughly** - validate new patterns on both mobile and desktop before documenting
- **Document reasoning** - explain why specific patterns are important for this project's unique requirements
- **Update both files** - keep `.cursor/rules/llm-art-web-project.mdc` and `CLAUDE.md` in sync
- **Version significant changes** - note major architectural shifts, new technologies, or breaking changes
- **Include performance metrics** - document specific timing improvements, memory usage changes, or user experience enhancements
- **Cross-reference patterns** - link related concepts across different sections for better understanding