import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'slate' | 'amber' | 'emerald' | 'rose';
}

export function Badge({ className, variant = 'cyan', children, ...props }: BadgeProps) {
  const variants = {
    cyan: 'bg-cyan-950/80 border-cyan-800 text-cyan-300',
    slate: 'bg-slate-800/80 border-slate-700 text-slate-300',
    amber: 'bg-amber-950/80 border-amber-800 text-amber-300',
    emerald: 'bg-emerald-950/80 border-emerald-800 text-emerald-300',
    rose: 'bg-rose-950/80 border-rose-800 text-rose-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border tracking-tight font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
