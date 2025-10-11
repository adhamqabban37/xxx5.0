'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface RecommendationListProps {
  recommendations: any[];
  type: 'quickWins' | 'immediate' | 'shortTerm' | 'longTerm';
}

export function RecommendationList({ recommendations, type }: RecommendationListProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">No recommendations yet</p>
        <p className="text-xs mt-1">
          {type === 'quickWins'
            ? 'Quick wins will appear after analysis'
            : 'Recommendations will be generated after scan completion'}
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'schema':
        return 'bg-blue-100 text-blue-800';
      case 'content':
        return 'bg-purple-100 text-purple-800';
      case 'technical':
        return 'bg-orange-100 text-orange-800';
      case 'citations':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {recommendations.slice(0, type === 'quickWins' ? 3 : 5).map((rec, index) => (
        <div
          key={rec.id || index}
          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getImpactIcon(rec.impact || rec.expectedImpact)}
              <h4 className="font-medium text-sm">{rec.title}</h4>
            </div>
            <div className="flex space-x-2">
              {rec.priority && (
                <Badge variant="secondary" className={getPriorityColor(rec.priority)}>
                  {rec.priority}
                </Badge>
              )}
              {rec.category && (
                <Badge variant="outline" className={getCategoryColor(rec.category)}>
                  {rec.category}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{rec.description}</p>

          {rec.actionItems && Array.isArray(rec.actionItems) && rec.actionItems.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Action Items:</p>
              <ul className="space-y-1">
                {rec.actionItems.slice(0, 3).map((item: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-1">•</span>
                    <span className="line-clamp-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {type === 'quickWins' && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-600 font-medium">Quick Win</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Start Now
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}

          {rec.estimatedEffort && (
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Effort: {rec.estimatedEffort}</span>
              <span>Impact: {rec.expectedImpact || rec.impact}</span>
            </div>
          )}
        </div>
      ))}

      {recommendations.length > (type === 'quickWins' ? 3 : 5) && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" className="text-xs">
            View All ({recommendations.length})
          </Button>
        </div>
      )}
    </div>
  );
}
