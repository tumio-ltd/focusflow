import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'slate' | 'amber' | 'emerald' | 'rose';
}

export function Badge({ className, variant = 'cyan', children, ...props }: BadgeProps) {
  const variants = {
    cyan: 'bg-primary/10 border-primary/20 text-primary',
    slate: 'bg-muted/60 border-border/40 text-foreground',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border tracking-tight font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
