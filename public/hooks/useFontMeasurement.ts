import { useCallback } from 'react';

interface FontMeasurementOptions {
  testText?: string;
  multipleCharacters?: boolean;
}

export function useFontMeasurement(
  containerRef: React.RefObject<HTMLElement>, 
  options: FontMeasurementOptions = {}
) {
  const { testText = '#', multipleCharacters = false } = options;

  const measureCharacterWidth = useCallback((): number => {
    if (!containerRef.current) return 9.6;
    
    // Create a temporary element to measure character width using exact same styles
    const testElement = document.createElement('div');
    const containerStyles = getComputedStyle(containerRef.current);
    
    // Copy ALL relevant font and text styles from the container
    testElement.style.fontFamily = containerStyles.fontFamily;
    testElement.style.fontSize = containerStyles.fontSize;
    testElement.style.fontWeight = containerStyles.fontWeight;
    testElement.style.fontStyle = containerStyles.fontStyle;
    testElement.style.letterSpacing = containerStyles.letterSpacing;
    testElement.style.wordSpacing = containerStyles.wordSpacing;
    testElement.style.textTransform = containerStyles.textTransform;
    testElement.style.lineHeight = '1';
    
    // Positioning and visibility
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    testElement.style.top = '-9999px';
    testElement.style.left = '-9999px';
    testElement.style.whiteSpace = 'pre';
    testElement.style.padding = '0';
    testElement.style.margin = '0';
    testElement.style.border = 'none';
    
    // Set test content
    testElement.textContent = testText;
    
    // Append to the same container to inherit any cascade styles
    containerRef.current.appendChild(testElement);
    const elementWidth = testElement.getBoundingClientRect().width;
    containerRef.current.removeChild(testElement);
    
    // Calculate character width
    const charWidth = multipleCharacters 
      ? elementWidth / testText.length 
      : elementWidth;
    
    return charWidth || 9.6;
  }, [containerRef, testText, multipleCharacters]);

  const measureTextWidth = useCallback((text: string): number => {
    if (!containerRef.current || !text) return 0;
    
    const testElement = document.createElement('div');
    const containerStyles = getComputedStyle(containerRef.current);
    
    // Copy all font styles
    testElement.style.fontFamily = containerStyles.fontFamily;
    testElement.style.fontSize = containerStyles.fontSize;
    testElement.style.fontWeight = containerStyles.fontWeight;
    testElement.style.fontStyle = containerStyles.fontStyle;
    testElement.style.letterSpacing = containerStyles.letterSpacing;
    testElement.style.wordSpacing = containerStyles.wordSpacing;
    testElement.style.textTransform = containerStyles.textTransform;
    testElement.style.lineHeight = '1';
    
    // Positioning
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    testElement.style.top = '-9999px';
    testElement.style.left = '-9999px';
    testElement.style.whiteSpace = 'pre';
    testElement.style.padding = '0';
    testElement.style.margin = '0';
    testElement.style.border = 'none';
    
    testElement.textContent = text;
    
    containerRef.current.appendChild(testElement);
    const width = testElement.getBoundingClientRect().width;
    containerRef.current.removeChild(testElement);
    
    return width;
  }, [containerRef]);

  const calculateCharacterCount = useCallback((availableWidth: number): number => {
    const charWidth = measureCharacterWidth();
    return Math.floor(availableWidth / charWidth);
  }, [measureCharacterWidth]);

  return {
    measureCharacterWidth,
    measureTextWidth,
    calculateCharacterCount
  };
}