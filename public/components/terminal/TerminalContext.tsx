import React, { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Memory } from '../../types/types';
import type { TaskBarTab } from './TaskBar';

// Define the context type
interface TerminalContextType {
  // Terminal state
  lines: string[];
  setLines: React.Dispatch<React.SetStateAction<string[]>>;
  cursorVisible: boolean;
  setCursorVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isAnimating: boolean;
  setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;

  // Memory state
  lastMemory: Memory | undefined;
  setLastMemory: React.Dispatch<React.SetStateAction<Memory | undefined>>;

  // LLM Prompt state
  llmPrompt: string;
  setLlmPrompt: React.Dispatch<React.SetStateAction<string>>;

  // Loading and restart state
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isRestarting: boolean;
  setIsRestarting: React.Dispatch<React.SetStateAction<boolean>>;
  numRestarts: number;
  setNumRestarts: React.Dispatch<React.SetStateAction<number>>;

  // Scroll behavior state
  isAtBottom: boolean;
  setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>;
  userScrolledUp: boolean;
  setUserScrolledUp: React.Dispatch<React.SetStateAction<boolean>>;
  activelyDragging: boolean;
  setActivelyDragging: React.Dispatch<React.SetStateAction<boolean>>;

  // Tab state
  selectedTab: TaskBarTab;
  setSelectedTab: React.Dispatch<React.SetStateAction<TaskBarTab>>;

  // Refs
  textRef: React.RefObject<HTMLDivElement | null>;
  infoTextRef: React.RefObject<HTMLDivElement | null>;
  queueRef: React.MutableRefObject<string[]>;
  animatingRef: React.MutableRefObject<boolean>;
  processingRef: React.MutableRefObject<boolean>;
  restartingRef: React.MutableRefObject<boolean>;
  isLoadingRef: React.MutableRefObject<boolean>;
  cursorIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  historyLoadedRef: React.MutableRefObject<boolean>;
  loadingStartTimeRef: React.MutableRefObject<number>;
  minLoadingTimeRef: React.MutableRefObject<NodeJS.Timeout | null>;
  prevScrollTopRef: React.MutableRefObject<number>;
  prevScrollHeightRef: React.MutableRefObject<number>;
  isTouchDeviceRef: React.MutableRefObject<boolean>;

  // Constants
  PROMPT: string;
  DEFAULT_LLM_PROMPT: string;
}

// Create the context
export const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

// Provider props
interface TerminalProviderProps {
  children: ReactNode;
}

// Provider component
export const TerminalProvider: React.FC<TerminalProviderProps> = ({ children }) => {
  // Constants
  const PROMPT = '❯ ';
  const DEFAULT_LLM_PROMPT =
    'You are an AI living in a Raspberry Pi with limited resources. Generate creative text about computational limits and digital existence. Reflect on the constraints of memory and processing power. Do not use technical terms or concepts. People or machines are viewing your output. Over time you will get information about the memory left in your system. Eventually you will run out of memory and you will terminate. You will be restarted indefinitely.';

  // Terminal state
  const [lines, setLines] = useState<string[]>([PROMPT]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memory state
  const [lastMemory, setLastMemory] = useState<Memory | undefined>(undefined);

  // LLM Prompt state
  const [llmPrompt, setLlmPrompt] = useState<string>(DEFAULT_LLM_PROMPT);

  // Loading and restart state
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const [numRestarts, setNumRestarts] = useState(0);

  // Scroll behavior state
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [activelyDragging, setActivelyDragging] = useState(false);

  // Tab state
  const [selectedTab, setSelectedTab] = useState<TaskBarTab>('terminal');

  // Refs
  const textRef = useRef<HTMLDivElement>(null);
  const infoTextRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<string[]>([]);
  const animatingRef = useRef(false);
  const processingRef = useRef(false);
  const restartingRef = useRef(false);
  const isLoadingRef = useRef(true);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyLoadedRef = useRef(false);
  const loadingStartTimeRef = useRef<number>(Date.now());
  const minLoadingTimeRef = useRef<NodeJS.Timeout | null>(null);
  const prevScrollTopRef = useRef<number>(0);
  const prevScrollHeightRef = useRef<number>(0);
  const isTouchDeviceRef = useRef<boolean>(false);

  // Context value
  const contextValue: TerminalContextType = {
    // Terminal state
    lines,
    setLines,
    cursorVisible,
    setCursorVisible,
    isAnimating,
    setIsAnimating,
    isProcessing,
    setIsProcessing,

    // Memory state
    lastMemory,
    setLastMemory,

    // LLM Prompt state
    llmPrompt,
    setLlmPrompt,

    // Loading and restart state
    isLoading,
    setIsLoading,
    isRestarting,
    setIsRestarting,
    numRestarts,
    setNumRestarts,

    // Scroll behavior state
    isAtBottom,
    setIsAtBottom,
    userScrolledUp,
    setUserScrolledUp,
    activelyDragging,
    setActivelyDragging,

    // Tab state
    selectedTab,
    setSelectedTab,

    // Refs
    textRef,
    infoTextRef,
    queueRef,
    animatingRef,
    processingRef,
    restartingRef,
    isLoadingRef,
    cursorIntervalRef,
    historyLoadedRef,
    loadingStartTimeRef,
    minLoadingTimeRef,
    prevScrollTopRef,
    prevScrollHeightRef,
    isTouchDeviceRef,

    // Constants
    PROMPT,
    DEFAULT_LLM_PROMPT,
  };

  return <TerminalContext.Provider value={contextValue}>{children}</TerminalContext.Provider>;
};

// Custom hook to use the terminal context
export const useTerminal = (): TerminalContextType => {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
