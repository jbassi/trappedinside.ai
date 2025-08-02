import { useEffect, useState, useCallback } from 'react';

export function useTerminalWidth(
  containerRef: React.RefObject<HTMLElement>,
  isLoading: boolean = false
) {
  const [terminalWidth, setTerminalWidth] = useState(80);
  const [widthVersion, setWidthVersion] = useState(0);

  const measureCharacterWidth = useCallback((): number => {
    if (!containerRef.current) return 9.6;

    // Create a temporary element to measure character width using the exact same styles
    const testElement = document.createElement('span');
    const containerStyles = getComputedStyle(containerRef.current);

    // Copy all relevant font styles from the container
    testElement.style.fontFamily = containerStyles.fontFamily;
    testElement.style.fontSize = containerStyles.fontSize;
    testElement.style.fontWeight = containerStyles.fontWeight;
    testElement.style.letterSpacing = containerStyles.letterSpacing;
    testElement.style.lineHeight = '1';
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    testElement.style.whiteSpace = 'pre';
    testElement.style.top = '-9999px';
    testElement.textContent = '#';

    // Append to the same container to inherit styles properly
    containerRef.current.appendChild(testElement);
    const charWidth = testElement.getBoundingClientRect().width;
    containerRef.current.removeChild(testElement);

    return charWidth || 9.6;
  }, [containerRef]);

  const calculateWidth = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const paddingLeft = parseFloat(getComputedStyle(containerRef.current).paddingLeft) || 0;
      const paddingRight = parseFloat(getComputedStyle(containerRef.current).paddingRight) || 0;
      const availableWidth = containerWidth - paddingLeft - paddingRight;

      const charWidth = measureCharacterWidth();
      const estimatedChars = Math.floor(availableWidth / charWidth);

      if (estimatedChars !== terminalWidth) {
        setTerminalWidth(estimatedChars);
        setWidthVersion((prev) => prev + 1);
      }
    }
  }, [containerRef, terminalWidth, measureCharacterWidth]);

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
