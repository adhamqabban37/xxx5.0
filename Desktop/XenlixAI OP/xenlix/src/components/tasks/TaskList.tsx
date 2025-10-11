'use client';
import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { Check, Copy, Code, ChevronDown, ChevronRight } from 'lucide-react';

export const TaskList: React.FC = () => {
  const { tasks, toggleTask } = useTaskStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, snippet?: string) => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed';
        const isOpen = expanded[task.id];
        return (
          <div
            key={task.id}
            className={`group relative border rounded-lg px-4 py-3 transition bg-slate-800/60 border-slate-700 hover:border-cyan-500/40 ${isCompleted ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button
                role="checkbox"
                aria-checked={isCompleted}
                onClick={() => toggleTask(task.id)}
                className={`mt-1 w-5 h-5 flex items-center justify-center rounded-md border text-xs transition focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-0 ${isCompleted ? 'bg-gradient-to-br from-cyan-400 to-fuchsia-500 border-cyan-400 text-slate-900' : 'border-slate-500 hover:border-cyan-400 bg-slate-900'}`}
              >
                {isCompleted && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [task.id]: !isOpen }))}
                    className="text-left flex items-center gap-1 text-white font-medium hover:text-cyan-300"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className={`${isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </span>
                  </button>
                  {typeof task.impact === 'number' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-600/40">
                      +{task.impact} pts
                    </span>
                  )}
                  {task.effort && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-600/30 text-gray-300 border border-slate-600/40">
                      {task.effort}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {task.snippet && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [task.id]: !isOpen }))}
                    className="p-2 rounded bg-slate-700/60 hover:bg-slate-600 text-cyan-300 hover:text-cyan-200"
                    aria-label="Toggle code"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                )}
                {task.snippet && (
                  <button
                    onClick={() => handleCopy(task.id, task.snippet)}
                    className="p-2 rounded bg-slate-700/60 hover:bg-slate-600 text-cyan-300 hover:text-cyan-200"
                    aria-label="Copy snippet"
                  >
                    {copiedId === task.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {isOpen && task.snippet && (
              <div className="mt-3 bg-slate-900/80 border border-slate-700 rounded-md p-3 overflow-x-auto text-[11px] text-green-400 relative">
                <pre className="whitespace-pre-wrap">
                  <code>{task.snippet}</code>
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
