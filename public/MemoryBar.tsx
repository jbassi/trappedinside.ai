import React from 'react';
import { terminalStyles, terminalClasses } from './terminalStyles';
import type { Memory } from './types';

interface MemoryBarProps {
  memory: Memory | undefined;
  terminalWidth: number;
}

export const MemoryBar: React.FC<MemoryBarProps> = ({ memory, terminalWidth }) => {
  if (!memory) return null;

  const { available_mb, total_mb, percent_used } = memory;
  
  // Calculate the width of the memory bar
  const barWidth = Math.min(terminalWidth - 20, 60); // Leave space for text
  const filledWidth = Math.floor((percent_used / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  return (
    <div className={`w-full ${terminalClasses.baseText}`} style={terminalStyles.baseText}>
      <div className="flex items-center justify-between">
        <span>Memory</span>
        <span className="flex-1 mx-4 text-center">
          {'█'.repeat(filledWidth)}{'░'.repeat(emptyWidth)}
        </span>
        <span>
          Used {percent_used.toFixed(1)}% ({(available_mb / 1024).toFixed(1)}G/{(total_mb / 1024).toFixed(1)}G)
        </span>
      </div>
    </div>
  );
};
