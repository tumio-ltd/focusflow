import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'cyan' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg border border-transparent';

    const variants = {
      default: 'bg-muted/50 text-foreground hover:bg-muted/80 hover:text-foreground',
      secondary: 'bg-muted/50 text-foreground hover:bg-muted/80 hover:text-foreground',
      outline: 'bg-muted/40 text-foreground hover:bg-muted/80 hover:text-primary',
      ghost: 'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      cyan: 'bg-primary text-primary-foreground font-semibold hover:opacity-95 active:opacity-100 shadow-md shadow-primary/20',
      destructive: 'bg-destructive/15 text-destructive hover:bg-destructive/25',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-xs gap-2',
      lg: 'h-10 px-4 text-sm gap-2.5',
      icon: 'h-8 w-8 p-0 shrink-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
