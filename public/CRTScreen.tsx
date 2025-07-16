import React, { type RefObject, useState, useEffect } from 'react';
import { PiAsciiArt } from './PiAsciiArt';
import { isMobileUserAgent, isMobileScreenSize, hasTouchCapabilities } from './mobileUtils';

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement>;
  memoryBar: React.ReactNode;
  promptDisplay: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}

export const CRTScreen: React.FC<CRTScreenProps> = ({ children, textRef, memoryBar, promptDisplay, loadingSpinner }) => {
  // State for desktop terminal dimensions
  const [terminalDimensions] = useState({
    x: 492,
    y: 196,
    width: 570,
    height: 446
  });

  // State to determine if we should use SVG or direct mobile approach
  const [useSVGApproach, setUseSVGApproach] = useState(true);

  // Check for mobile devices
  useEffect(() => {
    const checkDevice = () => {
      const isMobileUA = isMobileUserAgent();
      const isSmallScreen = isMobileScreenSize();
      const hasTouch = hasTouchCapabilities();
      
      // Use direct approach for mobile devices
      if ((isMobileUA && isSmallScreen) || (isSmallScreen && hasTouch)) {
        setUseSVGApproach(false);
      } else {
        // Desktop or tablet: use SVG approach
        setUseSVGApproach(true);
      }
    };

    // Check on mount
    checkDevice();
    
    // Check on resize and orientation change
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Mobile direct approach (no SVG)
  if (!useSVGApproach) {
    return (
      <div className="fixed inset-0 flex flex-col bg-black overflow-hidden">
        {/* Pi ASCII Art Header - only show when not loading */}
        {!loadingSpinner && <PiAsciiArt />}
          
        {/* Terminal Container */}
        <div className="flex-1 relative flex flex-col min-h-0">
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
            className="relative flex-1 flex flex-col min-h-0"
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
              className="sticky top-0 p-2 bg-black/95"
              style={{
                zIndex: 25,
                backdropFilter: 'blur(2px)'
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

  // SVG approach for desktop, tablet, and mobile landscape
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
                className="px-4 pt-3 pb-1 bg-black/95"
                style={{
                  zIndex: 25,
                  flexShrink: 0,
                  backdropFilter: 'blur(2px)'
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
