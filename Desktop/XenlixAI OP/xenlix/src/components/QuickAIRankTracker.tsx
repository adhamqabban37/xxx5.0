/**
 * Quick AI Rank Tracker Widget
 * A compact version for dashboard widgets
 */

'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Target, 
  Search,
  Loader2,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface QuickAIRankTrackerProps {
  className?: string;
}

const AI_ENGINES = ['ChatGPT', 'Perplexity', 'Bing Copilot', 'Google SGE'];

export function QuickAIRankTracker({ className = "" }: QuickAIRankTrackerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickTrack = () => {
    if (urlInput.trim() && queryInput.trim()) {
      // Redirect to enhanced dashboard with parameters
      const params = new URLSearchParams({
        url: urlInput.trim(),
        query: queryInput.trim()
      });
      window.location.href = `/dashboard/enhanced?${params.toString()}`;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Rank Tracker</h3>
          </div>
          <Link 
            href="/dashboard/enhanced"
            className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
            Full Tracker
          </Link>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Track your business visibility across AI search engines
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter business website URL..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <div>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder='Enter search query (e.g., "best dentist near me")...'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleQuickTrack()}
            />
          </div>

          <button
            onClick={handleQuickTrack}
            disabled={!urlInput.trim() || !queryInput.trim() || isLoading}
            className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Track AI Visibility
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-xs text-purple-800">
            <div className="font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              AI Engines Tracked:
            </div>
            <div className="grid grid-cols-2 gap-1">
              {AI_ENGINES.map((engine, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span>{engine}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-purple-600 text-xs">
              Get visibility scores, rankings, and competitor analysis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickAIRankTracker;