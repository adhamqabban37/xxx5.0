/**
 * AI Visibility Analytics Page (Server Component)
 * Renders the client analytics UI within a Suspense boundary to satisfy Next.js
 * requirements for useSearchParams.
 */

import React, { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function AivisibilityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI Visibility Analytics...</p>
          </div>
        </div>
      }
    >
      <ClientPage />
    </Suspense>
  );
}
