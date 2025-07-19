import type { CSSProperties } from 'react';

// Shared terminal styles
export const terminalStyles = {
  // Base terminal text styling with responsive font size
  baseText: {
    color: '#4ade80', // text-green-400
    fontFamily: 'monospace',
    textShadow: '0 0 5px rgba(0,255,0,0.5)',
    fontSize: 'clamp(14px, 2.5vw, 16px)', // Responsive font size
  } as CSSProperties,

  // Terminal text with stronger glow
  glowText: {
    color: '#4ade80',
    fontFamily: 'monospace', 
    textShadow: '0 0 8px rgba(0,255,0,0.7)',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
  } as CSSProperties,

  // Small terminal text
  smallText: {
    color: '#4ade80',
    fontFamily: 'monospace',
    textShadow: '0 0 5px rgba(0,255,0,0.5)',
    fontSize: 'clamp(12px, 2vw, 14px)', // Smaller responsive font
  } as CSSProperties,

  // Large terminal text
  largeText: {
    color: '#4ade80',
    fontFamily: 'monospace',
    textShadow: '0 0 5px rgba(0,255,0,0.5)',
    fontSize: 'clamp(16px, 3vw, 18px)', // Larger responsive font
  } as CSSProperties,
};

// Common terminal CSS classes
export const terminalClasses = {
  baseText: 'text-green-400 font-mono',
  container: 'text-green-400 font-mono',
  glow: 'text-green-400 font-mono',
} as const;
