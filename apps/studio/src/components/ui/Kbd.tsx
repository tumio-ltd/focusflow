import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5',
        'rounded text-[11px] font-mono font-semibold select-none',
        'bg-muted/90 text-primary border border-border/50',
        'shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.35)]',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
