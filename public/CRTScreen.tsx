import React, { type RefObject, useState, useEffect } from 'react';

// Mobile detection utilities
const isMobileUserAgent = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

const isMobileScreenSize = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

const hasTouchCapabilities = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 ||
         (navigator as any).msMaxTouchPoints > 0;
};

const isMobileDevice = (): boolean => {
  const isMobileUA = isMobileUserAgent();
  const isSmallScreen = isMobileScreenSize();
  const hasTouch = hasTouchCapabilities();
  
  // Consider it mobile if it matches at least 2 of the 3 criteria
  return [isMobileUA, isSmallScreen, hasTouch].filter(Boolean).length >= 2;
};

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement>;
  memoryBar: React.ReactNode;
  promptDisplay: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}

export const CRTScreen: React.FC<CRTScreenProps> = ({ children, textRef, memoryBar, promptDisplay, loadingSpinner }) => {
  // State for desktop terminal dimensions (only used in SVG approach)
  const [terminalDimensions] = useState({
    x: 492,
    y: 196,
    width: 570,
    height: 446
  });

  // Determine if we should use SVG approach
  const [useSVGApproach, setUseSVGApproach] = useState(!isMobileDevice());

  // Update SVG approach when screen size changes
  useEffect(() => {
    const checkDevice = () => {
      setUseSVGApproach(!isMobileDevice());
    };

    // Check on mount and when window resizes
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Mobile direct approach (no SVG)
  if (!useSVGApproach) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-black">
        <div className="w-full h-full flex flex-col">
          {/* CRT Screen Effects Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(transparent 50%, rgba(0,255,0,0.03) 50%),
                radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)
              `,
              backgroundSize: '100% 4px, 100% 100%',
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
              className="p-2"
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
              className="p-2 text-lg whitespace-pre-line break-words font-mono text-green-400 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden terminal-content"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 5px rgba(0,255,0,0.5)',
                zIndex: 20,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                lineHeight: '1.6'
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
      </div>
    );
  }

  // Desktop SVG approach
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <svg
        className="w-full h-full min-w-screen min-h-screen"
        viewBox="0 0 1536 1024"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        {/* Monitor background */}
        <image
          href="/monitor-background.svg"
          x="0"
          y="0"
          width="1536"
          height="1024"
          preserveAspectRatio="xMidYMid meet"
        />
        {/* Terminal Content Area */}
        <foreignObject
          x={terminalDimensions.x}
          y={terminalDimensions.y}
          width={terminalDimensions.width}
          height={terminalDimensions.height}
          className="overflow-hidden"
        >
          <div
            className="w-full h-full flex flex-col rounded-[14px]"
            style={{
              background: 'rgba(0, 0, 0, 0.98)',
              overflow: 'hidden',
              padding: '0',
            }}
          >
            {/* CRT Screen Effects Overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[14px]"
              style={{
                background: `
                  linear-gradient(transparent 50%, rgba(0,255,0,0.03) 50%),
                  radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)
                `,
                backgroundSize: '100% 4px, 100% 100%',
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
                className="px-4 pt-3 pb-1"
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
                className="px-4 pb-3 text-lg whitespace-pre-line break-words font-mono text-green-400 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 5px rgba(0,255,0,0.5)',
                  zIndex: 20,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  fontSize: '1.125rem'
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
