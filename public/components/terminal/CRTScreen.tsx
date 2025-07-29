import React, { type RefObject, useState, useEffect } from 'react';
import { PiAsciiArt } from './PiAsciiArt';
import { isMobileDevice } from '../../utils/mobileUtils';

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement | null>;
  statusBar: React.ReactNode;
  promptDisplay: React.ReactNode;
  taskBar: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}

export const CRTScreen: React.FC<CRTScreenProps> = ({ children, textRef, statusBar, promptDisplay, taskBar, loadingSpinner }) => {
  // State for desktop terminal dimensions
  const [terminalDimensions] = useState({
    x: 625,
    y: 125,
    width: 696,
    height: 550,
    borderRadius: 24
  });

  // State to determine if we should use SVG or direct mobile approach
  const [useSVGApproach, setUseSVGApproach] = useState(true);

  // Check for mobile devices
  useEffect(() => {
    const checkDevice = () => {
      // Use direct approach for mobile devices
      if (isMobileDevice()) {
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
              {statusBar}
            </div>
              
            {/* Scrollable terminal content with prompt display */}
            <div
              ref={textRef}
              className="p-4 pb-6 text-lg whitespace-pre-line break-words font-mono text-green-400 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden terminal-content"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 5px rgba(0,255,0,0.5)',
                zIndex: 20,
                overflowAnchor: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                lineHeight: '1.6',
                willChange: 'scroll-position',
                contain: 'layout style paint',
                position: 'relative',
                scrollBehavior: 'auto', // Explicitly disable smooth scrolling
                paddingBottom: '20px', // Extra padding for TaskBar at bottom
              }}
            >
              {/* Prompt display that scrolls with content */}
              {promptDisplay}
              {children}
            </div>
              
            {/* Fixed task bar at bottom */}
            <div
              className="sticky bottom-0 p-2 bg-black/95"
              style={{
                zIndex: 25,
                backdropFilter: 'blur(2px)'
              }}
            >
              {taskBar}
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

  // SVG approach for desktop and tablet
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <svg
        className="w-full h-full min-w-screen min-h-screen"
        viewBox="0 0 1927 1080"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        {/* Monitor background */}
        <image
          href="/monitor-background.svg"
          x="0"
          y="0"
          width="1927"
          height="1080"
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
            className="w-full h-full flex flex-col"
            style={{
              background: 'rgba(0, 0, 0, 0.98)',
              overflow: 'hidden',
              padding: '0',
              borderRadius: `${terminalDimensions.borderRadius}px`,
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
                zIndex: 20,
                borderRadius: `${terminalDimensions.borderRadius}px`,
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
                zIndex: 15,
                borderRadius: `${terminalDimensions.borderRadius}px`,
              }}
            >
              {/* Fixed memory bar at top */}
              <div
                className="px-4 pt-3 pb-1 bg-black/95"
                style={{
                  zIndex: 25,
                  flexShrink: 0,
                  backdropFilter: 'blur(2px)',
                  borderTopLeftRadius: `${terminalDimensions.borderRadius}px`,
                  borderTopRightRadius: `${terminalDimensions.borderRadius}px`,
                }}
              >
                {statusBar}
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
                  fontSize: '1.125rem',
                  overflowAnchor: 'auto',
                  willChange: 'scroll-position',
                  contain: 'layout style paint',
                  position: 'relative',
                  scrollBehavior: 'auto', // Explicitly disable smooth scrolling
                  paddingBottom: '20px', // Extra padding for TaskBar at bottom
                }}
              >
                {/* Prompt display that scrolls with content */}
                {promptDisplay}
                {children}
              </div>
              {/* Fixed task bar at bottom */}
              <div
                className="px-4 pt-1 pb-3 bg-black/95"
                style={{
                  zIndex: 25,
                  flexShrink: 0,
                  backdropFilter: 'blur(2px)',
                  borderBottomLeftRadius: `${terminalDimensions.borderRadius}px`,
                  borderBottomRightRadius: `${terminalDimensions.borderRadius}px`,
                }}
              >
                {taskBar}
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
