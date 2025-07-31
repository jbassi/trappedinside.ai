import React, { useState, useEffect } from "react";
import { terminalStyles, terminalClasses } from "../../styles/terminalStyles";
import { isMobileDevice } from "../../utils/mobileUtils";

export const PiAsciiArt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const mobile = isMobileDevice();
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsPortrait(portrait);
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

  const collapsedArt = `
⠀⢀⣠⣤⣶⣶⣶⣤⣄⠀⠀⣀⣤⣶⣶⣶⣤⣄⡀⠀
⠀⢸⣿⠁⠀⠀⠀⠀⠙⢷⡾⠋⠀⠀⠀⠀⠈⣿⡇⠀
⠀⠘⢿⡆⠀⠀⠀⠢⣄⣼⣧⣠⠔⠀⠀⠀⢰⡿⠃⠀
⠀⠀⠈⠻⣧⣤⣀⣤⣾⣿⣿⣷⣤⣀⣤⣼⠟⠁⠀⠀
`;

  const mobilePortraitArt = `
⠀⢀⣠⣤⣶⣶⣶⣤⣄⠀⠀⣀⣤⣶⣶⣶⣤⣄⡀⠀
⠀⢸⣿⠁⠀⠀⠀⠀⠙⢷⡾⠋⠀⠀⠀⠀⠈⣿⡇⠀
⠀⠘⢿⡆⠀⠀⠀⠢⣄⣼⣧⣠⠔⠀⠀⠀⢰⡿⠃⠀
⠀⠀⠈⠻⣧⣤⣀⣤⣾⣿⣿⣷⣤⣀⣤⣼⠟⠁⠀⠀
⠀⠀⣰⡾⠋⠉⣩⣟⠁⠀⠀⠈⣻⣍⠉⠙⢷⣆⠀⠀
⠀⢀⣿⣀⣤⡾⠛⠛⠷⣶⣶⠾⠛⠛⢷⣤⣀⣿⡀⠀
⣰⡟⠉⣿⡏⠀⠀⠀⠀⢹⡏⠀⠀⠀⠀⢹⣿⠉⢻⣆
⣿⡇⠀⣿⣇⠀⠀⠀⣠⣿⣿⣄⠀⠀⠀⣸⣿⠀⢸⣿
⠙⣷⣼⠟⠻⣿⣿⡿⠋⠁⠈⠙⢿⣿⣿⠟⠻⣧⣾⠋
⠀⢸⣿⠀⠀⠈⢿⡇⠀⠀⠀⠀⢸⡿⠁⠀⠀⣿⡇⠀
⠀⠀⠻⣧⣀⣀⣸⣿⣶⣤⣤⣶⣿⣇⣀⣀⣼⠟⠀⠀
⠀⠀⠀⠈⠛⢿⣿⣿⡀⠀⠀⢀⣿⣿⡿⠛⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠙⠻⠿⠿⠟⠋⠀⠀⠀⠀⠀⠀⠀
`;

  return (
    <div className="w-full relative bg-black/95">
      {/* Main background with CRT effects */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%),
            linear-gradient(45deg, rgba(0,255,0,0.02) 0%, transparent 50%, rgba(0,255,0,0.02) 100%)
          `,
          boxShadow: 'inset 0 0 50px rgba(0,255,0,0.1)',
          zIndex: 15
        }}
      />
      
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

      {/* ASCII Art Container */}
      <div className={`${terminalClasses.baseText} w-full flex items-center justify-center mb-1 relative z-30`}>
        <pre 
          className="font-mono text-xs sm:text-sm md:text-base text-green-500"
          style={{
            transform: 'scale(0.7)',
            transformOrigin: 'center center',
            textShadow: '0 0 5px rgba(0,255,0,0.5)'
          }}
        >
          {isMobile && isPortrait ? mobilePortraitArt : collapsedArt}
        </pre>
      </div>
    </div>
  );
};
