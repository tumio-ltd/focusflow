import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  valueDisplay?: string | number;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, valueDisplay, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {(label || valueDisplay !== undefined) && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            {label && <span>{label}</span>}
            {valueDisplay !== undefined && (
              <span className="font-mono text-primary bg-muted px-1.5 py-0.5 rounded border border-border">
                {valueDisplay}
              </span>
            )}
          </div>
        )}
        <input
          type="range"
          ref={ref}
          className={cn(
            'w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
