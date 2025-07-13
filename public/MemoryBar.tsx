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
        barWidth: Math.max(8, terminalWidth - 18), // Leave space for "Memory" and percentage
        showFullText: false,
        abbreviateLabel: true,
      };
    } else if (terminalWidth < 60) {
      return {
        barWidth: Math.max(15, terminalWidth - 25), // Leave space for labels
        showFullText: false,
        abbreviateLabel: false,
      };
    } else if (terminalWidth < 80) {
      return {
        barWidth: Math.max(25, terminalWidth - 30), // Leave space for full text
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
  const filledWidth = Math.floor((percent_used / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  
  const formatMemoryText = () => {
    const used_gb = (total_mb * percent_used / 100 / 1024);
    if (showFullText) {
      return `Used ${percent_used.toFixed(1)}% (${used_gb.toFixed(1)}GB)`;
    } else if (abbreviateLabel) {
      return `Used ${percent_used.toFixed(0)}%`;
    } else {
      return `Used ${percent_used.toFixed(0)}% (${used_gb.toFixed(1)}GB)`;
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
