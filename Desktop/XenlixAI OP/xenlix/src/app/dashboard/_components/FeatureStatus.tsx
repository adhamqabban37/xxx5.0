'use client';

import { Check, Lock, Zap } from 'lucide-react';

interface FeatureStatusProps {
  scanTier: 'none' | 'fast' | 'deep';
  scannedUrl?: string;
}

export default function FeatureStatus({ scanTier, scannedUrl }: FeatureStatusProps) {
  const features = [
    {
      name: 'Basic AEO Analysis',
      fastScan: true,
      deepScan: true,
      description: 'Core website optimization insights',
    },
    {
      name: 'Premium AEO Intelligence',
      fastScan: false,
      deepScan: true,
      description: 'Advanced AEO recommendations and strategies',
    },
    {
      name: 'Enhanced AEO Intelligence',
      fastScan: false,
      deepScan: true,
      description: 'AI-powered optimization insights',
    },
    {
      name: 'CrewAI Business Intelligence',
      fastScan: false,
      deepScan: true,
      description: 'Multi-agent AI business analysis',
    },
    {
      name: 'Competitor Tracking',
      fastScan: false,
      deepScan: true,
      description: 'Monitor competitor strategies and performance',
    },
    {
      name: 'Location Intelligence',
      fastScan: true,
      deepScan: true,
      description: 'Geographic market analysis',
    },
    {
      name: 'Crawl4AI Analysis',
      fastScan: false,
      deepScan: true,
      description: 'Deep website crawling and content analysis',
    },
  ];

  const getFeatureStatus = (feature: (typeof features)[0]) => {
    if (scanTier === 'none') return 'locked';
    if (scanTier === 'fast' && feature.fastScan) return 'active';
    if (scanTier === 'fast' && !feature.fastScan) return 'premium';
    if (scanTier === 'deep') return 'active';
    return 'locked';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'premium':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'locked':
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'premium':
        return 'Premium';
      case 'locked':
      default:
        return 'Locked';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'premium':
        return 'text-yellow-600 bg-yellow-50';
      case 'locked':
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎯 Feature Status
          </h2>
          {scannedUrl && (
            <div className="text-blue-200 text-sm mt-1">
              Analysis for: <span className="font-mono text-blue-100">{scannedUrl}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              scanTier === 'none'
                ? 'bg-gray-100 text-gray-700'
                : scanTier === 'fast'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
            }`}
          >
            {scanTier === 'none' ? 'No Scan' : scanTier === 'fast' ? 'Fast Scan' : 'Deep Scan'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const status = getFeatureStatus(feature);
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                status === 'active'
                  ? 'bg-green-50 border-green-200'
                  : status === 'premium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(status)}`}
                  >
                    {getStatusText(status)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
              {status === 'premium' && (
                <div className="mt-2 text-xs text-yellow-600 font-medium">
                  🚀 Unlock with Premium Deep Scan
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scanTier === 'fast' && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">Ready for Deep Scan</h3>
              <p className="text-sm text-purple-700 mt-1">
                Your website has been analyzed with our fast scan. Click the Deep Scan button to
                unlock all premium features and get comprehensive insights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
