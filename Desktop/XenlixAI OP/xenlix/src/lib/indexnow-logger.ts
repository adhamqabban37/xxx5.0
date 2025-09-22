// IndexNow submission logging and history tracking
// Stores submission history for dashboard display and monitoring

export interface IndexNowLog {
  id: string;
  timestamp: Date;
  urls: string[];
  urlCount: number;
  success: boolean;
  error?: string;
  reason?: 'created' | 'updated' | 'deleted' | 'manual';
  responseCode?: number;
  rateLimits?: {
    minute: { remaining: number };
    hour: { remaining: number };
    day: { remaining: number };
  };
  duration?: number; // Submission duration in ms
}

export interface IndexNowStats {
  totalSubmissions: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  totalUrls: number;
  lastSubmission?: Date;
  rateLimitStatus: {
    minute: { used: number; limit: number; remaining: number };
    hour: { used: number; limit: number; remaining: number };
    day: { used: number; limit: number; remaining: number };
  };
}

// In-memory store for IndexNow logs (in production, use database)
let submissionLogs: IndexNowLog[] = [];
let currentStats: IndexNowStats = {
  totalSubmissions: 0,
  successfulSubmissions: 0,
  failedSubmissions: 0,
  totalUrls: 0,
  rateLimitStatus: {
    minute: { used: 0, limit: 10, remaining: 10 },
    hour: { used: 0, limit: 100, remaining: 100 },
    day: { used: 0, limit: 1000, remaining: 1000 },
  },
};

// Generate unique ID for log entries
function generateLogId(): string {
  return `indexnow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add a new submission log entry
export function addSubmissionLog(
  urls: string[],
  success: boolean,
  options: {
    error?: string;
    reason?: 'created' | 'updated' | 'deleted' | 'manual';
    responseCode?: number;
    rateLimits?: IndexNowLog['rateLimits'];
    duration?: number;
  } = {}
): IndexNowLog {
  const log: IndexNowLog = {
    id: generateLogId(),
    timestamp: new Date(),
    urls: [...urls],
    urlCount: urls.length,
    success,
    ...options,
  };

  // Add to logs array
  submissionLogs.unshift(log); // Add to beginning for newest first

  // Keep only last 100 logs to prevent memory issues
  if (submissionLogs.length > 100) {
    submissionLogs = submissionLogs.slice(0, 100);
  }

  // Update stats
  updateStats(log);

  // Log to console for monitoring
  const logLevel = success ? 'info' : 'error';
  console[logLevel]('IndexNow submission logged:', {
    id: log.id,
    urlCount: log.urlCount,
    success: log.success,
    reason: log.reason,
    error: log.error,
    timestamp: log.timestamp.toISOString(),
  });

  return log;
}

// Update statistics based on new log entry
function updateStats(log: IndexNowLog): void {
  currentStats.totalSubmissions++;
  currentStats.totalUrls += log.urlCount;
  currentStats.lastSubmission = log.timestamp;

  if (log.success) {
    currentStats.successfulSubmissions++;
  } else {
    currentStats.failedSubmissions++;
  }

  // Update rate limit status if provided
  if (log.rateLimits) {
    currentStats.rateLimitStatus = {
      minute: {
        used: 10 - log.rateLimits.minute.remaining,
        limit: 10,
        remaining: log.rateLimits.minute.remaining,
      },
      hour: {
        used: 100 - log.rateLimits.hour.remaining,
        limit: 100,
        remaining: log.rateLimits.hour.remaining,
      },
      day: {
        used: 1000 - log.rateLimits.day.remaining,
        limit: 1000,
        remaining: log.rateLimits.day.remaining,
      },
    };
  }
}

// Get recent submission logs
export function getRecentLogs(limit: number = 20): IndexNowLog[] {
  return submissionLogs.slice(0, limit);
}

// Get submission statistics
export function getSubmissionStats(): IndexNowStats {
  return { ...currentStats };
}

// Get logs filtered by criteria
export function getFilteredLogs(filters: {
  success?: boolean;
  reason?: 'created' | 'updated' | 'deleted' | 'manual';
  since?: Date;
  limit?: number;
}): IndexNowLog[] {
  let filtered = submissionLogs;

  if (filters.success !== undefined) {
    filtered = filtered.filter(log => log.success === filters.success);
  }

  if (filters.reason) {
    filtered = filtered.filter(log => log.reason === filters.reason);
  }

  if (filters.since) {
    filtered = filtered.filter(log => log.timestamp > filters.since);
  }

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

// Get error logs for troubleshooting
export function getErrorLogs(limit: number = 10): IndexNowLog[] {
  return submissionLogs
    .filter(log => !log.success)
    .slice(0, limit);
}

// Check if rate limits are being approached
export function checkRateLimitWarnings(): {
  hasWarnings: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { rateLimitStatus } = currentStats;

  // Warn at 80% capacity
  if (rateLimitStatus.minute.used >= rateLimitStatus.minute.limit * 0.8) {
    warnings.push(`Minute rate limit at ${Math.round((rateLimitStatus.minute.used / rateLimitStatus.minute.limit) * 100)}%`);
  }

  if (rateLimitStatus.hour.used >= rateLimitStatus.hour.limit * 0.8) {
    warnings.push(`Hour rate limit at ${Math.round((rateLimitStatus.hour.used / rateLimitStatus.hour.limit) * 100)}%`);
  }

  if (rateLimitStatus.day.used >= rateLimitStatus.day.limit * 0.8) {
    warnings.push(`Day rate limit at ${Math.round((rateLimitStatus.day.used / rateLimitStatus.day.limit) * 100)}%`);
  }

  return {
    hasWarnings: warnings.length > 0,
    warnings,
  };
}

// Format log entry for display
export function formatLogForDisplay(log: IndexNowLog): string {
  const timestamp = log.timestamp.toLocaleString();
  const status = log.success ? '✅' : '❌';
  const reason = log.reason ? ` (${log.reason})` : '';
  const error = log.error ? ` - ${log.error}` : '';
  
  return `${status} ${timestamp}: ${log.urlCount} URLs${reason}${error}`;
}

// Export logs as JSON for backup/analysis
export function exportLogs(): string {
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    stats: currentStats,
    logs: submissionLogs,
  }, null, 2);
}

// Clear old logs (keep last N days)
export function clearOldLogs(daysToKeep: number = 7): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const initialCount = submissionLogs.length;
  submissionLogs = submissionLogs.filter(log => log.timestamp > cutoffDate);
  
  const removedCount = initialCount - submissionLogs.length;
  
  if (removedCount > 0) {
    console.info(`IndexNow: Cleared ${removedCount} old log entries (older than ${daysToKeep} days)`);
  }
  
  return removedCount;
}

// Reset all logs and stats (for testing/development)
export function resetLogs(): void {
  submissionLogs = [];
  currentStats = {
    totalSubmissions: 0,
    successfulSubmissions: 0,
    failedSubmissions: 0,
    totalUrls: 0,
    rateLimitStatus: {
      minute: { used: 0, limit: 10, remaining: 10 },
      hour: { used: 0, limit: 100, remaining: 100 },
      day: { used: 0, limit: 1000, remaining: 1000 },
    },
  };
  console.info('IndexNow: Logs and stats reset');
}