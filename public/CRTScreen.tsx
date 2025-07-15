import React, { type RefObject, useState, useEffect } from 'react';

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement>;
  memoryBar: React.ReactNode;
  promptDisplay: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}

export const CRTScreen: React.FC<CRTScreenProps> = ({ children, textRef, memoryBar, promptDisplay, loadingSpinner }) => {
  // State for responsive terminal dimensions
  const [terminalDimensions, setTerminalDimensions] = useState({
    x: 492,
    y: 196,
    width: 570,
    height: 446
  });

  // State to determine if we should use SVG or direct mobile approach
  const [useSVGApproach, setUseSVGApproach] = useState(true);

  // Check for mobile portrait orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      if (isMobile && isPortrait) {
        // Mobile portrait: use direct approach (no SVG)
        setUseSVGApproach(false);
      } else {
        // Desktop, tablet, or mobile landscape: use SVG approach
        setUseSVGApproach(true);
        
        if (isMobile) {
          // Mobile landscape: expand terminal area
          setTerminalDimensions({
            x: 77,
            y: 102,
            width: 1382,
            height: 819
          });
        } else {
          // Desktop/tablet: use default dimensions
          setTerminalDimensions({
            x: 492,
            y: 196,
            width: 570,
            height: 446
          });
        }
      }
    };

    // Check on mount
    checkOrientation();
    
    // Check on resize and orientation change
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Mobile portrait direct approach (no SVG)
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
                fontSize: '1.25rem',
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
        {/* Responsive Terminal Content Area */}
        <foreignObject
          x={terminalDimensions.x}
          y={terminalDimensions.y}
          width={terminalDimensions.width}
          height={terminalDimensions.height}
          className="overflow-hidden"
        >
          <div
            className="w-full h-full flex flex-col md:rounded-[14px] rounded-[6px]"
            style={{
              background: 'rgba(0, 0, 0, 0.98)',
              borderRadius: '14px',
              overflow: 'hidden',
              // Responsive padding for mobile
              padding: '0',
            }}
          >
            {/* CRT Screen Effects Overlay */}
            <div
              className="absolute inset-0 pointer-events-none md:rounded-[14px] rounded-[6px]"
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
                className="px-2 md:px-4 pt-1.5 md:pt-3 pb-1"
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
                className="px-0 md:px-4 pb-0 md:pb-3 text-xs md:text-base lg:text-lg whitespace-pre-line break-words font-mono text-green-400 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden mobile-portrait:text-2xl"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 5px rgba(0,255,0,0.5)',
                  zIndex: 20,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  // Much larger font size for mobile portrait
                  fontSize: 'clamp(2rem, 5vw, 2.5rem)'
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
        {/* Mobile landscape media query only */}
        <style>{`
          @media (max-width: 768px) and (orientation: landscape) {
            foreignObject {
              x: 77px !important;
              y: 102px !important;
              width: 1382px !important;
              height: 819px !important;
            }
          }
        `}</style>
      </svg>
    </div>
  );
};
