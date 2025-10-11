'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, CheckCircle, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  error?: string;
}

interface DiagnosticsData {
  buildSha?: string;
  nodeVersion: string;
  environment: string;
  uptime: number;
  keyPresence: {
    googleMaps: boolean;
    psiApi: boolean;
    gscAuth: boolean;
    redis: boolean;
  };
  recentEvents: Array<{
    timestamp: string;
    type: 'extraction' | 'validation' | 'maps' | 'cache';
    message: string;
    status: 'success' | 'error' | 'info';
  }>;
}

interface DiagnosticsPanelProps {
  className?: string;
}

export default function DiagnosticsPanel({ className = '' }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsData | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);

  // Only show in development
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) return null;

  useEffect(() => {
    if (isOpen && !diagnosticsData) {
      loadDiagnosticsData();
    }
  }, [isOpen]);

  const loadDiagnosticsData = async () => {
    try {
      const response = await fetch('/api/health');
      const health = await response.json();

      setDiagnosticsData({
        buildSha: 'dev-build',
        nodeVersion: health.services?.node || 'unknown',
        environment: health.env || 'development',
        uptime: health.uptime || 0,
        keyPresence: {
          googleMaps:
            health.environment?.variables?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.present || false,
          psiApi: health.environment?.variables?.PSI_API_KEY?.present || false,
          gscAuth: health.environment?.variables?.GOOGLE_CLIENT_ID?.present || false,
          redis: health.environment?.variables?.REDIS_URL?.present || false,
        },
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            type: 'validation',
            message: 'System diagnostics loaded',
            status: 'success',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    }
  };

  const runFullSelfTest = async () => {
    setIsRunningTest(true);
    setHealthChecks([]);

    const checks: HealthCheck[] = [
      { name: 'Health API', status: 'pending', message: 'Checking system health...' },
      { name: 'Environment Variables', status: 'pending', message: 'Validating configuration...' },
      { name: 'Google Maps API', status: 'pending', message: 'Testing Maps integration...' },
      { name: 'PSI Integration', status: 'pending', message: 'Checking PageSpeed Insights...' },
      { name: 'Extract API', status: 'pending', message: 'Testing URL extraction...' },
      { name: 'Validation Pipeline', status: 'pending', message: 'Testing AEO validation...' },
    ];

    setHealthChecks([...checks]);

    try {
      // 1. Health API Check
      const startTime = Date.now();
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      const healthDuration = Date.now() - startTime;

      setHealthChecks((prev) =>
        prev.map((check) =>
          check.name === 'Health API'
            ? {
                ...check,
                status: healthResponse.ok ? 'success' : 'error',
                message: healthResponse.ok
                  ? `System healthy (${healthDuration}ms)`
                  : 'System issues detected',
                duration: healthDuration,
                error: !healthResponse.ok ? healthData.error : undefined,
              }
            : check
        )
      );

      // 2. Environment Variables Check
      const envMissing = healthData.environment?.keysMissing || [];
      setHealthChecks((prev) =>
        prev.map((check) =>
          check.name === 'Environment Variables'
            ? {
                ...check,
                status: envMissing.length === 0 ? 'success' : 'warning',
                message:
                  envMissing.length === 0
                    ? `All required keys present (${healthData.environment?.keysPresent || 0})`
                    : `Missing: ${envMissing.join(', ')}`,
              }
            : check
        )
      );

      // 3. Google Maps API Check
      try {
        const mapsStartTime = Date.now();
        const mapsResponse = await fetch('/api/maps-token');
        const mapsData = await mapsResponse.json();
        const mapsDuration = Date.now() - mapsStartTime;

        setHealthChecks((prev) =>
          prev.map((check) =>
            check.name === 'Google Maps API'
              ? {
                  ...check,
                  status: mapsData.success ? 'success' : 'warning',
                  message: mapsData.success
                    ? `Google Maps available (${mapsDuration}ms)`
                    : `Fallback to OpenStreetMap: ${mapsData.error}`,
                  duration: mapsDuration,
                }
              : check
          )
        );
      } catch (error) {
        setHealthChecks((prev) =>
          prev.map((check) =>
            check.name === 'Google Maps API'
              ? { ...check, status: 'error', message: 'Maps API test failed', error: String(error) }
              : check
          )
        );
      }

      // 4. PSI Integration Check
      const psiConfigured = healthData.environment?.variables?.PSI_API_KEY?.present;
      setHealthChecks((prev) =>
        prev.map((check) =>
          check.name === 'PSI Integration'
            ? {
                ...check,
                status: psiConfigured ? 'success' : 'warning',
                message: psiConfigured
                  ? 'PSI API key configured'
                  : 'PSI disabled - add PSI_API_KEY',
              }
            : check
        )
      );

      // 5. Extract API Check
      try {
        const extractStartTime = Date.now();
        const extractResponse = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteUrl: 'https://google.com' }),
        });
        const extractDuration = Date.now() - extractStartTime;

        setHealthChecks((prev) =>
          prev.map((check) =>
            check.name === 'Extract API'
              ? {
                  ...check,
                  status: extractResponse.ok ? 'success' : 'error',
                  message: extractResponse.ok
                    ? `Extract API working (${extractDuration}ms)`
                    : 'Extract API failed',
                  duration: extractDuration,
                }
              : check
          )
        );
      } catch (error) {
        setHealthChecks((prev) =>
          prev.map((check) =>
            check.name === 'Extract API'
              ? { ...check, status: 'error', message: 'Extract test failed', error: String(error) }
              : check
          )
        );
      }

      // 6. Validation Pipeline Check
      try {
        const validationStartTime = Date.now();
        const validationResponse = await fetch('/api/unified-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteUrl: 'https://google.com',
            businessData: { name: 'Test Business', industry: 'Technology' },
          }),
        });
        const validationDuration = Date.now() - validationStartTime;

        setHealthChecks((prev) =>
          prev.map((check) =>
            check.name === 'Validation Pipeline'
              ? {
                  ...check,
                  status: validationResponse.ok ? 'success' : 'error',
                  message: validationResponse.ok
                    ? `Validation pipeline working (${validationDuration}ms)`
                    : 'Validation failed',
                  duration: validationDuration,
                }
              : check
          )
        );
      } catch (error) {
        setHealthChecks((prev) =>
          prev.map((check) =>
            check.name === 'Validation Pipeline'
              ? {
                  ...check,
                  status: 'error',
                  message: 'Validation test failed',
                  error: String(error),
                }
              : check
          )
        );
      }
    } catch (error) {
      console.error('Self-test error:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400 animate-spin" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[80vh] overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">System Diagnostics</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              {diagnosticsData && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>
                    Node: {diagnosticsData.nodeVersion} • Env: {diagnosticsData.environment}
                  </div>
                  <div>Uptime: {formatUptime(diagnosticsData.uptime)}</div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Key Presence */}
              {diagnosticsData && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(diagnosticsData.keyPresence).map(([key, present]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${present ? 'bg-green-500' : 'bg-gray-300'}`}
                        ></div>
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Self-Test Button */}
              <div>
                <button
                  onClick={runFullSelfTest}
                  disabled={isRunningTest}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunningTest ? 'Running Self-Test...' : 'Run Full Self-Test'}</span>
                </button>
              </div>

              {/* Test Results */}
              {healthChecks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Test Results</h4>
                  <div className="space-y-2">
                    {healthChecks.map((check, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-2 bg-gray-50 rounded"
                      >
                        {getStatusIcon(check.status)}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900">{check.name}</div>
                          <div className="text-xs text-gray-600 truncate">{check.message}</div>
                          {check.error && (
                            <div className="text-xs text-red-600 mt-1">{check.error}</div>
                          )}
                        </div>
                        {check.duration && (
                          <div className="text-xs text-gray-500">{check.duration}ms</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Events */}
              {diagnosticsData?.recentEvents && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Events</h4>
                  <div className="space-y-1 text-xs">
                    {diagnosticsData.recentEvents.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1 ${
                            event.status === 'success'
                              ? 'bg-green-400'
                              : event.status === 'error'
                                ? 'bg-red-400'
                                : 'bg-blue-400'
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="text-gray-900">{event.message}</div>
                          <div className="text-gray-500">
                            {event.type} • {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        <Settings className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
