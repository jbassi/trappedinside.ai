import { useEffect, useCallback } from 'react';
import { useTerminal } from '../TerminalContext';

export const useTerminalScroll = () => {
  const {
    isAtBottom,
    setIsAtBottom,
    userScrolledUp,
    setUserScrolledUp,
    activelyDragging,
    setActivelyDragging,
    textRef,
    prevScrollTopRef,
    prevScrollHeightRef
  } = useTerminal();

  // Helper function to check if at bottom
  const checkIfAtBottom = useCallback(() => {
    if (!textRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = textRef.current;
    return scrollTop + clientHeight >= scrollHeight - 30;
  }, [textRef]);

  // Helper function to scroll to bottom if needed
  const scrollToBottomIfNeeded = useCallback(() => {
    if (!textRef.current) return;
    
    // Only auto-scroll if user hasn't scrolled up AND isn't actively dragging
    if (!userScrolledUp && !activelyDragging && checkIfAtBottom()) {
      textRef.current.scrollTop = textRef.current.scrollHeight + 30;
    }
  }, [textRef, userScrolledUp, activelyDragging, checkIfAtBottom]);

  // Unified scroll handler for both desktop and mobile
  const handleScroll = useCallback(() => {
    if (!textRef.current) return;
    
    const { scrollTop, scrollHeight } = textRef.current;
    const wasAtBottom = isAtBottom;
    const isNowAtBottom = checkIfAtBottom();
    
    // Detect scroll direction
    const scrollingDown = scrollTop > prevScrollTopRef.current;
    const contentAdded = scrollHeight > prevScrollHeightRef.current;
    
    // Update refs for next check
    prevScrollTopRef.current = scrollTop;
    prevScrollHeightRef.current = scrollHeight;
    
    // Update state based on scroll position
    setIsAtBottom(isNowAtBottom);
    
    // If user was at bottom and scrolled up, mark as scrolled up
    if (wasAtBottom && !isNowAtBottom && !contentAdded) {
      setUserScrolledUp(true);
    }
    
    // If user scrolled back to bottom, clear scrolled up state
    if (!wasAtBottom && isNowAtBottom && scrollingDown) {
      setUserScrolledUp(false);
    }
  }, [isAtBottom, setIsAtBottom, setUserScrolledUp, checkIfAtBottom, textRef, prevScrollTopRef, prevScrollHeightRef]);

  // Set up scroll event listener
  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    
    // Add touch event listeners to detect active dragging
    const handleTouchStart = () => {
      setActivelyDragging(true);
    };
    
    const handleTouchMove = () => {
      // Ensure we're marked as actively dragging during movement
      if (!activelyDragging) {
        setActivelyDragging(true);
      }
    };
    
    const handleTouchEnd = () => {
      // Small delay to ensure scroll events are processed
      setTimeout(() => {
        setActivelyDragging(false);
      }, 50);
    };
    
    // Use passive listeners for better performance
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add touch-specific listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleScroll, textRef, activelyDragging, setActivelyDragging]);

  return {
    isAtBottom,
    userScrolledUp,
    activelyDragging,
    checkIfAtBottom,
    scrollToBottomIfNeeded
  };
};
