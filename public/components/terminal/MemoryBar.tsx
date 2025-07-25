import React from 'react';
import { terminalStyles, terminalClasses } from '../../styles/terminalStyles';
import { useTerminalSize } from '../context/TerminalSizeContext';
import type { Memory } from '../../types/types';

interface MemoryBarProps {
  memory?: Memory;
}

export const MemoryBar: React.FC<MemoryBarProps> = ({ memory }) => {
  const { terminalWidth } = useTerminalSize();
  // Use default values when no memory data is available
  const available_mb = memory?.available_mb ?? 0;
  const total_mb = memory?.total_mb ?? 8192; // Default 8GB
  const percent_used = memory?.percent_used ?? 0;
  
  // Responsive layout calculation - always try to keep on one line
  const getResponsiveLayout = () => {
    if (terminalWidth < 40) {
      return {
        barWidth: Math.max(8, terminalWidth - 20), // More space for labels on mobile
        showFullText: false,
        abbreviateLabel: true,
      };
    } else if (terminalWidth < 60) {
      return {
        barWidth: Math.max(15, terminalWidth - 28), // Adjust for better spacing
        showFullText: false,
        abbreviateLabel: false,
      };
    } else if (terminalWidth < 80) {
      return {
        barWidth: Math.max(25, terminalWidth - 32), // Leave more space for text
        showFullText: false,
        abbreviateLabel: false,
      };
    } else {
      return {
        barWidth: Math.max(35, terminalWidth - 35), // Fill most of the width
        showFullText: true,
        abbreviateLabel: false,
      };
    }
  };
  
  const { barWidth, showFullText, abbreviateLabel } = getResponsiveLayout();
  
  // Ensure percent_used is within valid range and calculate filled width properly
  const safePercentUsed = Math.max(0, Math.min(100, percent_used));
  const filledWidth = Math.max(0, Math.round((safePercentUsed / 100) * barWidth));
  const emptyWidth = Math.max(0, barWidth - filledWidth);
  
  const formatMemoryText = () => {
    const used_gb = (total_mb * safePercentUsed / 100 / 1024);
    if (showFullText) {
      return `Used ${safePercentUsed.toFixed(1)}% (${used_gb.toFixed(1)}GB)`;
    } else if (abbreviateLabel) {
      return `Used ${safePercentUsed.toFixed(0)}%`;
    } else {
      return `Used ${safePercentUsed.toFixed(0)}% (${used_gb.toFixed(1)}GB)`;
    }
  };

  const getLabel = () => {
    return "Memory";
  };

  return (
    <div className={`w-full ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
      <div className="flex items-center justify-between bg-green-500 text-black px-2 py-1">
        <span className="flex-shrink-0">{getLabel()}</span>
        <span className="flex-1 mx-1 sm:mx-2 text-center overflow-hidden font-mono">
          {'█'.repeat(filledWidth)}{'▒'.repeat(emptyWidth)}
        </span>
        <span className="flex-shrink-0 text-right text-xs sm:text-base">
          {formatMemoryText()}
        </span>
      </div>
    </div>
  );
};
