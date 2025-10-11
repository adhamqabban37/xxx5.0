'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SandboxSuccessBanner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan');
  const [isVisible, setIsVisible] = useState(
    sessionId === 'SANDBOX' || searchParams.get('sandbox') === 'true'
  );

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    // Clean up URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('session_id');
    url.searchParams.delete('sandbox');
    url.searchParams.delete('plan');
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <div className="bg-green-600/90 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <div className="bg-green-700/50 rounded-full p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm sm:text-base">Sandbox Subscription Activated!</p>
                <span className="bg-green-700/50 text-green-100 text-xs font-medium px-2 py-0.5 rounded-full">
                  SANDBOX
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-90">
                {plan
                  ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated with 14-day trial access to all features.`
                  : 'You now have 14-day trial access to all features in sandbox mode.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors self-end sm:self-center flex-shrink-0"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
