/**
 * Citation Dashboard Component
 *
 * Real-time monitoring dashboard for citation system health and performance
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe,
  Clock,
  Target,
} from 'lucide-react';

interface CitationStats {
  overview: {
    totalCitations: number;
    uniqueDomains: number;
    liveCitations: number;
    livePercentage: number;
    checkedCitations: number;
  };
  confidence: {
    average: number;
    minimum: number;
    maximum: number;
  };
  authority: {
    average: number;
    minimum: number;
    maximum: number;
    count: number;
  } | null;
  citationTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  topDomains: Array<{
    domain: string;
    count: number;
    percentage: number;
  }>;
  health: Array<{
    isLive: boolean;
    count: number;
    percentage: number;
  }> | null;
  metadata: {
    generatedAt: string;
    timeRange: string;
    includesHealth: boolean;
    includesAuthority: boolean;
  };
}

interface CitationDashboardProps {
  className?: string;
}

export function CitationDashboard({ className }: CitationDashboardProps) {
  const [stats, setStats] = useState<CitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('day');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/citations/stats?timeRange=${timeRange}&includeHealth=true&includeAuthority=true`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch statistics');
        }

        setStats(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [timeRange]
  );

  // Initial load and time range changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStats(false); // Don't show loading spinner for auto-refresh
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, fetchStats]);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number, decimals = 0) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading dashboard: {error}</span>
            </div>
            <Button variant="outline" onClick={() => fetchStats()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Citation Analytics</h2>
          <p className="text-gray-600">Real-time monitoring of citation extraction and health</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last Day</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={() => fetchStats()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalCitations)}</div>
            <p className="text-xs text-muted-foreground">
              From {formatNumber(stats.overview.uniqueDomains)} unique domains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-bold ${getHealthColor(stats.overview.livePercentage)}`}
              >
                {formatNumber(stats.overview.livePercentage, 1)}%
              </div>
              {stats.overview.livePercentage >= 90 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.overview.liveCitations)} live citations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(stats.confidence.average)}`}>
              {formatNumber(stats.confidence.average * 100, 1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Range: {formatNumber(stats.confidence.minimum * 100, 1)}% -{' '}
              {formatNumber(stats.confidence.maximum * 100, 1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authority Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.authority ? (
              <>
                <div className="text-2xl font-bold">{formatNumber(stats.authority.average, 1)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.authority.count)} domains scored
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No authority data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">Citation Types</TabsTrigger>
          <TabsTrigger value="domains">Top Domains</TabsTrigger>
          <TabsTrigger value="health">Health Details</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Citation Type Distribution</CardTitle>
              <CardDescription>Breakdown of citation formats found in AI responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.citationTypes.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {type.type}
                        </Badge>
                        <span className="text-sm">{formatNumber(type.count)} citations</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatNumber(type.percentage, 1)}%
                      </span>
                    </div>
                    <Progress value={type.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Cited Domains</CardTitle>
              <CardDescription>Top domains by citation frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topDomains.slice(0, 8).map((domain, index) => (
                  <div key={domain.domain} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{domain.domain}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(domain.count)} citations
                        </span>
                      </div>
                      <span className="text-sm">{formatNumber(domain.percentage, 1)}%</span>
                    </div>
                    <Progress value={domain.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Citation Health Status</CardTitle>
              <CardDescription>
                Live status of cited URLs based on recent health checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.health ? (
                <div className="space-y-4">
                  {stats.health.map((status) => (
                    <div key={status.isLive ? 'live' : 'dead'} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {status.isLive ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {status.isLive ? 'Live URLs' : 'Dead URLs'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(status.count)} citations
                          </span>
                        </div>
                        <span className="text-sm">{formatNumber(status.percentage, 1)}%</span>
                      </div>
                      <Progress
                        value={status.percentage}
                        className={`h-2 ${status.isLive ? 'bg-green-100' : 'bg-red-100'}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No health check data available</p>
                  <p className="text-sm">
                    Health monitoring will appear after citations are processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(stats.metadata.generatedAt).toLocaleString()}
        {autoRefresh && ' • Auto-refreshing every 30 seconds'}
      </div>
    </div>
  );
}
