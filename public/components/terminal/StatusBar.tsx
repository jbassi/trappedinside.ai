import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const barRef = useRef<HTMLSpanElement | null>(null);
  const { measureCharacterWidth } = useFontMeasurement(
    barRef as unknown as React.RefObject<HTMLElement>,
    { testText: '█'.repeat(200), multipleCharacters: true }
  );
  const [barCharCapacity, setBarCharCapacity] = useState<number>(30);

  const total_mb = memory?.total_mb ?? 0;
  const percent_used = memory?.percent_used ?? 0;

  // Responsive text rules; bar width is measured from the actual remaining space
  const getResponsiveTextRules = () => {
    if (terminalWidth < 40) {
      return { showFullText: false, abbreviateLabel: true };
    } else if (terminalWidth < 80) {
      return { showFullText: false, abbreviateLabel: false };
    }
    return { showFullText: true, abbreviateLabel: false };
  };

  const { showFullText, abbreviateLabel } = getResponsiveTextRules();

  // Measure how many characters can fit in the center bar span
  const recalcBarCapacity = useCallback(() => {
    if (!barRef.current) return;
    const containerWidth = barRef.current.clientWidth;
    const styles = getComputedStyle(barRef.current);
    const paddingLeft = parseFloat(styles.paddingLeft || '0') || 0;
    const paddingRight = parseFloat(styles.paddingRight || '0') || 0;
    const innerWidth = Math.max(0, containerWidth - paddingLeft - paddingRight);
    if (innerWidth <= 0) return;
    const charWidth = measureCharacterWidth();
    const capacity = Math.max(1, Math.floor(innerWidth / charWidth));
    setBarCharCapacity(capacity);
  }, [measureCharacterWidth]);

  useEffect(() => {
    recalcBarCapacity();
    const ro = new ResizeObserver(() => recalcBarCapacity());
    if (barRef.current) ro.observe(barRef.current);
    window.addEventListener('resize', recalcBarCapacity);
    window.addEventListener('orientationchange', recalcBarCapacity);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recalcBarCapacity);
      window.removeEventListener('orientationchange', recalcBarCapacity);
    };
  }, [recalcBarCapacity]);

  // Ensure percent_used is within valid range and calculate filled width properly
  const safePercentUsed = Math.max(0, Math.min(100, percent_used));
  const computedFilled = Math.floor((safePercentUsed / 100) * barCharCapacity);
  const filledWidth = Math.max(
    0,
    Math.min(
      barCharCapacity,
      safePercentUsed < 100 && computedFilled >= barCharCapacity && barCharCapacity > 1
        ? barCharCapacity - 1
        : computedFilled
    )
  );
  const emptyWidth = Math.max(0, barCharCapacity - filledWidth);

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
        <span
          ref={barRef}
          className="flex-1 mx-1 text-center overflow-hidden font-mono whitespace-nowrap px-1"
        >
          {'█'.repeat(filledWidth)}
          {'▒'.repeat(emptyWidth)}
        </span>
        <span className="flex-shrink-0 text-right text-xs sm:text-base ml-1">{formatMemoryText()}</span>
        <span className="flex-shrink-0 border-l border-black ml-2 pl-2 text-xs sm:text-base">
          Restarts: {numRestarts ?? 0}
        </span>
      </div>
    </div>
  );
};
