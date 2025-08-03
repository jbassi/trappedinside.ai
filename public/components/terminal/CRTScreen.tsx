import React, { type RefObject, useState, useEffect } from 'react';
import { isMobileDevice } from '../../utils/mobileUtils';
import { PiImage } from './PiImage';

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement | null>;
  statusBar: React.ReactNode;
  promptDisplay: React.ReactNode;
  taskBar: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}

export const CRTScreen: React.FC<CRTScreenProps> = ({
  children,
  textRef,
  statusBar,
  promptDisplay,
  taskBar,
  loadingSpinner,
}) => {
  // State for desktop terminal dimensions
  const [terminalDimensions, setTerminalDimensions] = useState({
    x: 625,
    y: 125,
    width: 696,
    height: 550,
    borderRadius: 24,
  });

  // Update terminal dimensions based on viewport size
  useEffect(() => {
    const updateDimensions = () => {
      // Get viewport dimensions
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

      // Original SVG dimensions
      const svgWidth = 1927;
      const svgHeight = 1080;

      // Calculate the scaling factor based on how the SVG is being displayed
      // When using preserveAspectRatio="xMidYMid slice", the SVG scales to cover the viewport
      const svgAspectRatio = svgWidth / svgHeight;
      const viewportAspectRatio = vw / vh;

      let scaleFactor;

      if (viewportAspectRatio > svgAspectRatio) {
        // Viewport is wider than SVG - width is the constraint
        scaleFactor = vw / svgWidth;
      } else {
        // Viewport is taller than SVG - height is the constraint
        scaleFactor = vh / svgHeight;
      }

      // Cap the maximum scale factor to prevent excessive zooming
      const MAX_SCALE = 1.5; // Maximum 150% of original size
      scaleFactor = Math.min(scaleFactor, MAX_SCALE);

      // Base position in the original SVG coordinates
      const baseX = 625;
      const baseY = 125;
      const baseWidth = 696;
      const baseHeight = 550;

      // Calculate the center point of the terminal in the original SVG
      const centerX = baseX + baseWidth / 2;
      const centerY = baseY + baseHeight / 2;

      // Calculate the visible portion of the SVG
      const visibleSvgWidth = vw / scaleFactor;
      const visibleSvgHeight = vh / scaleFactor;

      // Calculate the visible SVG's top-left corner
      const visibleSvgX = (svgWidth - visibleSvgWidth) / 2;
      const visibleSvgY = (svgHeight - visibleSvgHeight) / 2;

      // Ensure terminal is always visible by keeping it within the visible SVG area
      // with some padding to avoid edges
      const padding = 50;
      const minX = visibleSvgX + padding;
      const maxX = visibleSvgX + visibleSvgWidth - baseWidth - padding;
      const minY = visibleSvgY + padding;
      const maxY = visibleSvgY + visibleSvgHeight - baseHeight - padding;

      // Adjust terminal position to stay in view
      let adjustedX = Math.max(minX, Math.min(maxX, baseX));
      let adjustedY = Math.max(minY, Math.min(maxY, baseY));

      // Set the terminal dimensions
      setTerminalDimensions({
        x: adjustedX,
        y: adjustedY,
        width: baseWidth,
        height: baseHeight,
        borderRadius: 24,
      });
    };

    // Initial update
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Define breakpoint for mobile view
  const MOBILE_BREAKPOINT = 768; // pixels

  // State to determine if we should use SVG or direct mobile approach
  const [useSVGApproach, setUseSVGApproach] = useState(
    window.innerWidth >= MOBILE_BREAKPOINT && !isMobileDevice()
  );

  // Check for mobile devices or small viewport
  useEffect(() => {
    const checkDevice = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

      // Use direct approach for mobile devices or small viewport
      if (isMobileDevice() || vw < MOBILE_BREAKPOINT) {
        setUseSVGApproach(false);
      } else {
        // Desktop or tablet with sufficient width: use SVG approach
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

  // Mobile direct approach (no SVG) - used for actual mobile devices and small viewports
  if (!useSVGApproach) {
    return (
      <div className="fixed inset-0 flex flex-col bg-black overflow-hidden transition-all duration-300">
        {/* Main content container with explicit ordering */}
        <div className="flex flex-col h-full">
          {/* Terminal Container - explicitly first in DOM order */}
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
                zIndex: 20,
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
                zIndex: 15,
              }}
            >
              {/* Fixed memory bar at top */}
              <div
                className="sticky top-0 p-2 bg-black/95"
                style={{
                  zIndex: 25,
                  backdropFilter: 'blur(2px)',
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
                  backdropFilter: 'blur(2px)',
                }}
              >
                {taskBar}
              </div>

              {/* Loading spinner overlay */}
              {loadingSpinner && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 100 }}
                >
                  {loadingSpinner}
                </div>
              )}
            </div>
          </div>

          {/* Pi Image - explicitly last in DOM order */}
          {!loadingSpinner && (
            <div className="w-full mt-auto" style={{ order: 999 }}>
              <PiImage size="h-24 sm:h-36 md:h-36" landscapeSize="h-20" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // SVG approach for desktop and tablet
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black transition-all duration-300"
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      <svg
        className="w-full h-full min-w-screen min-h-screen"
        viewBox="0 0 1927 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'block',
          imageRendering: 'crisp-edges',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Monitor background */}
        <image
          href="/monitor-background.svg"
          x="0"
          y="0"
          width="1927"
          height="1080"
          preserveAspectRatio="xMidYMid slice"
          style={{
            imageRendering: 'crisp-edges',
            willChange: 'transform',
          }}
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
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 100 }}
                >
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
