import React from 'react';
import { terminalStyles, terminalClasses } from '../../styles/terminalStyles';

export const InfoScreen: React.FC = () => {
  return (
    <div className={`${terminalClasses.baseText} p-4 pb-6 text-lg whitespace-pre-line break-words font-mono text-green-400`} style={terminalStyles.baseText}>
      <h1 className="text-xl font-bold mb-4 text-green-300">About LLM Art Web</h1>
      
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-green-300">Project Overview</h2>
        <p>
          LLM Art Web is a real-time WebSocket-based terminal application simulating an AI living in a Raspberry Pi with limited resources.
          The system provides a nostalgic CRT terminal experience with hardware-accelerated effects and typewriter animations.
        </p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-green-300">Architecture</h2>
        <p>
          The application consists of:
          
          • Backend: Bun.serve() WebSocket + HTTP server
          • Frontend: React with context-based state management
          • WebSocket: Real-time message streaming with reconnection handling
          • UI: CRT terminal simulation with hardware-accelerated effects
        </p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-green-300">Features</h2>
        <p>
          • Real-time WebSocket communication
          • CRT terminal simulation with hardware-accelerated effects
          • Typewriter animation with variable timing
          • Smart scroll behavior with unified desktop/mobile handling
          • Memory visualization with dynamic width-based display
          • Tab visibility handling to prevent message accumulation
          • Auto-reconnection with configurable delay
        </p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-green-300">Technical Stack</h2>
        <p>
          • Frontend: React, TypeScript, Tailwind CSS
          • Backend: Bun runtime
          • Communication: WebSockets
          • State Management: Context API
          • Animation: Custom hooks and RAF-based animations
        </p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-green-300">Performance Optimizations</h2>
        <p>
          • Hardware-accelerated CSS transforms and effects
          • RAF-based scrolling for smooth animations
          • Efficient state updates with batching and refs
          • Proper cleanup patterns for resource management
          • Passive event listeners for touch and scroll optimization
        </p>
      </section>
      
      <section>
        <h2 className="text-lg font-bold mb-2 text-green-300">Credits</h2>
        <p>
          Created with ♥ using modern web technologies.
          
          © 2023-2024 LLM Art Web Project
        </p>
      </section>
    </div>
  );
};
