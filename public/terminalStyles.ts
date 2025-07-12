import type { CSSProperties } from 'react';

// Shared terminal styles
export const terminalStyles = {
  // Base terminal text styling
  baseText: {
    color: '#4ade80', // text-green-400
    fontFamily: 'monospace',
    textShadow: '0 0 5px rgba(0,255,0,0.5)',
    fontSize: '16px', // Base terminal font size
  } as CSSProperties,

  // Terminal text with stronger glow
  glowText: {
    color: '#4ade80',
    fontFamily: 'monospace', 
    textShadow: '0 0 8px rgba(0,255,0,0.7)',
    fontSize: '16px',
  } as CSSProperties,

  // Small terminal text
  smallText: {
    color: '#4ade80',
    fontFamily: 'monospace',
    textShadow: '0 0 5px rgba(0,255,0,0.5)',
    fontSize: '14px',
  } as CSSProperties,

  // Large terminal text
  largeText: {
    color: '#4ade80',
    fontFamily: 'monospace',
    textShadow: '0 0 5px rgba(0,255,0,0.5)',
    fontSize: '18px',
  } as CSSProperties,
};

// Common terminal CSS classes
export const terminalClasses = {
  baseText: 'text-green-400 font-mono',
  container: 'text-green-400 font-mono',
  glow: 'text-green-400 font-mono',
} as const;
