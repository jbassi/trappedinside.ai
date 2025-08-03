import React from 'react';
import { BarBase, BarButton } from './BarBase';
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
          className="px-3 py-0.5"
        >
          Terminal
        </BarButton>
        <BarButton
          selected={selectedTab === 'info'}
          onClick={() => onTabChange?.('info')}
          className="px-3 py-0.5"
        >
          Info
        </BarButton>
      </div>

      {/* Right side - Navigation buttons */}
      <div className="flex items-center gap-1">
        <BarButton
          onClick={handleScrollToTop}
          className="!px-6 py-0.5 w-[15rem] text-center"
          aria-label="Scroll to top"
        >
          &nbsp;&nbsp;&nbsp;↑&nbsp;&nbsp;&nbsp;
        </BarButton>
        <BarButton
          onClick={handleScrollToBottom}
          className="!px-6 py-0.5 w-[15rem] text-center"
          aria-label="Scroll to bottom"
        >
          &nbsp;&nbsp;&nbsp;↓&nbsp;&nbsp;&nbsp;
        </BarButton>
      </div>
    </BarBase>
  );
};
