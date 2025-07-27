import React, { useEffect, useState } from 'react';
import { CRTScreen } from './CRTScreen';
import { MemoryBar } from './MemoryBar';
import { TaskBar } from './TaskBar';
import { TerminalLine } from './TerminalLine';
import { PromptDisplay } from './PromptDisplay';
import { LoadingSpinner } from './LoadingSpinner';
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
    isTouchDeviceRef,
    queueRef,
    PROMPT
  } = useTerminal();

  const { processQueue } = useTerminalAnimation();
  
  // Initialize WebSocket connection
  useWebSocket();
  
  // State to track queue length for triggering processQueue
  const [queueLength, setQueueLength] = useState(0);
  
  // Check queue length periodically to detect new messages
  useEffect(() => {
    const checkQueueInterval = setInterval(() => {
      if (queueRef.current.length > queueLength) {
        setQueueLength(queueRef.current.length);
      }
    }, 100);
    
    return () => clearInterval(checkQueueInterval);
  }, [queueRef, queueLength]);
  
  // Process queue when queue length changes
  useEffect(() => {
    if (queueLength > 0 && document.visibilityState === 'visible') {
      processQueue();
      setQueueLength(0);
    }
  }, [queueLength, processQueue]);
  
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

  // Process queue when document becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && queueRef.current.length > 0) {
        processQueue();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [processQueue, queueRef]);

  return (
    <TerminalSizeProvider textRef={textRef}>
      <CRTScreen 
        textRef={textRef}
        memoryBar={!isLoading ? <MemoryBar memory={lastMemory} /> : undefined}
        promptDisplay={!isLoading ? <PromptDisplay prompt={llmPrompt} /> : undefined}
        taskBar={!isLoading ? <TaskBar selectedTab="terminal" /> : undefined}
        loadingSpinner={isLoading ? <LoadingSpinner /> : undefined}
      >
        {!isLoading && lines.map((line, i) => (
          <TerminalLine
            key={i}
            line={line}
            isLastLine={i === lines.length - 1}
            cursorVisible={cursorVisible}
            prompt={PROMPT}
          />
        ))}
      </CRTScreen>
    </TerminalSizeProvider>
  );
};
