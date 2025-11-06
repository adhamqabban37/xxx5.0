import React, { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing your premium welcome...</p>
          </div>
        </div>
      }
    >
      <ClientPage />
    </Suspense>
  );
}
