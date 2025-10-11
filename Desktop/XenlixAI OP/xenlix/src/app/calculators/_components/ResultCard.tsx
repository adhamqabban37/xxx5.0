'use client';

import { ReactNode } from 'react';

// Simple cn utility function
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ResultCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export function ResultCard({ title, children, className, loading = false }: ResultCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      <div className="p-6">
        <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">{title}</h3>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string | ReactNode;
  delta?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  className?: string;
}

export function MetricRow({ label, value, delta, className }: MetricRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-2', className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{value}</span>
        {delta && (
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              delta.type === 'increase' && 'bg-green-100 text-green-800',
              delta.type === 'decrease' && 'bg-red-100 text-red-800',
              delta.type === 'neutral' && 'bg-gray-100 text-gray-800'
            )}
          >
            {delta.type === 'increase' && '↑'}
            {delta.type === 'decrease' && '↓'}
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ActionButton({
  onClick,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  className,
}: ActionButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  };

  const sizeClasses = {
    sm: 'h-9 px-3',
    default: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}

interface BreakdownTableProps {
  items: { name: string; price: number }[];
  total?: number;
  formatPrice?: (price: number) => string;
}

export function BreakdownTable({
  items,
  total,
  formatPrice = (price) => `$${price.toFixed(2)}`,
}: BreakdownTableProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-medium">{formatPrice(item.price)}</span>
        </div>
      ))}
      {total !== undefined && (
        <>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
