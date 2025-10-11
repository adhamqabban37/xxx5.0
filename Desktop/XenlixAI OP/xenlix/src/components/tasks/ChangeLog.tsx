'use client';
import React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { CheckCircle, RefreshCw, TrendingUp, Undo2, Sparkles } from 'lucide-react';

const iconMap: Record<string, JSX.Element> = {
  task_completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  task_unchecked: <Undo2 className="w-4 h-4 text-yellow-400" />,
  rescan_started: <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />,
  rescan_completed: <Sparkles className="w-4 h-4 text-fuchsia-400" />,
  score_gain: <TrendingUp className="w-4 h-4 text-emerald-400" />,
};

export const ChangeLog: React.FC = () => {
  const { events } = useTaskStore();

  if (!events.length) {
    return (
      <div className="text-center p-6 text-sm text-gray-500">
        No activity yet. Complete tasks or run a re-scan to build history.
      </div>
    );
  }

  return (
    <div className="relative pl-4 before:absolute before:top-0 before:bottom-0 before:left-1.5 before:w-px before:bg-slate-700/60 space-y-5">
      {events.map((evt) => (
        <div key={evt.id} className="relative pl-4">
          <div className="absolute -left-2.5 top-0 w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-slate-900">
            {iconMap[evt.type] || <Sparkles className="w-4 h-4 text-cyan-300" />}
          </div>
          <div className="text-xs text-gray-500 mb-0.5">
            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-gray-200">{evt.message}</div>
        </div>
      ))}
    </div>
  );
};
