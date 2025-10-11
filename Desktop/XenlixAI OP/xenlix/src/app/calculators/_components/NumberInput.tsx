'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

// Simple cn utility function
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  error?: string;
  suffix?: string;
  prefix?: string;
  showSteppers?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      value,
      onChange,
      min = 0,
      max = Infinity,
      step = 1,
      helpText,
      error,
      suffix,
      prefix,
      showSteppers = true,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value) || 0;
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    };

    const handleIncrement = () => {
      const newValue = Math.min(value + step, max);
      onChange(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(value - step, min);
      onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    };

    return (
      <div className="space-y-2">
        <label
          htmlFor={props.id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>

        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            type="number"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              prefix && 'pl-8',
              suffix && 'pr-12',
              showSteppers && 'pr-16',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            aria-describedby={helpText || error ? `${props.id}-description` : undefined}
            aria-invalid={!!error}
            {...props}
          />

          {suffix && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
              {suffix}
            </div>
          )}

          {showSteppers && !disabled && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
              <button
                type="button"
                onClick={handleIncrement}
                disabled={value >= max}
                className="h-4 w-6 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Increase ${label}`}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleDecrement}
                disabled={value <= min}
                className="h-4 w-6 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Decrease ${label}`}
              >
                ▼
              </button>
            </div>
          )}
        </div>

        {(helpText || error) && (
          <p
            id={`${props.id}-description`}
            className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}
          >
            {error || helpText}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
