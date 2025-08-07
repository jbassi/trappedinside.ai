import React from 'react';
import { terminalStyles, terminalClasses } from '../../styles/terminalStyles';

interface BarBaseProps {
  children: React.ReactNode;
  className?: string;
}

export const BarBase: React.FC<BarBaseProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`w-full ${terminalClasses.baseText} ${className}`}
      style={terminalStyles.baseText}
    >
      <div className="flex items-center justify-between bg-green-500 text-black px-2 py-1 h-[26px] sm:h-[30px]">
        {children}
      </div>
    </div>
  );
};

interface BarButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const BarButton: React.FC<BarButtonProps> = ({
  children,
  onClick,
  selected = false,
  className = '',
}) => {
  const baseClasses = 'px-2 py-0.5 text-xs sm:text-base font-mono transition-colors duration-150';
  const selectedClasses = selected
    ? 'bg-black text-green-500 font-bold'
    : 'hover:bg-green-600 active:bg-green-600 cursor-pointer touch-action-manipulation select-none';

  const blurTarget = (el: EventTarget & HTMLElement) => {
    // Ensure the button loses focus to prevent sticky :active on iOS Safari
    if (el && typeof el.blur === 'function') {
      el.blur();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    blurTarget(e.currentTarget);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    blurTarget(e.currentTarget);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    blurTarget(e.currentTarget);
  };

  return (
    <button
      onClick={onClick}
      onTouchEnd={handleTouchEnd}
      onPointerUp={handlePointerUp}
      onMouseUp={handleMouseUp}
      className={`${baseClasses} ${selectedClasses} ${className}`}
      type="button"
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
    >
      {children}
    </button>
  );
};
