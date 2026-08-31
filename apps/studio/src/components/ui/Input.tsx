import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full rounded-lg bg-white dark:bg-slate-900/90 border px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-all',
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50'
            : 'border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
