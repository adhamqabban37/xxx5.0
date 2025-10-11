'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { NumberInput } from '../_components/NumberInput';
import { ResultCard, BreakdownTable, ActionButton } from '../_components/ResultCard';
import { calcPricing, formatCurrency, type PricingInput } from '@/lib/calc';
import {
  createShareableUrl,
  getStateFromUrl,
  exportToCSV,
  copyToClipboard,
  copyJsonToClipboard,
} from '@/lib/share';

export default function PricingCalculatorPage() {
  const [inputs, setInputs] = useState<PricingInput>({
    plan: 'pro',
    seats: 3,
    aiRuns: 150,
    addOns: {
      whiteLabel: false,
      prioritySupport: true,
      auditsPerQuarter: 1,
    },
  });

  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  // Load state from URL on mount
  useEffect(() => {
    const urlState = getStateFromUrl();
    if (urlState && urlState.type === 'pricing') {
      setInputs(urlState.inputs);
    }
  }, []);

  // Memoized calculations to prevent flicker
  const results = useMemo(() => calcPricing(inputs), [inputs]);

  const handleInputChange = (field: keyof PricingInput, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddOnChange = (field: keyof PricingInput['addOns'], value: any) => {
    setInputs((prev) => ({
      ...prev,
      addOns: { ...prev.addOns, [field]: value },
    }));
  };

  const handleCopyLink = async () => {
    const url = createShareableUrl('/calculators/pricing', { type: 'pricing', inputs });
    const success = await copyToClipboard(url);
    setShowToast({
      message: success ? 'Link copied to clipboard!' : 'Failed to copy link',
      type: success ? 'success' : 'error',
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDownloadCSV = () => {
    const data = {
      Plan: inputs.plan,
      'Team Seats': inputs.seats,
      'AI Runs per Month': inputs.aiRuns,
      'White Label': inputs.addOns.whiteLabel ? 'Yes' : 'No',
      'Priority Support': inputs.addOns.prioritySupport ? 'Yes' : 'No',
      'Audits per Quarter': inputs.addOns.auditsPerQuarter,
      'Base Price': formatCurrency(results.base),
      'Add-ons Price': formatCurrency(results.addOns),
      'Total Monthly Price': formatCurrency(results.total),
      'Annual Price': formatCurrency(results.total * 12),
    };

    exportToCSV(data, 'pricing-calculation');
    setShowToast({ message: 'CSV downloaded successfully!', type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleCopyJSON = async () => {
    const data = { inputs, results };
    const success = await copyJsonToClipboard(data);
    setShowToast({
      message: success ? 'JSON copied to clipboard!' : 'Failed to copy JSON',
      type: success ? 'success' : 'error',
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  const planDescriptions = {
    basic: 'Perfect for small teams getting started with AI marketing',
    pro: 'Most popular plan for growing businesses',
    growth: 'Enterprise-grade features for scaling companies',
  };

  const planFeatures = {
    basic: ['Basic AI tools', 'Email support', 'Up to 50 AI runs/month'],
    pro: [
      'Advanced AI tools',
      'Priority support',
      'Custom integrations',
      'Up to 200 AI runs/month',
    ],
    growth: ['All features', 'Dedicated success manager', 'Custom training', 'Unlimited AI runs'],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Pricing Calculator</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Calculate your monthly subscription cost based on your team size, usage, and add-on
          requirements. Find the perfect plan for your business needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Plan Configuration</h2>

            {/* Plan Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block">Choose Your Plan</label>
              <div className="space-y-3">
                {(['basic', 'pro', 'growth'] as const).map((plan) => (
                  <div key={plan} className="relative">
                    <label
                      className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                        inputs.plan === plan
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="plan"
                          value={plan}
                          checked={inputs.plan === plan}
                          onChange={(e) =>
                            handleInputChange('plan', e.target.value as PricingInput['plan'])
                          }
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium capitalize">{plan}</div>
                            <div className="font-bold">
                              {formatCurrency({ basic: 49, pro: 149, growth: 399 }[plan])}/mo
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {planDescriptions[plan]}
                          </div>
                          <div className="mt-2">
                            {planFeatures[plan].map((feature, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                • {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <NumberInput
                id="seats"
                label="Team Seats"
                value={inputs.seats}
                onChange={(value) => handleInputChange('seats', value)}
                min={1}
                max={100}
                step={1}
                helpText="First seat included, additional seats $15/month each"
              />

              <NumberInput
                id="aiRuns"
                label="AI Runs per Month"
                value={inputs.aiRuns}
                onChange={(value) => handleInputChange('aiRuns', value)}
                min={0}
                max={10000}
                step={10}
                helpText="First 50 runs included, then $19 per 50-run block"
              />
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Add-ons</h3>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.addOns.whiteLabel}
                  onChange={(e) => handleAddOnChange('whiteLabel', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">White Label</div>
                  <div className="text-sm text-muted-foreground">Remove XenlixAI branding</div>
                </div>
                <div className="font-medium">+$99/mo</div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.addOns.prioritySupport}
                  onChange={(e) => handleAddOnChange('prioritySupport', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Priority Support</div>
                  <div className="text-sm text-muted-foreground">24/7 priority assistance</div>
                </div>
                <div className="font-medium">+$49/mo</div>
              </label>

              <div className="border-t pt-4">
                <NumberInput
                  id="auditsPerQuarter"
                  label="Quarterly Audits"
                  value={inputs.addOns.auditsPerQuarter}
                  onChange={(value) => handleAddOnChange('auditsPerQuarter', value)}
                  min={0}
                  max={4}
                  step={1}
                  helpText="Professional marketing audits ($129 each, prorated monthly)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <ResultCard title="Pricing Breakdown">
            <BreakdownTable
              items={results.breakdown.filter((item) => item.price > 0)}
              total={results.total}
              formatPrice={formatCurrency}
            />

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Annual pricing</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(results.total * 12 * 0.85)}/year
                </div>
                <div className="text-sm text-green-600">Save 15% with annual billing</div>
              </div>
            </div>
          </ResultCard>

          <ResultCard title="What's Included">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {inputs.seats} team member{inputs.seats > 1 ? 's' : ''}
              </div>
              <div className="flex items-center text-sm">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {inputs.aiRuns} AI runs per month
              </div>
              {inputs.addOns.whiteLabel && (
                <div className="flex items-center text-sm">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  White label branding
                </div>
              )}
              {inputs.addOns.prioritySupport && (
                <div className="flex items-center text-sm">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  24/7 priority support
                </div>
              )}
              {inputs.addOns.auditsPerQuarter > 0 && (
                <div className="flex items-center text-sm">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {inputs.addOns.auditsPerQuarter} marketing audit
                  {inputs.addOns.auditsPerQuarter > 1 ? 's' : ''} per quarter
                </div>
              )}
            </div>
          </ResultCard>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={handleCopyLink} variant="outline" size="sm">
                Copy Link
              </ActionButton>
              <ActionButton onClick={handleDownloadCSV} variant="outline" size="sm">
                Download CSV
              </ActionButton>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={handleCopyJSON} variant="outline" size="sm">
                Copy JSON
              </ActionButton>
              <Link href={`/plans?plan=${inputs.plan}`} className="w-full">
                <ActionButton onClick={() => {}} className="w-full" size="sm">
                  Go to Plans
                </ActionButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            showToast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {showToast.message}
        </div>
      )}

      {/* Ready to Start CTA */}
      <div className="mt-8 p-6 border border-primary/20 bg-primary/5 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Ready to Get Started?</h3>
        <p className="text-muted-foreground mb-4">
          Found your perfect plan? Start your AI marketing transformation today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/plans"
            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            View All Plans
          </Link>
          <Link
            href="/tools/json-ld"
            className="inline-flex items-center justify-center px-6 py-2 border border-primary text-sm font-medium rounded-md text-primary hover:bg-primary/10 transition-colors"
          >
            Try Our Tools
          </Link>
        </div>
      </div>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Pricing Calculator',
            description: 'Calculate subscription pricing for XenlixAI plans',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: [
              {
                '@type': 'Offer',
                name: 'Basic Plan',
                price: '49',
                priceCurrency: 'USD',
              },
              {
                '@type': 'Offer',
                name: 'Pro Plan',
                price: '149',
                priceCurrency: 'USD',
              },
              {
                '@type': 'Offer',
                name: 'Growth Plan',
                price: '399',
                priceCurrency: 'USD',
              },
            ],
          }),
        }}
      />
    </div>
  );
}
