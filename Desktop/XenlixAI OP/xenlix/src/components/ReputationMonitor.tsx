'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  ExternalLink,
  Phone,
  MapPin,
  Globe,
  Clock,
  Users,
} from 'lucide-react';

interface ReviewData {
  id: string;
  platform: 'google' | 'yelp' | 'facebook';
  author: string;
  rating: number;
  text: string;
  date: string;
  isNew: boolean;
}

interface BusinessProfileData {
  platform: 'google' | 'yelp' | 'facebook';
  name: string;
  address: string;
  phone: string;
  website: string;
  hours: any;
  rating: number;
  reviewCount: number;
  lastUpdated: string;
}

interface EntityConsistency {
  status: 'OK' | 'Minor Issues' | 'Major Mismatch';
  details: string;
  issues: {
    field: string;
    platforms: string[];
    values: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
}

interface ReputationAlert {
  id: string;
  type: 'negative_review' | 'rating_drop' | 'info_mismatch' | 'ai_description_issue';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  platform?: string;
  actionRequired: string;
  timestamp: string;
}

interface ReputationMonitorResult {
  newReviews: ReviewData[];
  ratingChange: string;
  entityConsistency: EntityConsistency;
  aiSummaries: {
    ChatGPT: string;
    Perplexity: string;
    'Bing Copilot': string;
  };
  alerts: ReputationAlert[];
  businessProfiles: BusinessProfileData[];
  overallHealth: number;
  lastChecked: string;
}

interface ReputationMonitorProps {
  url?: string;
  businessName?: string;
}

const ReputationMonitor: React.FC<ReputationMonitorProps> = ({
  url: initialUrl = '',
  businessName: initialBusinessName = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [isLoading, setIsLoading] = useState(false);
  const [reputationData, setReputationData] = useState<ReputationMonitorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const platformIcons: { [key: string]: string } = {
    google: '🏢',
    yelp: '🍽️',
    facebook: '📘',
  };

  const platformColors = {
    google: 'bg-blue-50 border-blue-200',
    yelp: 'bg-red-50 border-red-200',
    facebook: 'bg-blue-50 border-blue-300',
  };

  const severityColors = {
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-orange-50 border-orange-200 text-orange-800',
    high: 'bg-red-50 border-red-200 text-red-800',
  };

  const consistencyStatusColors = {
    OK: 'text-green-600 bg-green-50',
    'Minor Issues': 'text-yellow-600 bg-yellow-50',
    'Major Mismatch': 'text-red-600 bg-red-50',
  };

  const monitorReputation = async () => {
    if (!url || !businessName) {
      setError('Please provide both URL and business name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reputation-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, businessName }),
      });

      if (!response.ok) {
        throw new Error('Failed to monitor reputation');
      }

      const result = await response.json();
      setReputationData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatRating = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '☆' : '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'low':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Reputation & Entity Monitor
          </CardTitle>
          <CardDescription>
            Monitor your business reputation across platforms and AI engines for consistency and
            reputation management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://yourbusiness.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="Your Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={monitorReputation}
            className="mt-4 w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Monitoring...' : 'Monitor Reputation'}
          </Button>

          {error && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {reputationData && (
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reputation Overview</span>
                <Badge className={getHealthColor(reputationData.overallHealth)}>
                  {reputationData.overallHealth}% - {getHealthLabel(reputationData.overallHealth)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${reputationData.ratingChange.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {reputationData.ratingChange}
                  </div>
                  <div className="text-sm text-gray-500">Rating Change</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reputationData.newReviews.length}
                  </div>
                  <div className="text-sm text-gray-500">New Reviews</div>
                </div>
                <div className="text-center">
                  <Badge
                    className={consistencyStatusColors[reputationData.entityConsistency.status]}
                  >
                    {reputationData.entityConsistency.status}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">Entity Consistency</div>
                </div>
              </div>
              <Progress value={reputationData.overallHealth} className="mt-4" />
              <div className="text-xs text-gray-500 mt-2">
                Last checked: {formatDate(reputationData.lastChecked)}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {reputationData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Reputation Alerts ({reputationData.alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reputationData.alerts.map((alert) => (
                    <Alert key={alert.id} className={severityColors[alert.severity]}>
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm mt-1">{alert.description}</div>
                          <div className="text-xs mt-2 font-medium">
                            Action Required: {alert.actionRequired}
                          </div>
                          {alert.platform && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {platformIcons[alert.platform]} {alert.platform}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="reviews" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
              <TabsTrigger value="platforms">Platform Profiles</TabsTrigger>
              <TabsTrigger value="consistency">Consistency Check</TabsTrigger>
              <TabsTrigger value="ai-summaries">AI Summaries</TabsTrigger>
            </TabsList>

            {/* Recent Reviews */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Reviews ({reputationData.newReviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reputationData.newReviews.length > 0 ? (
                    <div className="space-y-4">
                      {reputationData.newReviews.map((review) => (
                        <div
                          key={review.id}
                          className={`p-4 border rounded-lg ${platformColors[review.platform]}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span>{platformIcons[review.platform]}</span>
                              <span className="font-semibold">{review.author}</span>
                              <Badge variant="outline" className="text-xs">
                                {review.platform}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{formatRating(review.rating)}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(review.date)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No new reviews found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platform Profiles */}
            <TabsContent value="platforms">
              <div className="grid gap-4">
                {reputationData.businessProfiles.map((profile) => (
                  <Card key={profile.platform} className={platformColors[profile.platform]}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span>{platformIcons[profile.platform]}</span>
                        {profile.name}
                        <Badge variant="outline" className="ml-auto">
                          {profile.platform}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>
                              {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{profile.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{profile.phone}</span>
                          </div>
                          {profile.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-500" />
                              <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {profile.website}
                              </a>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold">Business Hours</span>
                          </div>
                          <div className="text-xs space-y-1">
                            {Object.entries(profile.hours).map(([day, hours]) => (
                              <div key={day} className="flex justify-between">
                                <span className="capitalize">{day}:</span>
                                <span>{hours as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Consistency Check */}
            <TabsContent value="consistency">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Entity Consistency Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert
                      className={consistencyStatusColors[reputationData.entityConsistency.status]}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Status: {reputationData.entityConsistency.status}</strong>
                        <br />
                        {reputationData.entityConsistency.details}
                      </AlertDescription>
                    </Alert>

                    {reputationData.entityConsistency.issues.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Identified Issues:</h4>
                        {reputationData.entityConsistency.issues.map((issue, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded ${severityColors[issue.severity]}`}
                          >
                            <div className="font-semibold">{issue.field} Mismatch</div>
                            <div className="text-sm mt-1">
                              <div className="font-medium">
                                Platforms: {issue.platforms.join(', ')}
                              </div>
                              <div className="mt-1">
                                <strong>Values found:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {issue.values.map((value, i) => (
                                    <li key={i} className="text-xs">
                                      {issue.platforms[i]}: {value}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <Badge className="mt-2 text-xs" variant="outline">
                              {issue.severity} severity
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Summaries */}
            <TabsContent value="ai-summaries">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    AI Engine Analysis
                  </CardTitle>
                  <CardDescription>How different AI engines describe your business</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(reputationData.aiSummaries).map(([engine, summary]) => (
                      <div key={engine} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">{engine}</div>
                          <Badge variant="outline" className="text-xs">
                            AI Analysis
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{summary}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ReputationMonitor;
