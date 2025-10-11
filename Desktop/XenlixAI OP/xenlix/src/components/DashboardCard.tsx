import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function DashboardCard({ title, icon, children, className }: DashboardCardProps) {
  return (
    <div
      className={`bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700 flex flex-col gap-4 min-w-[280px] ${className || ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-cyan-400 text-2xl">{icon}</span>}
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
