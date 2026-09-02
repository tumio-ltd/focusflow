import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  children,
  className,
}: TooltipProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = window.setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      let x = rect.left + rect.width / 2;
      let y = rect.top;

      if (position === 'top') {
        y = rect.top - 6;
      } else if (position === 'bottom') {
        y = rect.bottom + 6;
      } else if (position === 'right') {
        x = rect.right + 6;
        y = rect.top + rect.height / 2;
      } else if (position === 'left') {
        x = rect.left - 6;
        y = rect.top + rect.height / 2;
      }

      setCoords({ x, y });
    }, 400);
  }, [position]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCoords(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {coords && typeof document !== 'undefined' && createPortal(
        <div
          className={cn(
            'fixed z-[9999] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap pointer-events-none select-none flex items-center gap-2',
            'bg-slate-900 text-slate-100 dark:bg-[#111722] dark:text-slate-100',
            'border border-slate-700 dark:border-white/20',
            'rounded-lg shadow-xl'
          )}
          style={{
            left: `${Math.round(coords.x)}px`,
            top: `${Math.round(coords.y)}px`,
            transform: position === 'top' 
              ? 'translate(-50%, -100%)' 
              : position === 'bottom' 
              ? 'translate(-50%, 0)' 
              : position === 'right' 
              ? 'translate(0, -50%)' 
              : 'translate(-100%, -50%)',
          }}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-white/10 border border-white/15 rounded text-[10px] font-mono text-cyan-400 font-semibold">
              {shortcut}
            </kbd>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
