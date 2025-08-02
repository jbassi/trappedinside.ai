import React from 'react';
import { BarBase, BarButton } from './BarBase';
import { useTerminalSize } from '../context/TerminalSizeContext';

export type TaskBarTab = 'terminal' | 'info';

interface TaskBarProps {
  selectedTab?: TaskBarTab;
  onTabChange?: (tab: TaskBarTab) => void;
  onScrollToTop?: () => void;
  onScrollToBottom?: () => void;
}

export const TaskBar: React.FC<TaskBarProps> = ({
  selectedTab = 'terminal',
  onTabChange,
  onScrollToTop,
  onScrollToBottom,
}) => {
  const { terminalWidth } = useTerminalSize();

  // Match the StatusBar's responsive sizing
  const getResponsiveLayout = () => {
    if (terminalWidth < 40) {
      return {
        compact: true,
      };
    } else {
      return {
        compact: false,
      };
    }
  };

  const { compact } = getResponsiveLayout();

  // Handle scroll button clicks
  const handleScrollToTop = () => {
    if (onScrollToTop) {
      onScrollToTop();
    }
  };

  const handleScrollToBottom = () => {
    if (onScrollToBottom) {
      onScrollToBottom();
    }
  };

  return (
    <BarBase>
      {/* Left side - Tab buttons */}
      <div className="flex items-center gap-1">
        <BarButton
          selected={selectedTab === 'terminal'}
          onClick={() => onTabChange?.('terminal')}
          className={compact ? 'px-1 py-0.5' : ''}
        >
          Terminal
        </BarButton>
        <BarButton
          selected={selectedTab === 'info'}
          onClick={() => onTabChange?.('info')}
          className={compact ? 'px-1 py-0.5' : ''}
        >
          Info
        </BarButton>
      </div>

      {/* Right side - Navigation buttons */}
      <div className="flex items-center gap-1">
        <BarButton
          onClick={handleScrollToTop}
          className={compact ? 'px-1 py-0.5' : ''}
          aria-label="Scroll to top"
        >
          {compact ? '↑' : 'To top'}
        </BarButton>
        <BarButton
          onClick={handleScrollToBottom}
          className={compact ? 'px-1 py-0.5' : ''}
          aria-label="Scroll to bottom"
        >
          {compact ? '↓' : 'To bottom'}
        </BarButton>
      </div>
    </BarBase>
  );
};
