import React, { useState, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: ReactNode;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
  className?: string;
}

export function Tooltip({
  content,
  shortcut,
  position = 'top',
  children,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
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
            'absolute z-50 px-2 py-1 text-[11px] font-medium text-slate-100 bg-slate-900 border border-slate-700/80 rounded-md shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100',
            positionStyles[position]
          )}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-600/60 rounded text-[10px] font-mono text-cyan-300">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
