// Check if user agent indicates a mobile device
export const isMobileUserAgent = (): boolean => {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

// Check if screen size is in mobile range
export const isMobileScreenSize = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// Check if device has touch capabilities
export const hasTouchCapabilities = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

// Combined mobile detection using multiple criteria
export const isMobileDevice = (): boolean => {
  const isMobileUA = isMobileUserAgent();
  const isSmallScreen = isMobileScreenSize();
  const hasTouch = hasTouchCapabilities();

  // Consider it mobile if it matches at least 2 of the 3 criteria
  return [isMobileUA, isSmallScreen, hasTouch].filter(Boolean).length >= 2;
};
