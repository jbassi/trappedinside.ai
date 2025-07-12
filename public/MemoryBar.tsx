import React from 'react';
import { terminalStyles, terminalClasses } from './terminalStyles';
import type { Memory } from './types';

interface MemoryBarProps {
  memory?: Memory;
  terminalWidth: number;
}

export const MemoryBar: React.FC<MemoryBarProps> = ({ memory, terminalWidth }) => {
  // Use default values when no memory data is available
  const available_mb = memory?.available_mb ?? 0;
  const total_mb = memory?.total_mb ?? 8192; // Default 8GB
  const percent_used = memory?.percent_used ?? 0;
  
  // Responsive layout calculation - always try to keep on one line
  const getResponsiveLayout = () => {
    if (terminalWidth < 40) {
      return {
        barWidth: Math.max(12, terminalWidth - 15), // Leave space for "Memory" and percentage
        showFullText: false,
        abbreviateLabel: true,
      };
    } else if (terminalWidth < 60) {
      return {
        barWidth: Math.max(20, terminalWidth - 20), // Leave space for labels
        showFullText: false,
        abbreviateLabel: false,
      };
    } else if (terminalWidth < 80) {
      return {
        barWidth: Math.max(30, terminalWidth - 25), // Leave space for full text
        showFullText: false,
        abbreviateLabel: false,
      };
    } else {
      return {
        barWidth: Math.max(40, terminalWidth - 30), // Fill most of the width
        showFullText: true,
        abbreviateLabel: false,
      };
    }
  };
  
  const { barWidth, showFullText, abbreviateLabel } = getResponsiveLayout();
  const filledWidth = Math.floor((percent_used / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  
  const formatMemoryText = () => {
    if (showFullText) {
      return `Used ${percent_used.toFixed(1)}% (${(total_mb / 1024).toFixed(1)}G)`;
    } else if (abbreviateLabel) {
      return `Used ${percent_used.toFixed(0)}%`;
    } else {
      return `Used ${percent_used.toFixed(0)}% (${(total_mb / 1024).toFixed(1)}G)`;
    }
  };

  const getLabel = () => {
    return "Memory";
  };

  return (
    <div className={`w-full ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
      <div className="flex items-center justify-between">
        <span className="flex-shrink-0">{getLabel()}</span>
        <span className="flex-1 mx-1 sm:mx-2 text-center overflow-hidden">
          {'█'.repeat(filledWidth)}{'░'.repeat(emptyWidth)}
        </span>
        <span className="flex-shrink-0 text-right text-xs sm:text-base" style={terminalWidth < 40 ? terminalStyles.smallText : terminalStyles.baseText}>
          {formatMemoryText()}
        </span>
      </div>
    </div>
  );
};
