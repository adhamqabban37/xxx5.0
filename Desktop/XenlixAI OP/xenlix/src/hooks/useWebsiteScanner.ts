'use client';

import { useState, useCallback } from 'react';
import { ScanResult } from '@/lib/website-scanner';

interface ScanJob {
  scanId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'queued';
  url: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: ScanResult;
  error?: string;
  progress: number;
}

interface UseScannerReturn {
  scanWebsite: (url: string, priority?: 'high' | 'normal' | 'low') => Promise<string>;
  getScanStatus: (scanId: string) => Promise<ScanJob>;
  scanHistory: ScanJob[];
  isScanning: boolean;
  error: string | null;
  clearError: () => void;
}

export function useWebsiteScanner(): UseScannerReturn {
  const [scanHistory, setScanHistory] = useState<ScanJob[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const scanWebsite = useCallback(async (
    url: string, 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> => {
    try {
      setIsScanning(true);
      setError(null);

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          priority,
          scanType: 'full'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      const scanId = data.scanId;
      
      // Add to scan history immediately
      const newScan: ScanJob = {
        scanId,
        status: 'queued',
        url,
        createdAt: new Date().toISOString(),
        progress: 10
      };

      setScanHistory(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans

      return scanId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const getScanStatus = useCallback(async (scanId: string): Promise<ScanJob> => {
    try {
      const response = await fetch(`/api/scan/${scanId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get scan status');
      }

      const scanJob: ScanJob = {
        scanId: data.scanId,
        status: data.status,
        url: data.url,
        createdAt: data.createdAt,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        result: data.result,
        error: data.error,
        progress: data.progress
      };

      // Update scan history with latest status
      setScanHistory(prev => 
        prev.map(scan => 
          scan.scanId === scanId ? scanJob : scan
        )
      );

      return scanJob;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get scan status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    scanWebsite,
    getScanStatus,
    scanHistory,
    isScanning,
    error,
    clearError
  };
}

// Utility hook for polling scan status
export function useScanPolling(scanId: string | null, intervalMs = 3000) {
  const [scanJob, setScanJob] = useState<ScanJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { getScanStatus } = useWebsiteScanner();

  const startPolling = useCallback(async () => {
    if (!scanId || isPolling) return;

    setIsPolling(true);
    
    const poll = async () => {
      try {
        const job = await getScanStatus(scanId);
        setScanJob(job);

        // Stop polling if scan is complete or failed
        if (job.status === 'completed' || job.status === 'failed') {
          setIsPolling(false);
          return;
        }

        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('Polling error:', error);
        setIsPolling(false);
      }
    };

    poll();
  }, [scanId, intervalMs, getScanStatus, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    scanJob,
    isPolling,
    startPolling,
    stopPolling
  };
}