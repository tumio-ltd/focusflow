import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'slate' | 'amber' | 'emerald' | 'rose';
}

export function Badge({ className, variant = 'cyan', children, ...props }: BadgeProps) {
  const variants = {
    cyan: 'bg-primary/15 text-primary',
    slate: 'bg-muted/60 text-foreground',
    amber: 'bg-amber-500/15 text-amber-500',
    emerald: 'bg-emerald-500/15 text-emerald-500',
    rose: 'bg-rose-500/15 text-rose-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono tracking-tight font-medium border border-transparent',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
