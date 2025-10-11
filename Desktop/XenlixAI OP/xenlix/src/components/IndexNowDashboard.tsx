'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface IndexNowStatus {
  configured: boolean;
  keyLocation: string | null;
  rateLimits: {
    minute: { used: number; limit: number; remaining: number };
    hour: { used: number; limit: number; remaining: number };
    day: { used: number; limit: number; remaining: number };
  };
}

interface SubmissionLog {
  id: string;
  timestamp: Date;
  urls: string[];
  urlCount: number;
  success: boolean;
  error?: string;
  reason?: 'created' | 'updated' | 'deleted' | 'manual';
  responseCode?: number;
  duration?: number;
}

interface SubmissionStats {
  totalSubmissions: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  totalUrls: number;
  lastSubmission?: Date;
}

export default function IndexNowDashboard() {
  const [status, setStatus] = useState<IndexNowStatus | null>(null);
  const [logs, setLogs] = useState<SubmissionLog[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState('submit');

  // Load IndexNow status and logs
  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/indexnow'),
        fetch('/api/indexnow/logs'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
        setStats(logsData.stats || null);
      }
    } catch (error) {
      console.error('Failed to load IndexNow data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit URL to IndexNow
  const handleSubmit = async () => {
    if (!submitUrl.trim()) return;

    try {
      setSubmitting(true);
      setSubmitResult(null);

      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [submitUrl.trim()],
          reason: 'manual',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: `Successfully submitted ${data.urlCount} URL(s) to search engines`,
        });
        setSubmitUrl('');
        // Reload data to show new submission
        await loadData();
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Submission failed',
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Network error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick submit common URLs
  const handleQuickSubmit = async (urls: string[]) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, reason: 'manual' }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: `Successfully submitted ${data.urlCount} URL(s) to search engines`,
        });
        await loadData();
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Submission failed',
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Network error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading IndexNow dashboard...
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
          <span className="text-yellow-200">
            IndexNow is not configured. Please check your environment variables and API key setup.
          </span>
        </div>
      </div>
    );
  }

  const successRate = stats?.totalSubmissions
    ? Math.round((stats.successfulSubmissions / stats.totalSubmissions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">IndexNow Status</h3>
          <p className="text-gray-400 text-sm">
            Instant search engine notifications for content changes
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
          <div className="text-sm font-medium text-gray-400 mb-2">Configuration</div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-white">Active</span>
          </div>
          {status.keyLocation && (
            <a
              href={status.keyLocation}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:underline inline-flex items-center mt-1"
            >
              View key file <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
          <div className="text-sm font-medium text-gray-400 mb-2">Success Rate</div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-lg font-bold text-white">{successRate}%</span>
          </div>
          <p className="text-xs text-gray-400">
            {stats?.successfulSubmissions || 0} of {stats?.totalSubmissions || 0} successful
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
          <div className="text-sm font-medium text-gray-400 mb-2">Total URLs</div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold text-white">{stats?.totalUrls || 0}</span>
          </div>
          <p className="text-xs text-gray-400">URLs submitted</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
          <div className="text-sm font-medium text-gray-400 mb-2">Last Submission</div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-white">
              {stats?.lastSubmission ? new Date(stats.lastSubmission).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
        <h4 className="text-lg font-semibold text-white mb-4">Rate Limits</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">
                Per Minute ({status.rateLimits.minute.limit} max)
              </span>
              <span className="text-white">
                {status.rateLimits.minute.used} / {status.rateLimits.minute.limit}
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(status.rateLimits.minute.used / status.rateLimits.minute.limit) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Per Hour ({status.rateLimits.hour.limit} max)</span>
              <span className="text-white">
                {status.rateLimits.hour.used} / {status.rateLimits.hour.limit}
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(status.rateLimits.hour.used / status.rateLimits.hour.limit) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Per Day ({status.rateLimits.day.limit} max)</span>
              <span className="text-white">
                {status.rateLimits.day.used} / {status.rateLimits.day.limit}
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(status.rateLimits.day.used / status.rateLimits.day.limit) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-700/50 rounded-lg border border-slate-600/50">
        <div className="border-b border-slate-600/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'submit'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Submit URLs
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Submission History
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'submit' && (
            <div className="space-y-6">
              {/* Manual Submission */}
              <div>
                <h5 className="text-lg font-semibold text-white mb-4">Manual URL Submission</h5>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label
                        htmlFor="submit-url"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        URL to submit
                      </label>
                      <input
                        id="submit-url"
                        type="url"
                        placeholder="https://www.xenlixai.com/page"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !submitUrl.trim()}
                        className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {submitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Submit
                      </button>
                    </div>
                  </div>

                  {submitResult && (
                    <div
                      className={`p-3 rounded-lg border ${
                        submitResult.success
                          ? 'bg-green-900/20 border-green-500/30 text-green-200'
                          : 'bg-red-900/20 border-red-500/30 text-red-200'
                      }`}
                    >
                      <div className="flex items-center">
                        {submitResult.success ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {submitResult.message}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Submit Options */}
              <div>
                <h5 className="text-lg font-semibold text-white mb-4">Quick Submit</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickSubmit(['https://www.xenlixai.com/'])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Homepage
                  </button>
                  <button
                    onClick={() => handleQuickSubmit(['https://www.xenlixai.com/contact'])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Contact
                  </button>
                  <button
                    onClick={() => handleQuickSubmit(['https://www.xenlixai.com/plans'])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => handleQuickSubmit(['https://www.xenlixai.com/case-studies'])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Case Studies
                  </button>
                  <button
                    onClick={() => handleQuickSubmit(['https://www.xenlixai.com/dallas'])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Dallas Page
                  </button>
                  <button
                    onClick={() => handleQuickSubmit(['https://www.xenlixai.com/sitemap.xml'])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Sitemap
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">Recent Submissions</h5>
              {logs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No submissions yet. Use the Submit tab to send your first URLs.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-slate-600/50 border border-slate-500/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {log.urlCount} URL{log.urlCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {log.reason && (
                          <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">
                            {log.reason}
                          </span>
                        )}
                        {log.duration && (
                          <span className="text-xs text-gray-400">{log.duration}ms</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
