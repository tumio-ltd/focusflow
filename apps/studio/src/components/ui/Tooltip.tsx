import React, { useState, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: ReactNode;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'start' | 'end';
  children: ReactNode;
  className?: string;
}

export function Tooltip({
  content,
  shortcut,
  position = 'top',
  align = 'center',
  children,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClass = () => {
    if (position === 'top') {
      if (align === 'start') return 'bottom-full left-0 mb-2';
      if (align === 'end') return 'bottom-full right-0 mb-2';
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
    if (position === 'bottom') {
      if (align === 'start') return 'top-full left-0 mt-2';
      if (align === 'end') return 'top-full right-0 mt-2';
      return 'top-full left-1/2 -translate-x-1/2 mt-2';
    }
    if (position === 'left') {
      return 'right-full top-1/2 -translate-y-1/2 mr-2';
    }
    if (position === 'right') {
      return 'left-full top-1/2 -translate-y-1/2 ml-2';
    }
    return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
  };

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap pointer-events-none select-none flex items-center gap-2',
            'bg-slate-900/95 text-slate-100 dark:bg-[#131924]/95 dark:text-slate-100',
            'border border-slate-700/80 dark:border-white/15',
            'rounded-lg backdrop-blur-md',
            'shadow-[0_8px_24px_-4px_rgba(0,0,0,0.7),0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
            'animate-in fade-in zoom-in-95 duration-100 ease-out',
            getPositionClass()
          )}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-white/10 border border-white/15 rounded text-[10px] font-mono text-cyan-400 font-semibold shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
