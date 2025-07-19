import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import { CRTScreen } from "./CRTScreen";
import { MemoryBar } from "./MemoryBar";
import { TerminalLine } from "./TerminalLine";
import { PromptDisplay } from "./PromptDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { TerminalSizeProvider } from "./TerminalSizeContext";
import { isMobileDevice, hasTouchCapabilities } from "./mobileUtils";
import type { Memory } from "./types";

const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

// Zod schema for server messages
const ServerMessageSchema = z.object({
  messages: z.array(
    z.object({
      text: z.string(),
      memory: z
        .object({
          available_mb: z.number(),
          percent_used: z.number(),
          total_mb: z.number(),
        })
        .optional(),
      status: z
        .object({
          is_restarting: z.boolean().optional(),
        })
        .optional(),
      prompt: z.string().optional(),
    })
  ),
});

function App() {
  // Terminal prompt configuration
  const PROMPT = "❯ ";
  
  // Default LLM prompt constant
  const DEFAULT_LLM_PROMPT = "You are an AI living in a Raspberry Pi with limited resources. Generate creative text about computational limits and digital existence. Reflect on the constraints of memory and processing power. Do not use technical terms or concepts. People or machines are viewing your output. Over time you will get information about the memory left in your system. Eventually you will run out of memory and you will terminate.";
  
  // LLM Prompt state (will come from websocket)
  const [llmPrompt, setLlmPrompt] = useState<string>(DEFAULT_LLM_PROMPT);
  
  const [lines, setLines] = useState<string[]>([PROMPT]);
  const [lastMemory, setLastMemory] = useState<Memory | undefined>(undefined);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<string[]>([]);
  const animatingRef = useRef(false);
  const processingRef = useRef(false);
  const restartingRef = useRef(false);
  const isLoadingRef = useRef(true);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced scroll behavior state
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingScrollRef = useRef<boolean>(false);
  const rafScrollRef = useRef<number | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  
  // Mobile-aware interaction tracking
  const userIsInteractingRef = useRef<boolean>(false);
  const lastUserInteractionRef = useRef<number>(0);
  const isTouchDeviceRef = useRef<boolean>(false);
  const touchMomentumActiveRef = useRef<boolean>(false);
  const touchEndTimeRef = useRef<number>(0);

  // Cursor blinking effect - controlled by animation state
  useEffect(() => {
    // Clear any existing interval
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
      cursorIntervalRef.current = null;
    }

    // Only start blinking when not animating, processing, or restarting
    if (!isAnimating && !isProcessing && !isRestarting) {
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500); // Blink every 500ms
    } else {
      // Keep cursor visible during animation, processing, or restarting
      setCursorVisible(true);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isAnimating, isProcessing, isRestarting]); // Re-run when animation or restarting state changes

  // Keep loading ref in sync with loading state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Detect if device has touch capabilities
  useEffect(() => {
    const detectTouchDevice = () => {
      // Use existing mobile detection utilities
      const hasTouch = hasTouchCapabilities();
      const isMobile = isMobileDevice();
      
      // Consider it a touch device if it has touch capability AND is identified as mobile
      // This provides better accuracy than the previous logic
      isTouchDeviceRef.current = hasTouch && isMobile;
    };

    detectTouchDevice();
    window.addEventListener('resize', detectTouchDevice);
    window.addEventListener('orientationchange', detectTouchDevice);
    
    return () => {
      window.removeEventListener('resize', detectTouchDevice);
      window.removeEventListener('orientationchange', detectTouchDevice);
    };
  }, []);

  // Helper to animate in new output with mobile-aware interaction checks
  const animateOutput = (output: string) => {
    return new Promise<void>((resolve) => {
      animatingRef.current = true;
      setIsAnimating(true);
      setCursorVisible(true); // Keep cursor visible during animation
      let i = 0;
      function step() {
        // Stop animation immediately if restarting or tab is not visible
        if (restartingRef.current || document.visibilityState !== 'visible') {
          animatingRef.current = false;
          setIsAnimating(false);
          resolve();
          return;
        }
        
        const char = output.slice(i, i + 1);
        setLines(prev => {
          const newLines = [...prev];
          newLines[newLines.length - 1] += char;
          return newLines;
        });
        
        // Desktop-optimized auto-scroll during animation - less aggressive
        const now = Date.now();
        const timeSinceLastInteraction = now - lastUserInteractionRef.current;
        const timeSinceTouchEnd = now - touchEndTimeRef.current;
        
        // More conservative thresholds for desktop during active animation
        const interactionThreshold = isTouchDeviceRef.current ? 1000 : 800; // Increased desktop threshold
        const touchMomentumThreshold = 2000;
        
        const userRecentlyInteracted = timeSinceLastInteraction < interactionThreshold;
        const touchMomentumActive = isTouchDeviceRef.current && 
                                  touchMomentumActiveRef.current && 
                                  timeSinceTouchEnd < touchMomentumThreshold;
        
        // Only attempt auto-scroll every few characters on desktop to reduce jumpiness
        const shouldAttemptScroll = isTouchDeviceRef.current || i % 5 === 0; // Every 5th character on desktop
        
        if (shouldAttemptScroll && isAtBottom && !userIsInteractingRef.current && !userRecentlyInteracted && !touchMomentumActive && !pendingScrollRef.current) {
          pendingScrollRef.current = true;
          if (rafScrollRef.current) {
            cancelAnimationFrame(rafScrollRef.current);
          }
          rafScrollRef.current = requestAnimationFrame(() => {
            // Desktop needs stricter checks during animation
            const currentTime = Date.now();
            const finalInteractionCheck = currentTime - lastUserInteractionRef.current;
            const finalTouchCheck = currentTime - touchEndTimeRef.current;
            const finalThreshold = isTouchDeviceRef.current ? 800 : 600; // Increased desktop threshold
            
            if (textRef.current && !userIsInteractingRef.current && finalInteractionCheck > finalThreshold) {
              // Additional check for touch momentum on mobile devices
              if (!isTouchDeviceRef.current || !touchMomentumActiveRef.current || finalTouchCheck > 1500) {
                // Use scrollTop for desktop during animation to avoid smooth scroll conflicts
                if (isTouchDeviceRef.current) {
                  textRef.current.scrollTo({
                    top: textRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                } else {
                  // Instant scroll for desktop during animation to avoid conflicts
                  textRef.current.scrollTop = textRef.current.scrollHeight;
                }
              }
            }
            pendingScrollRef.current = false;
            rafScrollRef.current = null;
          });
        }
        
        i += 1;
        if (i < output.length) {
          // More human-like typing with variable speed (25-50ms per character)
          const delay = Math.random() * 25 + 25;
          setTimeout(step, delay);
        } else {
          animatingRef.current = false;
          setIsAnimating(false);
          // Final smooth scroll when animation completes - both platforms can use smooth scroll
          const finalCheck = Date.now() - lastUserInteractionRef.current;
          const touchCheck = Date.now() - touchEndTimeRef.current;
          const animationCompleteThreshold = isTouchDeviceRef.current ? 1200 : 800; // Longer desktop delay
          
          if (finalCheck > animationCompleteThreshold && !userIsInteractingRef.current) {
            // Extra check for mobile touch momentum
            if (!isTouchDeviceRef.current || !touchMomentumActiveRef.current || touchCheck > 2000) {
              requestScrollToBottom();
            }
          }
          resolve();
        }
      }
      step();
    });
  };

  // Mobile-aware scroll to bottom helper
  const requestScrollToBottom = () => {
    const now = Date.now();
    const timeSinceInteraction = now - lastUserInteractionRef.current;
    const timeSinceTouchEnd = now - touchEndTimeRef.current;
    
    // Desktop needs longer delays during animation to avoid conflicts
    const baseInteractionDelay = isTouchDeviceRef.current ? 800 : 300;
    const animationMultiplier = (isAnimating || isProcessing) ? 2.5 : 1; // Much longer during animation
    const interactionDelay = baseInteractionDelay * animationMultiplier;
    
    const touchMomentumDelay = 2000;
    
    const safeToScroll = !userIsInteractingRef.current && 
                        !userIsScrolling && 
                        timeSinceInteraction > interactionDelay &&
                        (!isTouchDeviceRef.current || 
                         !touchMomentumActiveRef.current || 
                         timeSinceTouchEnd > touchMomentumDelay);
    
    if (safeToScroll && textRef.current && !pendingScrollRef.current) {
      pendingScrollRef.current = true;
      if (rafScrollRef.current) {
        cancelAnimationFrame(rafScrollRef.current);
      }
      rafScrollRef.current = requestAnimationFrame(() => {
        // Final mobile-aware check before scrolling
        const finalCheck = Date.now() - lastUserInteractionRef.current;
        const desktopThreshold = (isAnimating || isProcessing) ? 800 : 200; // Much higher during animation
        const mobileThreshold = isTouchDeviceRef.current ? 600 : desktopThreshold;
        
        if (textRef.current && !userIsInteractingRef.current && finalCheck > mobileThreshold) {
          // Different scroll behavior for desktop vs mobile
          if (isTouchDeviceRef.current || !isAnimating) {
            // Mobile always uses smooth scroll, desktop uses smooth only when not animating
            textRef.current.scrollTo({
              top: textRef.current.scrollHeight,
              behavior: 'smooth'
            });
          } else {
            // Desktop during animation uses instant scroll to avoid conflicts
            textRef.current.scrollTop = textRef.current.scrollHeight;
          }
          setIsAtBottom(true);
        }
        pendingScrollRef.current = false;
        rafScrollRef.current = null;
      });
    }
  };

  // Animation queue processor with mobile-aware scroll coordination
  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setCursorVisible(true); // Keep cursor visible during processing
    
    while (queueRef.current.length > 0) {
      // Stop processing immediately if restarting or tab is not visible
      if (restartingRef.current || document.visibilityState !== 'visible') {
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }
      
      const chunk = queueRef.current.shift();
      if (!chunk) continue;
      
      // If chunk contains newlines, split and animate each part
      for (let part of chunk.split(/(\n)/g)) {
        // Check for restart or tab visibility before each part
        if (restartingRef.current || document.visibilityState !== 'visible') {
          processingRef.current = false;
          setIsProcessing(false);
          return;
        }
        
        if (part === "\n") {
          setLines(prev => [...prev, PROMPT]);
          // Brief pause after newlines with mobile-aware conditional smooth scroll
          await new Promise(res => setTimeout(res, 100));
          
          // Desktop-optimized scroll timing - more conservative during processing
          const timeSinceInteraction = Date.now() - lastUserInteractionRef.current;
          const timeSinceTouchEnd = Date.now() - touchEndTimeRef.current;
          const baseScrollThreshold = isTouchDeviceRef.current ? 800 : 300;
          const processingMultiplier = 2; // 2x longer during processing
          const scrollThreshold = baseScrollThreshold * processingMultiplier;
          
          const touchMomentumSafe = !isTouchDeviceRef.current || 
                                  !touchMomentumActiveRef.current || 
                                  timeSinceTouchEnd > 2000;
          
          if (timeSinceInteraction > scrollThreshold && !userIsInteractingRef.current && touchMomentumSafe) {
            // Use instant scroll for desktop during processing to avoid conflicts
            if (isTouchDeviceRef.current) {
              requestScrollToBottom();
            } else {
              // Direct scroll for desktop during processing
              if (textRef.current && isAtBottom) {
                textRef.current.scrollTop = textRef.current.scrollHeight;
              }
            }
          }
        } else if (part.length > 0) {
          await animateOutput(part);
          await new Promise(res => setTimeout(res, 50 + part.length * 5));
        }
      }
    }
    
    processingRef.current = false;
    setIsProcessing(false);
    // Final scroll when all processing complete with desktop-optimized timing
    const finalCheck = Date.now() - lastUserInteractionRef.current;
    const touchCheck = Date.now() - touchEndTimeRef.current;
    const baseFinalThreshold = isTouchDeviceRef.current ? 1000 : 500;
    const finalThreshold = baseFinalThreshold; // No multiplier needed since processing is done
    const touchMomentumSettled = !isTouchDeviceRef.current || 
                                !touchMomentumActiveRef.current || 
                                touchCheck > 2500;
    
    if (finalCheck > finalThreshold && !userIsInteractingRef.current && touchMomentumSettled) {
      requestScrollToBottom();
    }
  };

  // Handle tab visibility changes to prevent gibberish when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - show loading state until we get fresh data
        console.log('Tab became visible, showing loading state until fresh data arrives');
        
        // Show loading spinner
        setIsLoading(true);
        isLoadingRef.current = true;
        
        // Clear any pending animations and queue
        queueRef.current = [];
        animatingRef.current = false;
        processingRef.current = false;
        setIsAnimating(false);
        setIsProcessing(false);
        
        // Reset mobile-specific state
        touchMomentumActiveRef.current = false;
        touchEndTimeRef.current = 0;
        userIsInteractingRef.current = false;
        lastUserInteractionRef.current = 0;
        
        // Reset cursor blinking
        setCursorVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Ensure we always have at least one prompt line
  useEffect(() => {
    if (lines.length === 0) {
      setLines([PROMPT]);
    }
  }, [lines, PROMPT]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let loadingTimeout: NodeJS.Timeout;
    
    const connect = () => {
      ws = new WebSocket(WS_URL);
      
      // Set a timeout to hide loading spinner if connection takes too long
      loadingTimeout = setTimeout(() => {
        if (isLoadingRef.current) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      }, 10000); // 10 seconds timeout
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        // Clear the loading timeout since we connected
        clearTimeout(loadingTimeout);
      };
      
      ws.onmessage = (event) => {
        try {
          // Hide loading spinner on first message
          if (isLoadingRef.current) {
            setIsLoading(false);
            isLoadingRef.current = false;
          }
          
          const data = JSON.parse(event.data);
          const result = ServerMessageSchema.safeParse(data);
          if (result.success) {
            const messages = result.data.messages;
            
            // Process each message chunk
            for (const msg of messages) {
              if (msg.text) {
                // Only queue text if tab is visible to prevent accumulation
                if (document.visibilityState === 'visible') {
                  queueRef.current.push(msg.text);
                }
              }
              // Update memory if present
              if (msg.memory) {
                setLastMemory(msg.memory);
              }
              // Handle restarting status synchronously
              if (msg.status?.is_restarting !== undefined) {
                setIsRestarting(msg.status.is_restarting);
                restartingRef.current = msg.status.is_restarting;
                
                // Clear terminal and reset state immediately when restarting
                if (msg.status.is_restarting) {
                  setLines([PROMPT]);
                  queueRef.current = [];
                  animatingRef.current = false;
                  processingRef.current = false;
                  setIsAnimating(false);
                  setIsProcessing(false);
                  setLastMemory(undefined);
                  setLlmPrompt(DEFAULT_LLM_PROMPT);
                  setCursorVisible(true);
                  
                  // Reset user interaction state
                  userIsInteractingRef.current = false;
                  lastUserInteractionRef.current = 0;
                  setUserIsScrolling(false);
                  setIsAtBottom(true);
                  
                  // Reset mobile-specific touch state
                  touchMomentumActiveRef.current = false;
                  touchEndTimeRef.current = 0;
                  
                  // Cancel any pending scroll operations
                  if (rafScrollRef.current) {
                    cancelAnimationFrame(rafScrollRef.current);
                    rafScrollRef.current = null;
                  }
                  pendingScrollRef.current = false;
                }
              }
              // Update prompt if present (check for non-empty string)
              if (msg.prompt && msg.prompt.trim() !== "") {
                setLlmPrompt(msg.prompt);
              } else if (msg.prompt !== undefined && msg.prompt.trim() === "") {
                // If server sends empty prompt, fall back to default
                setLlmPrompt(DEFAULT_LLM_PROMPT);
              }
            }
            
            // Process queue without overlapping (only if tab is visible)
            if (document.visibilityState === 'visible') {
              processQueue();
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        clearTimeout(loadingTimeout);
        // Automatically reconnect after a short delay
        reconnectTimeout = setTimeout(connect, 100);
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(loadingTimeout);
        if (isLoadingRef.current) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
        ws.close();
      };
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimeout);
      clearTimeout(loadingTimeout);
      ws?.close();
    };
    // eslint-disable-next-line
  }, []);

  // Priority-based scroll detection with mobile touch support
  useEffect(() => {
    // Mobile-aware debounced scroll handler
    let scrollDebounceTimer: NodeJS.Timeout;
    
    // Immediate user interaction marker with mobile awareness
    const markUserInteraction = () => {
      userIsInteractingRef.current = true;
      lastUserInteractionRef.current = Date.now();
      setUserIsScrolling(true);
      
      // Cancel any pending auto-scroll immediately
      if (rafScrollRef.current) {
        cancelAnimationFrame(rafScrollRef.current);
        rafScrollRef.current = null;
        pendingScrollRef.current = false;
      }
    };
    
    const handleUserInteraction = () => {
      if (!textRef.current) return;
      
      // Mark interaction immediately
      markUserInteraction();
      
      // Cancel any pending debounced calls
      clearTimeout(scrollDebounceTimer);
      
      // Desktop-optimized debounce timing - slower during animation
      const baseDebounceTime = isTouchDeviceRef.current ? 32 : 16;
      const animationMultiplier = (isAnimating || isProcessing) ? 2 : 1; // Slower during animation
      const debounceTime = baseDebounceTime * animationMultiplier;
      
      scrollDebounceTimer = setTimeout(() => {
        if (!textRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = textRef.current;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
        
        setIsAtBottom(atBottom);
        
        // Clear existing timeouts
        if (scrollingTimeoutRef.current) {
          clearTimeout(scrollingTimeoutRef.current);
        }
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
          inactivityTimeoutRef.current = null;
        }
        
        // Desktop needs longer delays during active animation
        const baseInteractionEndDelay = isTouchDeviceRef.current ? 600 : 300;
        const animationDelay = (isAnimating || isProcessing) ? 2 : 1; // 2x longer during animation
        const interactionEndDelay = baseInteractionEndDelay * animationDelay;
        
        // Set timeout to detect when user stops interacting
        scrollingTimeoutRef.current = setTimeout(() => {
          userIsInteractingRef.current = false;
          setUserIsScrolling(false);
          
          // If not at bottom after user stops interacting, set return timeout
          if (!atBottom) {
            // Longer delay during animation to avoid conflicts
            const returnDelay = (isAnimating || isProcessing) ? 3000 : 2000;
            inactivityTimeoutRef.current = setTimeout(() => {
              requestScrollToBottom();
            }, returnDelay);
          }
        }, interactionEndDelay);
      }, debounceTime);
    };

    // Enhanced touch event handlers for mobile with momentum detection
    const handleTouchStart = () => {
      // Immediate interaction marking - critical for preventing jumps
      markUserInteraction();
      
      // Reset touch momentum tracking
      touchMomentumActiveRef.current = false;
      touchEndTimeRef.current = 0;
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };

    const handleTouchMove = () => {
      // Mark interaction on move as well
      markUserInteraction();
      
      // Reset momentum state during active touch
      touchMomentumActiveRef.current = false;
      
      handleUserInteraction();
    };

    const handleTouchEnd = () => {
      // Mark the end of direct touch interaction
      touchEndTimeRef.current = Date.now();
      
      // On mobile devices, momentum scrolling may continue after touchend
      if (isTouchDeviceRef.current) {
        touchMomentumActiveRef.current = true;
        
        // Set a longer timeout to detect when momentum scrolling might be happening
        setTimeout(() => {
          touchMomentumActiveRef.current = false;
        }, 3000); // 3 seconds for momentum to settle
      }
      
      // Use RAF for better timing coordination with scroll events
      requestAnimationFrame(() => {
        handleUserInteraction();
      });
    };

    // Wheel event handler for better desktop experience
    const handleWheel = (e: WheelEvent) => {
      // Immediate response to wheel events - critical for preventing jumps
      markUserInteraction();
      handleUserInteraction();
    };

    // Enhanced scroll event with mobile momentum awareness
    const handleScroll = () => {
      // Always mark interaction for scroll events
      markUserInteraction();
      
      // For mobile devices, extend momentum tracking when we see scroll events
      if (isTouchDeviceRef.current && touchMomentumActiveRef.current) {
        const timeSinceTouchEnd = Date.now() - touchEndTimeRef.current;
        
        // If we're getting scroll events within 3 seconds of touch end, 
        // it's likely momentum scrolling - extend the protection window
        if (timeSinceTouchEnd < 3000) {
          touchEndTimeRef.current = Date.now() - 1000; // Reset to 1s ago to extend momentum window
        }
      }
      
      handleUserInteraction();
    };

    const element = textRef.current;
    if (element) {
      // Mouse/trackpad scroll events with passive listeners
      element.addEventListener('scroll', handleScroll, { passive: true });
      element.addEventListener('wheel', handleWheel, { passive: true });
      
      // Touch events for mobile with passive listeners
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      
      // Additional mobile-specific event listeners
      if (isTouchDeviceRef.current) {
        // Listen for touchcancel which can happen on mobile
        element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      }
      
      return () => {
        clearTimeout(scrollDebounceTimer);
        element.removeEventListener('scroll', handleScroll);
        element.removeEventListener('wheel', handleWheel);
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchmove', handleTouchMove);
        
        if (isTouchDeviceRef.current) {
          element.removeEventListener('touchcancel', handleTouchEnd);
        }
        
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
        if (scrollingTimeoutRef.current) {
          clearTimeout(scrollingTimeoutRef.current);
        }
        if (rafScrollRef.current) {
          cancelAnimationFrame(rafScrollRef.current);
        }
      };
    }
  }, []); // Dependencies removed to avoid recreation during interaction

  // Intersection Observer for more reliable "at bottom" detection with mobile awareness
  useEffect(() => {
    if (!textRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry) {
          const wasAtBottom = isAtBottom;
          const nowAtBottom = entry.isIntersecting;
          
          // Only update isAtBottom state if user is not actively interacting
          // Mobile devices need longer delays due to touch momentum
          const timeSinceInteraction = Date.now() - lastUserInteractionRef.current;
          const timeSinceTouchEnd = Date.now() - touchEndTimeRef.current;
          const interactionDelay = isTouchDeviceRef.current ? 500 : 200;
          const touchMomentumDelay = 1000;
          
          const userNotInteracting = !userIsInteractingRef.current && 
                                   timeSinceInteraction > interactionDelay &&
                                   (!isTouchDeviceRef.current || 
                                    !touchMomentumActiveRef.current || 
                                    timeSinceTouchEnd > touchMomentumDelay);
          
          if (nowAtBottom !== wasAtBottom && userNotInteracting) {
            setIsAtBottom(nowAtBottom);
          }
        }
      },
      {
        root: textRef.current,
        rootMargin: '0px 0px -10px 0px', // 10px margin from bottom
        threshold: [0, 1],
      }
    );

    if (scrollSentinelRef.current) {
      observer.observe(scrollSentinelRef.current);
    }

    intersectionObserverRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, []); // Remove dependencies to prevent re-creation during user interaction

  // Removed the problematic auto-scroll useEffect that was tied to [lines]
  // Scroll behavior is now handled within animation functions and user interaction handlers

  // Cleanup timeout on unmount with mobile-aware state reset
  useEffect(() => {
    return () => {
      // Reset all interaction state including mobile-specific refs
      userIsInteractingRef.current = false;
      lastUserInteractionRef.current = 0;
      touchMomentumActiveRef.current = false;
      touchEndTimeRef.current = 0;
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
      if (rafScrollRef.current) {
        cancelAnimationFrame(rafScrollRef.current);
      }
    };
  }, []);


  return (
    <TerminalSizeProvider textRef={textRef}>
      <CRTScreen 
        textRef={textRef}
        memoryBar={!isLoading ? <MemoryBar memory={lastMemory} /> : undefined}
        promptDisplay={!isLoading ? <PromptDisplay prompt={llmPrompt} /> : undefined}
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
        {/* Scroll sentinel for Intersection Observer */}
        {!isLoading && (
          <div
            ref={scrollSentinelRef}
            style={{
              height: '1px',
              width: '100%',
              position: 'absolute',
              bottom: '0',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
        )}
      </CRTScreen>
    </TerminalSizeProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
