import React, { type RefObject, useState, useEffect } from 'react';

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement>;
  memoryBar: React.ReactNode;
  promptDisplay: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}



export const CRTScreen: React.FC<CRTScreenProps> = ({ children, textRef, memoryBar, promptDisplay, loadingSpinner }) => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* SVG-based approach with precise coordinate positioning */}
      <svg
        className="w-full h-full"
        viewBox="0 0 1536 1024"
        preserveAspectRatio="xMidYMid slice"
        style={{ 
          minWidth: '100vw', 
          minHeight: '100vh'
        }}
      >
        {/* Monitor background */}
        <image
          href="/images/monitor-background.svg"
          x="0"
          y="0"
          width="1536"
          height="1024"
          preserveAspectRatio="xMidYMid slice"
        />
        
        {/* Terminal content positioned using SVG coordinates */}
        <foreignObject
          x="492"
          y="196"
          width="570"
          height="446"
          className="overflow-hidden"
        >
          <div
            className="w-full h-full flex flex-col"
            style={{
              background: 'rgba(0, 0, 0, 0.98)',
              borderRadius: '14px',
              overflow: 'hidden'
            }}
          >
        {/* CRT Screen Effects Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(transparent 50%, rgba(0,255,0,0.03) 50%),
              radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)
            `,
            backgroundSize: '100% 4px, 100% 100%',
            borderRadius: '14px',
            zIndex: 20
          }}
        />
        
        {/* Terminal Content Area */}
        <div 
          className="relative h-full flex flex-col"
          style={{
            background: `
              radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%),
              linear-gradient(45deg, rgba(0,255,0,0.02) 0%, transparent 50%, rgba(0,255,0,0.02) 100%)
            `,
            boxShadow: 'inset 0 0 50px rgba(0,255,0,0.1)',
            zIndex: 15
          }}
        >
          {/* Fixed memory bar at top */}
          <div
            className="px-3 md:px-4 pt-2 md:pt-3 pb-1"
            style={{
              zIndex: 25,
              flexShrink: 0
            }}
          >
            {memoryBar}
          </div>
          
          {/* Scrollable terminal content with prompt display */}
          <div
            ref={textRef}
            className="px-3 md:px-4 pb-2 md:pb-3 text-sm md:text-base lg:text-lg whitespace-pre-line break-words font-mono text-green-400 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden"
            style={{ 
              fontFamily: 'monospace',
              textShadow: '0 0 5px rgba(0,255,0,0.5)',
              zIndex: 20,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Prompt display that scrolls with content */}
            {promptDisplay}
            {children}
          </div>
          
          {/* Loading spinner overlay */}
          {loadingSpinner && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 100 }}>
              {loadingSpinner}
            </div>
          )}
        </div>
      </div>
    </foreignObject>
  </svg>
</div>
);
};
