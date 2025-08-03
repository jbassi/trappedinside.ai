import React, { useState, useEffect } from 'react';

interface PiImageProps {
  size: string; // Size for portrait orientation
  landscapeSize?: string; // Optional size for landscape orientation
}

export const PiImage: React.FC<PiImageProps> = ({ size, landscapeSize = 'h-12' }) => {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
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

  // Calculate actual size based on orientation
  const actualSize = isLandscape ? landscapeSize : size;

  return (
    <div className="w-full relative bg-black/95 flex justify-center items-center min-h-0 pt-2 pb-2">
      {/* Main background with CRT effects */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%),
            linear-gradient(45deg, rgba(0,255,0,0.02) 0%, transparent 50%, rgba(0,255,0,0.02) 100%)
          `,
          boxShadow: 'inset 0 0 50px rgba(0,255,0,0.1)',
          zIndex: 15,
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
          zIndex: 20,
        }}
      />

      {/* Pi Image */}
      <img
        src="/pi-no-background.png"
        alt="Raspberry Pi"
        className={`${actualSize} w-auto object-contain min-h-0 text-green-400 relative z-30`}
        style={{
          opacity: 0.85,
        }}
      />
    </div>
  );
};
