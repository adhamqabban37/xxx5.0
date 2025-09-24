'use client';

import React, { useEffect, useRef } from 'react';
import { Trend } from '@/types/aeo';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  showDots?: boolean;
  trend?: Trend;
}

export default function Sparkline({
  data,
  width = 80,
  height = 20,
  color = '#3B82F6',
  strokeWidth = 1.5,
  className = '',
  showDots = false,
  trend = 'stable',
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = svgRef.current;
    
    // Clear previous content
    svg.innerHTML = '';

    // Calculate dimensions
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max values
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Generate points
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return { x, y, value };
    });

    // Create path
    const pathData = points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    // Create path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', strokeWidth.toString());
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(path);

    // Add dots if requested
    if (showDots) {
      points.forEach((point, index) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '1.5');
        circle.setAttribute('fill', color);
        
        // Add hover effect for last point
        if (index === points.length - 1) {
          circle.setAttribute('r', '2');
          circle.setAttribute('fill', getTrendColor(trend));
        }
        
        svg.appendChild(circle);
      });
    }

  }, [data, width, height, color, strokeWidth, showDots, trend]);

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-gray-400 text-xs ${className}`}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={className}
      style={{ overflow: 'visible' }}
    />
  );
}

// Sparkline with trend indicator
interface TrendSparklineProps extends SparklineProps {
  label?: string;
  currentValue?: number;
  previousValue?: number;
  changePercent?: number;
  formatValue?: (value: number) => string;
}

export function TrendSparkline({
  label,
  currentValue,
  previousValue,
  changePercent,
  formatValue = (v) => v.toFixed(1),
  trend = 'stable',
  data,
  ...sparklineProps
}: TrendSparklineProps) {
  const trendColor = getTrendColor(trend ?? 'stable');
  const trendIcon = getTrendIcon(trend ?? 'stable');

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {label && (
          <div className="text-xs text-gray-500 mb-1">{label}</div>
        )}
        <div className="flex items-center space-x-2">
          <Sparkline
            data={data}
            color={trendColor}
            trend={trend}
            {...sparklineProps}
          />
          <div className="flex items-center space-x-1">
            <span className={`text-xs ${trendColor}`}>
              {trendIcon}
            </span>
            {changePercent !== undefined && (
              <span className={`text-xs font-medium ${getChangeColor(changePercent)}`}>
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        {currentValue !== undefined && (
          <div className="text-sm font-semibold text-gray-900 mt-1">
            {formatValue(currentValue)}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini sparkline for dashboard cards
interface MiniSparklineProps {
  data: number[];
  trend: 'up' | 'down' | 'stable' | 'no-data';
  size?: 'sm' | 'md' | 'lg';
}

export function MiniSparkline({ data, trend, size = 'sm' }: MiniSparklineProps) {
  const dimensions = {
    sm: { width: 40, height: 16 },
    md: { width: 60, height: 20 },
    lg: { width: 80, height: 24 },
  };

  const { width, height } = dimensions[size];

  return (
    <div className="flex items-center space-x-1">
      <Sparkline
        data={data}
        width={width}
        height={height}
        color={getTrendColor(trend)}
        strokeWidth={1}
      />
      <span className={`text-xs ${getTrendColor(trend)}`}>
        {getTrendIcon(trend)}
      </span>
    </div>
  );
}

// Dashboard card with sparkline
interface DashboardCardWithSparklineProps {
  title: string;
  value: string | number;
  previousValue?: number;
  trend: Trend;
  sparklineData: number[];
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
  subtitle?: string;
  subtitleClass?: string;
  children?: React.ReactNode;
}

export function DashboardCardWithSparkline({
  title,
  value,
  previousValue,
  trend,
  sparklineData,
  unit = '',
  icon,
  className = '',
  subtitle,
  subtitleClass = '',
  children,
}: DashboardCardWithSparklineProps) {
  const change = previousValue !== undefined 
    ? (typeof value === 'number' ? value - previousValue : 0)
    : 0;
  
  const changePercent = previousValue && previousValue !== 0 
    ? (change / previousValue) * 100 
    : 0;

  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <MiniSparkline data={sparklineData} trend={trend} size="md" />
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {value}{unit}
          </div>
          {previousValue !== undefined && (
            <div className="flex items-center space-x-1 mt-1">
              <span className={`text-xs font-medium ${getChangeColor(changePercent)}`}>
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
          {subtitle && (
            <div className={`text-sm mt-1 ${subtitleClass}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// Performance metric card with multiple sparklines
interface PerformanceCardProps {
  title: string;
  metrics: Array<{
    name: string;
    value: number;
    previousValue?: number;
    sparklineData: number[];
    trend: 'up' | 'down' | 'stable' | 'no-data';
    color?: string;
  }>;
  className?: string;
}

export function PerformanceCard({ title, metrics, className = '' }: PerformanceCardProps) {
  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{metric.name}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metric.value}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <Sparkline
                  data={metric.sparklineData}
                  width={100}
                  height={16}
                  color={metric.color || getTrendColor(metric.trend)}
                  strokeWidth={1}
                />
                <div className="flex items-center space-x-1">
                  <span className={`text-xs ${metric.color || getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                  </span>
                  {metric.previousValue !== undefined && (
                    <span className={`text-xs font-medium ${getChangeColor(
                      ((metric.value - metric.previousValue) / metric.previousValue) * 100
                    )}`}>
                      {metric.value > metric.previousValue ? '+' : ''}
                      {(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function getTrendColor(trend: Trend): string {
  switch (trend) {
    case 'up': return 'text-green-500';
    case 'down': return 'text-red-500';
    case 'stable': return 'text-blue-500';
    case 'no-data': return 'text-gray-400';
    default: return 'text-gray-400';
  }
}

function getTrendIcon(trend: Trend): string {
  switch (trend) {
    case 'up': return '↗';
    case 'down': return '↘';
    case 'stable': return '→';
    case 'no-data': return '?';
    default: return '?';
  }
}

function getChangeColor(changePercent: number): string {
  if (Math.abs(changePercent) < 1) return 'text-gray-500';
  return changePercent > 0 ? 'text-green-600' : 'text-red-600';
}