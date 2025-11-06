'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Lock, ArrowLeft } from 'lucide-react';
import { BusinessInfo } from '@/types/scan';

interface ReadOnlyUrlPillProps {
  url: string;
  business?: BusinessInfo;
  className?: string;
  showChangeLink?: boolean;
}

export default function ReadOnlyUrlPill({
  url,
  business,
  className = '',
  showChangeLink = true,
}: ReadOnlyUrlPillProps) {
  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main URL Display Pill */}
      <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-2 border-blue-400/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 rounded-full p-2">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                {business?.name ? (
                  <h3 className="text-xl font-bold text-white">{business.name}</h3>
                ) : (
                  <h3 className="text-xl font-bold text-white">{getDomain(url)}</h3>
                )}
                <div className="bg-green-500/20 border border-green-400/50 rounded-full px-3 py-1">
                  <span className="text-green-300 text-sm font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    From Free Scan
                  </span>
                </div>
              </div>
              <div className="text-blue-100 font-mono text-lg">{url}</div>
              {business?.category && (
                <div className="text-blue-200 text-sm mt-1">{business.category}</div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="text-right">
            <div className="bg-blue-500/30 rounded-lg px-4 py-2">
              <div className="text-blue-100 text-sm font-medium">Analysis Target</div>
              <div className="text-white text-xs">URL Locked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Info Summary (if available) */}
      {business && (business.phone || business.address) && (
        <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {business.phone && (
              <div className="flex items-center gap-2">
                <span className="text-blue-300">📞</span>
                <span className="text-blue-100">{business.phone}</span>
              </div>
            )}
            {business.address && (
              <div className="flex items-center gap-2">
                <span className="text-blue-300">📍</span>
                <span className="text-blue-100">{business.address}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change URL Link */}
      {showChangeLink && (
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="text-blue-300 hover:text-blue-100 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change URL on Free Scan
          </Link>
        </div>
      )}
    </div>
  );
}
