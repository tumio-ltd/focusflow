import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'cyan'
    | 'primary'
    | 'cta'
    | 'destructive'
    | 'linear'
    | 'ai'
    | 'ai-ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg whitespace-nowrap shrink-0 cursor-pointer border border-transparent active:scale-[0.985] active:translate-y-[0.5px]';

    const variants = {
      default:
        'bg-muted/50 text-foreground hover:bg-muted/80 hover:text-foreground shadow-keycap hover:shadow-keycap-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      secondary:
        'bg-muted/50 text-foreground hover:bg-muted/80 hover:text-foreground shadow-keycap hover:shadow-keycap-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      primary: 'ff-btn-primary font-semibold hover:-translate-y-[0.5px]',
      cyan:
        'bg-primary text-primary-foreground font-semibold hover:opacity-95 active:opacity-100 shadow-keycap-cyan hover:shadow-keycap-cyan-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      cta: 'bg-[var(--ff-cta-bg)] text-[var(--ff-cta-text)] border border-[var(--ff-cta-border)] hover:bg-[var(--ff-cta-hover)] font-semibold shadow-keycap hover:shadow-keycap-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      linear:
        'bg-[var(--ff-cta-bg)] text-[var(--ff-cta-text)] border border-[var(--ff-cta-border)] hover:bg-[var(--ff-cta-hover)] font-semibold shadow-keycap hover:shadow-keycap-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      ai: 'bg-[var(--ff-ai-bg)] text-[var(--ff-ai-text)] border border-[var(--ff-ai-border)] hover:bg-[var(--ff-ai-bg-hover)] hover:border-[var(--ff-ai-border-hover)] font-semibold shadow-keycap hover:shadow-keycap-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      'ai-ghost':
        'bg-transparent text-[var(--ff-ai-text-muted)] hover:text-[var(--ff-ai-text)] hover:bg-[var(--ff-ai-bg)] font-semibold shadow-none hover:-translate-y-[0.5px]',
      outline:
        'bg-muted/30 text-foreground hover:bg-muted/80 hover:text-primary shadow-keycap hover:shadow-keycap-hover active:shadow-keycap-active hover:-translate-y-[0.5px]',
      ghost:
        'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-none hover:-translate-y-[0.5px]',
      destructive:
        'bg-destructive/15 text-destructive hover:bg-destructive/25 shadow-keycap active:shadow-keycap-active hover:-translate-y-[0.5px]',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs gap-1',
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-xs gap-2',
      lg: 'h-10 px-4 text-sm gap-2.5',
      icon: 'h-8 w-8 p-0 shrink-0',
      'icon-sm': 'h-7 w-7 p-0 shrink-0',
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
