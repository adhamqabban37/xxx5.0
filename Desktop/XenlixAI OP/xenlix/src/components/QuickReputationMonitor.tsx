'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface QuickReputationData {
  overallHealth: number;
  newReviews: number;
  ratingChange: string;
  alertCount: number;
  consistencyStatus: string;
  lastChecked?: string;
}

interface QuickReputationMonitorProps {
  url?: string;
  businessName?: string;
  onViewDetails?: () => void;
}

const QuickReputationMonitor: React.FC<QuickReputationMonitorProps> = ({ 
  url, 
  businessName, 
  onViewDetails 
}) => {
  const [data, setData] = useState<QuickReputationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuickData = async () => {
    if (!url || !businessName) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/reputation-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, businessName }),
      });

      if (response.ok) {
        const result = await response.json();
        const reputationData = result.data;
        
        setData({
          overallHealth: reputationData.overallHealth,
          newReviews: reputationData.newReviews.length,
          ratingChange: reputationData.ratingChange,
          alertCount: reputationData.alerts.length,
          consistencyStatus: reputationData.entityConsistency.status,
          lastChecked: reputationData.lastChecked
        });
      }
    } catch (error) {
      console.error('Failed to fetch reputation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickData();
  }, [url, businessName]);

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthLabel = (health: number) => {
    if (health >= 80) return 'Excellent';
    if (health >= 60) return 'Good';
    if (health >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getConsistencyColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-50 text-green-700';
      case 'Minor Issues': return 'bg-yellow-50 text-yellow-700';
      case 'Major Mismatch': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Reputation Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Reputation Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <div className="text-sm text-gray-500 mb-3">
              Add business details to monitor reputation
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewDetails}
              className="text-xs"
            >
              Setup Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Reputation Monitor
          </div>
          {data.alertCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {data.alertCount} alerts
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Health */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Overall Health</span>
            <span className={`text-sm font-semibold ${getHealthColor(data.overallHealth)}`}>
              {data.overallHealth}%
            </span>
          </div>
          <Progress value={data.overallHealth} className="h-2" />
          <div className="text-xs text-gray-500 mt-1">
            {getHealthLabel(data.overallHealth)}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-semibold">{data.newReviews}</span>
            </div>
            <div className="text-xs text-gray-500">New Reviews</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {data.ratingChange.startsWith('+') ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-sm font-semibold ${
                data.ratingChange.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.ratingChange}
              </span>
            </div>
            <div className="text-xs text-gray-500">Rating Change</div>
          </div>
        </div>

        {/* Consistency Status */}
        <div>
          <Badge 
            className={`text-xs w-full justify-center ${getConsistencyColor(data.consistencyStatus)}`}
            variant="outline"
          >
            {data.consistencyStatus} Consistency
          </Badge>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewDetails}
          className="w-full text-xs"
        >
          <Eye className="h-3 w-3 mr-2" />
          View Details
        </Button>

        {/* Last Updated */}
        {data.lastChecked && (
          <div className="text-xs text-gray-400 text-center">
            Updated {new Date(data.lastChecked).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickReputationMonitor;