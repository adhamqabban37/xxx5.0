'use client';

import { useState, useEffect } from 'react';

export interface GuidanceItem {
  id: string;
  task: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: number; // 1-10 scale
  impact: 'high' | 'medium' | 'low';
  completed: boolean;
  category: string;
  estimatedTime: string;
  resources?: string[];
}

export interface GuidanceSection {
  title: string;
  description: string;
  progress: number; // 0-100 percentage
  totalItems: number;
  completedItems: number;
  items: GuidanceItem[];
}

interface GuidanceData {
  aeo: GuidanceSection;
  traditionalSEO: GuidanceSection;
  businessProfile?: {
    name: string;
    industry: string;
    hasProfile: boolean;
  };
  lastUpdated: string;
}

const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[priority]}`}
    >
      {priority}
    </span>
  );
};

const ImpactBadge = ({ impact }: { impact: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: 'bg-purple-100 text-purple-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[impact]}`}
    >
      Impact: {impact}
    </span>
  );
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    ></div>
  </div>
);

const GuidanceSectionCard = ({ section, color }: { section: GuidanceSection; color: string }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const updateItemStatus = async (itemId: string, completed: boolean) => {
    try {
      await fetch('/api/ai/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, completed }),
      });
      // In a real app, you'd update the local state or refetch data
    } catch (error) {
      // Error updating item status
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{section.progress}%</div>
            <div className="text-sm text-gray-500">
              {section.completedItems} of {section.totalItems} completed
            </div>
          </div>
        </div>
        <ProgressBar progress={section.progress} />
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {section.items.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-colors ${
                item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => updateItemStatus(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4
                      className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                    >
                      {item.task}
                    </h4>
                    <div className="flex gap-2 ml-4">
                      <PriorityBadge priority={item.priority} />
                      <ImpactBadge impact={item.impact} />
                    </div>
                  </div>

                  <p
                    className={`text-sm mb-3 ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {item.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>Category: {item.category}</span>
                    <span>Effort: {item.effort}/10</span>
                    <span>Time: {item.estimatedTime}</span>
                  </div>

                  {item.resources && item.resources.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {expandedItems.has(item.id) ? 'Hide' : 'Show'} Resources (
                        {item.resources.length})
                      </button>
                      {expandedItems.has(item.id) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.resources.map((resource, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function SEOGuidanceSection() {
  const [guidanceData, setGuidanceData] = useState<GuidanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuidanceData = async () => {
      try {
        const response = await fetch('/api/ai/guidance');
        const data = await response.json();

        if (data.success) {
          setGuidanceData(data.data);
        } else {
          setError('Failed to load guidance data');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGuidanceData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-800 font-medium mb-2">Error Loading Guidance</div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!guidanceData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">SEO Optimization Guide</h2>
        <p className="text-gray-600">
          AI-powered recommendations to improve your search engine visibility
        </p>
        {guidanceData.lastUpdated && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(guidanceData.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GuidanceSectionCard section={guidanceData.aeo} color="blue" />
        <GuidanceSectionCard section={guidanceData.traditionalSEO} color="green" />
      </div>
    </div>
  );
}
