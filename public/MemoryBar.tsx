import React from 'react';
import type { Memory } from './types';

interface MemoryBarProps {
  memory?: Memory;
  terminalWidth: number;
}

export const MemoryBar: React.FC<MemoryBarProps> = ({ memory, terminalWidth }) => {
  // Always show the bar, use default values when no data
  const usedMB = memory ? memory.total_mb - memory.available_mb : 0;
  const usedGB = (usedMB / 1024).toFixed(2);
  const totalGB = memory ? (memory.total_mb / 1024).toFixed(2) : '0.00';
  const percentUsed = memory ? memory.percent_used : 0.0;
  
  // Calculate dynamic bar length based on terminal width
  const textPortion = `Memory[] Used ${percentUsed.toFixed(1)}% (${usedGB}G/${totalGB}G)`;
  const textLength = textPortion.length;
  const availableForBar = Math.max(15, terminalWidth - textLength - 3); // Reduced buffer to 3 chars
  const barLength = Math.min(availableForBar, 120); // Increased cap to 120 chars
  
  const filledLength = Math.round((percentUsed / 100) * barLength);
  const emptyLength = barLength - filledLength;
  const filledBar = '|'.repeat(filledLength);
  const emptyBar = '.'.repeat(emptyLength);
  
  return (
    <div className="text-black font-mono mb-2 select-none w-full overflow-hidden whitespace-nowrap bg-green-400 py-1 px-2 flex justify-center">
      <span>Memory[{filledBar}{emptyBar}] Used {percentUsed.toFixed(1)}% ({usedGB}G/{totalGB}G)</span>
    </div>
  );
};
