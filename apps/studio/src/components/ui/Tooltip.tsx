import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { Kbd } from './Kbd';

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
  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    position: 'top' | 'bottom' | 'left' | 'right';
    align: 'center' | 'start' | 'end';
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = window.setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      let effectiveAlign = align;

      if (position === 'top' || position === 'bottom') {
        // 自动视口碰撞规避：当居中显示会导致左右超出边界时，自适应切换至 end 或 start 对齐
        if (effectiveAlign === 'center') {
          if (viewportWidth - rect.right < 160) {
            effectiveAlign = 'end';
          } else if (rect.left < 160) {
            effectiveAlign = 'start';
          }
        }

        let x = rect.left + rect.width / 2;
        if (effectiveAlign === 'end') {
          x = Math.min(viewportWidth - 10, rect.right);
        } else if (effectiveAlign === 'start') {
          x = Math.max(10, rect.left);
        }

        const y = position === 'top' ? rect.top - 6 : rect.bottom + 6;
        setCoords({ x, y, position, align: effectiveAlign });
      } else if (position === 'right') {
        const x = rect.right + 6;
        const y = rect.top + rect.height / 2;
        setCoords({ x, y, position, align: effectiveAlign });
      } else if (position === 'left') {
        const x = rect.left - 6;
        const y = rect.top + rect.height / 2;
        setCoords({ x, y, position, align: effectiveAlign });
      }
    }, 400);
  }, [position, align]);

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

  const getTransform = (pos: 'top' | 'bottom' | 'left' | 'right', al: 'center' | 'start' | 'end') => {
    if (pos === 'top') {
      const tx = al === 'end' ? '-100%' : al === 'start' ? '0%' : '-50%';
      return `translate(${tx}, -100%)`;
    }
    if (pos === 'bottom') {
      const tx = al === 'end' ? '-100%' : al === 'start' ? '0%' : '-50%';
      return `translate(${tx}, 0%)`;
    }
    if (pos === 'right') {
      return 'translate(0%, -50%)';
    }
    return 'translate(-100%, -50%)';
  };

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
            'bg-slate-900/95 text-slate-100 dark:bg-[#111722]/95 dark:text-slate-100',
            'border border-slate-700/60 dark:border-white/15',
            'backdrop-blur-md rounded-lg shadow-elevation-dropdown animate-in fade-in zoom-in-95 duration-100 ease-spring'
          )}
          style={{
            left: `${Math.round(coords.x)}px`,
            top: `${Math.round(coords.y)}px`,
            transform: getTransform(coords.position, coords.align),
          }}
        >
          <span>{content}</span>
          {shortcut && (
            <div className="flex items-center gap-1">
              {shortcut.split(' ').map((keyPart, i) => (
                <Kbd key={i}>{keyPart}</Kbd>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
