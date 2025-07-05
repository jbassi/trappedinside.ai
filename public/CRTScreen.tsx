import React, { type RefObject } from 'react';

interface CRTScreenProps {
  children: React.ReactNode;
  textRef: RefObject<HTMLDivElement>;
  memoryBar: React.ReactNode;
  promptDisplay: React.ReactNode;
}

export const CRTScreen: React.FC<CRTScreenProps> = ({ children, textRef, memoryBar, promptDisplay }) => {
  return (
    <div className="relative">
      {/* Outer CRT Monitor Bezel */}
      <div
        className="relative mx-auto"
        style={{ 
          border: '20px solid #d4c4a0',
          borderRadius: '20px',
          boxShadow: `
            inset 0 0 0 8px #1a1a1a,
            inset 0 0 0 12px #0a0a0a,
            inset 0 0 0 16px #1a1a1a,
            inset 0 0 0 20px #0a0a0a,
            0 8px 16px rgba(0, 0, 0, 0.3)
          `
        }}
      >
        {/* CRT Screen with True Barrel Distortion */}
        <div
          className="relative bg-black overflow-hidden"
          style={{
            borderRadius: '16px',
            background: `
              radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%),
              linear-gradient(45deg, rgba(0,255,0,0.02) 0%, transparent 50%, rgba(0,255,0,0.02) 100%)
            `,
            boxShadow: `
              inset 0 0 100px rgba(0,255,0,0.1),
              inset 0 0 20px rgba(0,0,0,0.8)
            `
          }}
        >
          {/* True Barrel Distortion Container */}
          <div
            className="relative"
            style={{
              borderRadius: '16px',
              // Apply barrel distortion using CSS filter
              filter: `
                contrast(1.05) 
                brightness(1.02)
              `,
              // Geometric barrel distortion using transform
              transform: `
                perspective(800px) 
                rotateX(2deg) 
                rotateY(0deg) 
                scale3d(1.02, 1.02, 1)
              `,
              transformOrigin: 'center center',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Content with barrel distortion warping */}
            <div
              className="relative"
              style={{
                borderRadius: '16px',
                // True barrel distortion using CSS transforms
                transform: `
                  perspective(600px) 
                  rotateX(-1deg) 
                  scale3d(0.98, 0.98, 1)
                `,
                transformOrigin: 'center center',
                // Apply barrel distortion using CSS clip-path for geometric warping
                clipPath: `
                  polygon(
                    1% 0%, 5% 0%, 95% 0%, 99% 0%, 
                    100% 1%, 100% 5%, 100% 95%, 100% 99%, 
                    99% 100%, 95% 100%, 5% 100%, 1% 100%, 
                    0% 99%, 0% 95%, 0% 5%, 0% 1%
                  )
                `
              }}
            >
              {/* Barrel distortion overlay with geometric warping */}
              <div
                className="absolute inset-0"
                style={{
                  // Apply counter-distortion to create barrel effect
                  transform: `
                    perspective(500px) 
                    rotateX(1.5deg) 
                    scale3d(1.03, 1.03, 1)
                  `,
                  transformOrigin: 'center center',
                  borderRadius: '16px'
                }}
              >
                {/* Scanlines that follow the barrel curvature */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `repeating-linear-gradient(
                      0deg,
                      transparent 0px,
                      transparent 2px,
                      rgba(0,255,0,0.03) 2px,
                      rgba(0,255,0,0.03) 4px
                    )`,
                    borderRadius: '16px',
                    zIndex: 10,
                    // Make scanlines follow the barrel curve
                    transform: `
                      perspective(700px) 
                      rotateX(-0.5deg) 
                      scale3d(1.01, 1.01, 1)
                    `,
                    transformOrigin: 'center center'
                  }}
                />
                
                {/* Barrel distortion vignette */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(ellipse 90% 90% at 50% 50%, 
                        transparent 0%, 
                        transparent 60%, 
                        rgba(0,0,0,0.05) 70%, 
                        rgba(0,0,0,0.15) 80%, 
                        rgba(0,0,0,0.3) 90%, 
                        rgba(0,0,0,0.5) 95%, 
                        rgba(0,0,0,0.7) 100%
                      )
                    `,
                    borderRadius: '16px',
                    zIndex: 5,
                    // Vignette follows barrel distortion
                    transform: `
                      perspective(600px) 
                      rotateX(-0.8deg) 
                      scale3d(1.015, 1.015, 1)
                    `,
                    transformOrigin: 'center center'
                  }}
                />

                {/* Center bulge highlight */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(ellipse 15% 15% at 50% 50%, 
                        rgba(255,255,255,0.2) 0%, 
                        rgba(255,255,255,0.12) 40%, 
                        rgba(255,255,255,0.06) 60%, 
                        rgba(255,255,255,0.03) 80%, 
                        transparent 100%
                      )
                    `,
                    borderRadius: '16px',
                    zIndex: 15,
                    // Center highlight emphasizes the barrel bulge
                    transform: `
                      perspective(400px) 
                      rotateX(-1.2deg) 
                      scale3d(1.025, 1.025, 1)
                    `,
                    transformOrigin: 'center center'
                  }}
                />
              </div>
              
              {/* Content with geometric barrel warping */}
              <div
                className="relative flex flex-col"
                style={{
                  height: '70vh',
                  maxHeight: '70vh',
                  borderRadius: '16px',
                  // Apply barrel distortion to text geometry
                  transform: `
                    perspective(900px) 
                    rotateX(-0.8deg) 
                    scale3d(1.008, 1.008, 1)
                  `,
                  transformOrigin: 'center center',
                  // Additional barrel distortion using CSS filters
                  filter: `
                    contrast(1.02) 
                    brightness(1.01)
                  `,
                  // Subtle geometric warping of text container
                  clipPath: `
                    polygon(
                      0.5% 0%, 99.5% 0%, 
                      100% 0.5%, 100% 99.5%, 
                      99.5% 100%, 0.5% 100%, 
                      0% 99.5%, 0% 0.5%
                    )
                  `
                }}
              >
                {/* Fixed memory bar at top, inside content area */}
                <div
                  className="px-12 pt-8 pb-2"
                  style={{
                    zIndex: 2,
                    flexShrink: 0
                  }}
                >
                  {memoryBar}
                </div>
                
                {/* Scrollable terminal content with prompt display */}
                <div
                  ref={textRef}
                  className="px-12 pb-8 text-base whitespace-pre-line break-words font-mono text-green-400 overflow-y-auto flex-1"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '0 0 5px rgba(0,255,0,0.5)',
                    zIndex: 1
                  }}
                >
                  {/* Prompt display that scrolls with content */}
                  {promptDisplay}
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
