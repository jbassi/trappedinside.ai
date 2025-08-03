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
      <img
        src="/images/pi-no-background.png"
        alt="Raspberry Pi"
        className={`${actualSize} w-auto object-contain min-h-0 text-green-400`}
        style={{
          filter:
            'grayscale(100%) brightness(0.85) sepia(60%) hue-rotate(90deg) saturate(300%) brightness(0.9)',
          opacity: 0.85,
        }}
      />
    </div>
  );
};
