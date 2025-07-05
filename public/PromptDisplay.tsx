import React from "react";

interface PromptDisplayProps {
  prompt: string;
  terminalWidth: number;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt, terminalWidth }) => {
  // Use almost all available space for text wrapping
  const maxLineLength = Math.max(40, terminalWidth - 4);
  
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          // Word is too long, break it gracefully
          if (word.length > maxWidth) {
            lines.push(word.substring(0, maxWidth - 1) + '-');
            currentLine = word.substring(maxWidth - 1);
          } else {
            currentLine = word;
          }
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim());
    }
    return lines.length > 0 ? lines : [''];
  };
  
  const promptLines = wrapText(prompt, maxLineLength);
  
    return (
    <div className="text-green-400 font-mono text-base mb-4 w-full" style={{ 
      fontFamily: 'monospace',
      textShadow: '0 0 5px rgba(0,255,0,0.5)'
    }}>
      {/* Header line with full-width # border and centered P R O M P T */}
      <div className="w-full relative overflow-hidden whitespace-nowrap">
        <div className="absolute inset-0">
          {"#".repeat(200)}
        </div>
        <div className="relative z-10 flex justify-center">
          <span className="px-1" style={{ 
            fontFamily: 'monospace',
            textShadow: '0 0 5px rgba(0,255,0,0.5)',
            backgroundColor: 'rgba(0,0,0,1)',
            color: '#00ff00'
          }}> P R O M P T </span>
        </div>
      </div>
      
      {/* Content lines with # borders on left and right only */}
      {promptLines.map((line, index) => (
        <div key={index} className="w-full flex items-center">
          <span className="text-green-400">#</span>
          <span className="flex-1 text-green-400 px-2" style={{ 
            fontFamily: 'monospace',
            textShadow: '0 0 5px rgba(0,255,0,0.5)',
            fontSize: 'inherit'
          }}>
            {line}
          </span>
          <span className="text-green-400">#</span>
        </div>
      ))}
      
      {/* Bottom border */}
      <div className="w-full overflow-hidden whitespace-nowrap">
        {"#".repeat(200)}
      </div>
    </div>
  );
}; 