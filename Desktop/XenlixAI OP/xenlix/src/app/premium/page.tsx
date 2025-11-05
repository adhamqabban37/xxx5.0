'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DirectPremiumAccess() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to premium dashboard
    router.push('/dashboard/premium-aeo');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading Premium Dashboard...</h2>
        <p className="text-gray-500 mt-2">Redirecting you to the premium AEO dashboard</p>
      </div>
    </div>
  );
}
