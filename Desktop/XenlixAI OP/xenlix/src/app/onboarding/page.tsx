'use client';

import { useAppStore } from '@/lib/store';

export default function OnboardingPage() {
  const profile = useAppStore((state) => state.profile);

  const handleSaveProfile = () => {
    useAppStore.getState().setProfile({ businessName: 'TestBiz' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white mb-4">Onboarding Wizard</h1>
        <div className="text-gray-300">Collect business data and requirements</div>

        <div className="bg-slate-800 p-4 rounded-lg max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-2">Current Profile:</h3>
          <pre className="text-green-400 text-sm">
            {profile ? JSON.stringify(profile, null, 2) : 'No profile data'}
          </pre>
        </div>

        <button
          onClick={handleSaveProfile}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
