import React, { useState, useEffect } from 'react';
import { terminalStyles, terminalClasses } from './terminalStyles';
import { isMobileDevice } from './mobileUtils';

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

  // Simple "Pi" for mobile portrait
  const mobilePortraitArt = `
 ____  _ 
|  _ \\(_)
| |_) | |
|  __/| |
|_|   |_|`;

  // Full art for landscape and desktop
  const fullArt = ` ____                 _                           ____  _ 
|  _ \\ __ _ ___ _ __ | |__   ___ _ __ _ __ _   _  |  _ \\(_)
| |_) / _\` / __| '_ \\| '_ \\ / _ \\ '__| '__| | | | | |_) | |
|  _ < (_| \\__ \\ |_) | |_) |  __/ |  | |  | |_| | |  __/| |
|_| \\_\\__,_|___/ .__/|_.__/ \\___|_|  |_|   \\__, | |_|   |_|
                |_|                          |___/           `;

  return (
    <div 
      className={`${terminalClasses.baseText} w-full flex items-center justify-center mb-2 relative`}
      style={{
        ...terminalStyles.baseText,
        color: '#22c55e' // text-green-500
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
          zIndex: 20
        }}
      />
      <pre className="font-mono text-[0.6rem] sm:text-xs md:text-sm relative z-10">
        {isMobile && isPortrait ? mobilePortraitArt : fullArt}
      </pre>
    </div>
  );
};
