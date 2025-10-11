'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface GuidanceResponse {
  guidance: {
    summary: string;
    budgetAnalysis: {
      daily: number;
      recommended: {
        search: number;
        shopping: number;
        display: number;
        video: number;
      };
    };
    strategies: Array<{
      type: string;
      description: string;
      expectedOutcome: string;
    }>;
    recommendations: Array<{
      category: string;
      items: string[];
    }>;
    keyRecommendations: string[];
    optimizationTips: string[];
  };
}

export default function AiGuidancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    targetAudience: '',
    goals: [] as string[],
    monthlyBudget: 1000,
    currentChallenges: '',
  });

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    router.push('/signin');
    return null;
  }

  const handleGoalToggle = (goal: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: formData }),
      });

      if (response.ok) {
        const result = await response.json();
        setGuidance(result);
      } else {
        alert('Failed to generate guidance. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goalOptions = [
    { id: 'increase_sales', label: 'Increase Sales' },
    { id: 'brand_awareness', label: 'Brand Awareness' },
    { id: 'lead_generation', label: 'Lead Generation' },
    { id: 'website_traffic', label: 'Website Traffic' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI AEO Guidance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get personalized recommendations for your advertising campaigns
          </p>
        </div>

        {!guidance ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, businessName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Type
                </label>
                <input
                  type="text"
                  value={formData.businessType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, businessType: e.target.value }))
                  }
                  placeholder="e.g., E-commerce, SaaS, Local Service"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Audience
                </label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))
                  }
                  placeholder="Describe your ideal customers..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marketing Goals (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {goalOptions.map((goal) => (
                    <label key={goal.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.goals.includes(goal.id)}
                        onChange={() => handleGoalToggle(goal.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{goal.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Budget (USD)
                </label>
                <input
                  type="number"
                  value={formData.monthlyBudget}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, monthlyBudget: parseInt(e.target.value) }))
                  }
                  min="100"
                  max="100000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Challenges
                </label>
                <textarea
                  value={formData.currentChallenges}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentChallenges: e.target.value }))
                  }
                  placeholder="What advertising challenges are you facing?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || formData.goals.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Generating Guidance...' : 'Get AI Guidance'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {guidance.guidance.summary}
              </h2>
              <button
                onClick={() => setGuidance(null)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Generate New Guidance
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Budget Analysis
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Daily Budget:{' '}
                    <span className="font-medium">${guidance.guidance.budgetAnalysis.daily}</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Search:</span>
                      <span className="font-medium ml-1">
                        ${guidance.guidance.budgetAnalysis.recommended.search}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Shopping:</span>
                      <span className="font-medium ml-1">
                        ${guidance.guidance.budgetAnalysis.recommended.shopping}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Display:</span>
                      <span className="font-medium ml-1">
                        ${guidance.guidance.budgetAnalysis.recommended.display}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Video:</span>
                      <span className="font-medium ml-1">
                        ${guidance.guidance.budgetAnalysis.recommended.video}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Key Recommendations
                </h3>
                <div className="space-y-2">
                  {guidance.guidance.keyRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Optimization Tips
                </h3>
                <div className="space-y-2">
                  {guidance.guidance.optimizationTips.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-2"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => router.push('/ads')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Create Ad Campaigns
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
