import { useEffect, useState, useCallback } from 'react';

export function useTerminalWidth(containerRef: React.RefObject<HTMLElement>, isLoading: boolean = false) {
  const [terminalWidth, setTerminalWidth] = useState(80);
  const [widthVersion, setWidthVersion] = useState(0);

  const calculateWidth = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const paddingLeft = parseFloat(getComputedStyle(containerRef.current).paddingLeft) || 0;
      const paddingRight = parseFloat(getComputedStyle(containerRef.current).paddingRight) || 0;
      const availableWidth = containerWidth - paddingLeft - paddingRight;
      
      const charWidth = 9.6;
      const estimatedChars = Math.floor(availableWidth / charWidth);
      
      if (estimatedChars !== terminalWidth) {
        setTerminalWidth(estimatedChars);
        setWidthVersion(prev => prev + 1);
      }
    }
  }, [containerRef, terminalWidth]);

  const calculateWidthSafely = useCallback(() => {
    if (containerRef.current && containerRef.current.clientWidth > 0) {
      calculateWidth();
    } else {
      requestAnimationFrame(calculateWidthSafely);
    }
  }, [calculateWidth, containerRef]);

  useEffect(() => {
    if (document.readyState === 'complete') {
      calculateWidthSafely();
    } else {
      const onLoad = () => {
        calculateWidthSafely();
        window.removeEventListener('load', onLoad);
      };
      window.addEventListener('load', onLoad);
    }
    
    window.addEventListener('resize', calculateWidthSafely);
    window.addEventListener('orientationchange', calculateWidthSafely);
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          calculateWidth();
          break;
        }
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', calculateWidthSafely);
      window.removeEventListener('orientationchange', calculateWidthSafely);
      observer.disconnect();
    };
  }, [isLoading, calculateWidth, calculateWidthSafely, containerRef]);

  return { terminalWidth, widthVersion };
}