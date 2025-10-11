import React from 'react';

interface StatProps {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function Stat({
  value,
  label,
  sublabel,
  icon,
  trend = 'neutral',
  className = '',
}: StatProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-primary';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg
          className="w-4 h-4 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg
          className="w-4 h-4 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      className={`
      relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 
      p-6 shadow-lg transition-all duration-300 hover:bg-white/15 hover:scale-105 
      focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
      ${className}
    `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Icon */}
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-primary/20 text-primary">
            {icon}
          </div>
        )}

        {/* Value with Trend */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-3xl sm:text-4xl font-bold ${getTrendColor()}`}>{value}</span>
          {getTrendIcon()}
        </div>

        {/* Label */}
        <h3 className="text-lg font-semibold text-white mb-1">{label}</h3>

        {/* Sublabel */}
        {sublabel && <p className="text-sm text-gray-300 leading-relaxed">{sublabel}</p>}
      </div>

      {/* Decorative Element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    </div>
  );
}

interface StatsGridProps {
  stats: Array<{
    value: string;
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  className?: string;
}

export function StatsGrid({ stats, className = '' }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <Stat
          key={index}
          value={stat.value}
          label={stat.label}
          sublabel={stat.sublabel}
          icon={stat.icon}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}
