import React, { useRef } from 'react';
import { terminalStyles, terminalClasses } from '../../styles/terminalStyles';
import { useTerminalSize } from '../context/TerminalSizeContext';
import { useTerminal } from './TerminalContext';
import type { Memory } from '../../types/types';
import { useFontMeasurement } from '../../hooks/useFontMeasurement';

interface StatusBarProps {
  memory?: Memory;
}

export const StatusBar: React.FC<StatusBarProps> = ({ memory }) => {
  const { terminalWidth } = useTerminalSize();
  const { numRestarts } = useTerminal();
  const barRef = useRef<HTMLDivElement | null>(null);
  const { measureCharacterWidth } = useFontMeasurement(
    barRef as unknown as React.RefObject<HTMLElement>,
    { testText: '█'.repeat(200), multipleCharacters: true }
  );

  const total_mb = memory?.total_mb ?? 0;
  const percent_used = memory?.percent_used ?? 0;

  const getResponsiveTextRules = () => {
    if (terminalWidth < 40) {
      return { showFullText: false, abbreviateLabel: true };
    } else if (terminalWidth < 80) {
      return { showFullText: false, abbreviateLabel: false };
    }
    return { showFullText: true, abbreviateLabel: false };
  };

  const { showFullText, abbreviateLabel } = getResponsiveTextRules();

  const safePercentUsed = Math.max(0, Math.min(100, percent_used));
  const stripePx = Math.max(6, Math.round(measureCharacterWidth()));

  const formatMemoryText = () => {
    const used_gb = (total_mb * safePercentUsed) / 100 / 1024;
    if (showFullText) {
      return `Used ${safePercentUsed.toFixed(1)}% (${used_gb.toFixed(1)}GB)`;
    } else if (abbreviateLabel) {
      return `Used ${safePercentUsed.toFixed(0)}%`;
    } else {
      return `Used ${safePercentUsed.toFixed(0)}% (${used_gb.toFixed(1)}GB)`;
    }
  };

  const getLabel = () => {
    return 'Memory';
  };

  return (
    <div className={`w-full ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
      <div className="flex items-center justify-between bg-green-500 text-black px-2 py-1">
        <span className="flex-shrink-0 mr-1">{getLabel()}</span>
        <div
          ref={barRef}
          className="relative flex-1 mx-1 h-4 overflow-hidden px-1 rounded-sm"
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 pointer-events-none select-none"
            aria-hidden
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.25) 1px, transparent 1px)`,
              backgroundSize: `${stripePx}px 100%`,
            }}
          />
          {/* Empty track */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,0.3)',
            }}
            aria-hidden
          />
          {/* Filled track */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${safePercentUsed}%`,
              background: 'rgba(0,0,0,1)'
            }}
          />
        </div>
        <span className="flex-shrink-0 text-right text-xs sm:text-base ml-1">{formatMemoryText()}</span>
        <span className="flex-shrink-0 border-l border-black ml-2 pl-2 text-xs sm:text-base">
          Restarts: {numRestarts ?? 0}
        </span>
      </div>
    </div>
  );
};
