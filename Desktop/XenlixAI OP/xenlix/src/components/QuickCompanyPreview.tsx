/**
 * Quick Company Preview Widget
 * A compact version for dashboard widgets
 */

'use client';

import React, { useState } from 'react';
import { Building2, Globe, Loader2, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';

interface QuickCompanyPreviewProps {
  className?: string;
}

export function QuickCompanyPreview({ className = '' }: QuickCompanyPreviewProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickPreview = () => {
    if (urlInput.trim()) {
      // Redirect to enhanced dashboard with URL
      window.location.href = `/dashboard/enhanced?url=${encodeURIComponent(urlInput.trim())}`;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Company Preview</h3>
          </div>
          <Link
            href="/dashboard/enhanced"
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Full Preview
          </Link>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Extract business information from any company website instantly
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter company website URL..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleQuickPreview()}
            />
          </div>

          <button
            onClick={handleQuickPreview}
            disabled={!urlInput.trim() || isLoading}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Preview Company
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">What we extract:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>• Business name</div>
              <div>• Industry type</div>
              <div>• Contact info</div>
              <div>• Location data</div>
              <div>• Services offered</div>
              <div>• Business hours</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickCompanyPreview;
