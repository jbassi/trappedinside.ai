import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { CRTScreen } from './CRTScreen';
import { StatusBar } from './StatusBar';
import { TaskBar } from './TaskBar';
import { TerminalLine } from './TerminalLine';
import { PromptDisplay } from './PromptDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { InfoScreen } from './InfoScreen';
import { TerminalSizeProvider } from '../context/TerminalSizeContext';
import { useTerminal } from './TerminalContext';
import { useTerminalAnimation } from './hooks/useTerminalAnimation';
import { useWebSocket } from './hooks/useWebSocket';
import { isMobileDevice, hasTouchCapabilities } from '../../utils/mobileUtils';

export const Terminal: React.FC = () => {
  const {
    lines,
    cursorVisible,
    isLoading,
    lastMemory,
    llmPrompt,
    textRef,
    infoTextRef,
    isTouchDeviceRef,
    PROMPT,
    selectedTab,
    setSelectedTab,
  } = useTerminal();

  // Track tab changes for scroll positioning
  const prevTabRef = useRef<typeof selectedTab>(selectedTab);

  const { processQueue } = useTerminalAnimation();

  // Initialize WebSocket connection
  useWebSocket();

  // Detect if device has touch capabilities
  useEffect(() => {
    const detectTouchDevice = () => {
      // Use existing mobile detection utilities
      const hasTouch = hasTouchCapabilities();
      const isMobile = isMobileDevice();

      // Consider it a touch device if it has touch capability AND is identified as mobile
      isTouchDeviceRef.current = hasTouch && isMobile;
    };

    detectTouchDevice();
    window.addEventListener('resize', detectTouchDevice);
    window.addEventListener('orientationchange', detectTouchDevice);

    return () => {
      window.removeEventListener('resize', detectTouchDevice);
      window.removeEventListener('orientationchange', detectTouchDevice);
    };
  }, [isTouchDeviceRef]);

  // Handle scroll position when tab changes using useLayoutEffect
  // This runs synchronously after DOM mutations but before browser painting
  useLayoutEffect(() => {
    // Only run if the tab actually changed
    if (prevTabRef.current !== selectedTab) {
      if (selectedTab === 'terminal' && textRef.current) {
        // If switching to terminal tab, always scroll to bottom
        textRef.current.scrollTop = textRef.current.scrollHeight;
      } else if (selectedTab === 'info' && infoTextRef.current) {
        // If switching to info tab, always scroll to top
        infoTextRef.current.scrollTop = 0;
      }

      // Update previous tab reference
      prevTabRef.current = selectedTab;
    }
  }, [selectedTab, textRef, infoTextRef]);

  // Handle scroll to top/bottom for terminal content
  const handleScrollToTop = () => {
    if (selectedTab === 'terminal' && textRef.current) {
      textRef.current.scrollTop = 0;
    } else if (selectedTab === 'info' && infoTextRef.current) {
      infoTextRef.current.scrollTop = 0;
    }
  };

  const handleScrollToBottom = () => {
    if (selectedTab === 'terminal' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    } else if (selectedTab === 'info' && infoTextRef.current) {
      infoTextRef.current.scrollTop = infoTextRef.current.scrollHeight;
    }
  };

  // Handle tab change
  const handleTabChange = (tab: typeof selectedTab) => {
    // Just update the selected tab - scrolling will be handled by the useLayoutEffect
    setSelectedTab(tab);
  };

  // Get the appropriate ref based on the selected tab
  const activeRef = selectedTab === 'info' ? infoTextRef : textRef;

  return (
    <TerminalSizeProvider textRef={activeRef}>
      <CRTScreen
        textRef={activeRef}
        statusBar={
          !isLoading && selectedTab === 'terminal' ? <StatusBar memory={lastMemory} /> : undefined
        }
        promptDisplay={
          !isLoading && selectedTab === 'terminal' ? (
            <PromptDisplay prompt={llmPrompt} />
          ) : undefined
        }
        taskBar={
          !isLoading ? (
            <TaskBar
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              onScrollToTop={handleScrollToTop}
              onScrollToBottom={handleScrollToBottom}
            />
          ) : undefined
        }
        loadingSpinner={isLoading ? <LoadingSpinner /> : undefined}
      >
        {!isLoading &&
          selectedTab === 'terminal' &&
          lines.map((line, i) => (
            <TerminalLine
              key={i}
              line={line}
              isLastLine={i === lines.length - 1}
              cursorVisible={cursorVisible}
              prompt={PROMPT}
            />
          ))}
        {!isLoading && selectedTab === 'info' && <InfoScreen />}
      </CRTScreen>
    </TerminalSizeProvider>
  );
};
