'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { NumberInput } from '../_components/NumberInput';
import { ResultCard, MetricRow, ActionButton } from '../_components/ResultCard';
import {
  calcRoi,
  roiPresets,
  formatCurrency,
  formatPercent,
  formatNumber,
  type RoiInput,
} from '@/lib/calc';
import {
  createShareableUrl,
  getStateFromUrl,
  exportToCSV,
  copyToClipboard,
  copyJsonToClipboard,
} from '@/lib/share';

export default function ROICalculatorPage() {
  const [inputs, setInputs] = useState<RoiInput>({
    monthlyAdSpend: 5000,
    cpc: 1.5,
    cr: 0.025,
    aov: 85,
    closeRate: 1.0,
    aeoLift: 0.25,
  });

  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  // Load state from URL on mount
  useEffect(() => {
    const urlState = getStateFromUrl();
    if (urlState && urlState.type === 'roi') {
      setInputs(urlState.inputs);
    }
  }, []);

  // Memoized calculations to prevent flicker
  const results = useMemo(() => calcRoi(inputs), [inputs]);

  const handleInputChange = (field: keyof RoiInput, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handlePresetChange = (preset: keyof typeof roiPresets) => {
    setInputs(roiPresets[preset]);
  };

  const handleCopyLink = async () => {
    const url = createShareableUrl('/calculators/roi', { type: 'roi', inputs });
    const success = await copyToClipboard(url);
    setShowToast({
      message: success ? 'Link copied to clipboard!' : 'Failed to copy link',
      type: success ? 'success' : 'error',
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDownloadCSV = () => {
    const data = {
      'Monthly Ad Spend': formatCurrency(inputs.monthlyAdSpend),
      'Cost Per Click': formatCurrency(inputs.cpc),
      'Conversion Rate': formatPercent(inputs.cr),
      'Average Order Value': formatCurrency(inputs.aov),
      'Close Rate': formatPercent(inputs.closeRate),
      'AEO Lift': formatPercent(inputs.aeoLift),
      'Current Clicks': formatNumber(results.clicks),
      'Current Conversions': formatNumber(results.conversions),
      'Current Revenue': formatCurrency(results.revenue),
      'Current CAC': formatCurrency(results.cac),
      'Current ROI': formatPercent(results.roi),
      'With AEO Clicks': formatNumber(results.withAeo.clicks),
      'With AEO Conversions': formatNumber(results.withAeo.conversions),
      'With AEO Revenue': formatCurrency(results.withAeo.revenue),
      'With AEO CAC': formatCurrency(results.withAeo.cac),
      'With AEO ROI': formatPercent(results.withAeo.roi),
    };

    exportToCSV(data, 'roi-calculation');
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ROI & CAC Calculator</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Calculate your advertising return on investment and customer acquisition costs. See how AI
          Engine Optimization (AEO) can boost your results.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Business Metrics</h2>

            {/* Presets */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Quick Presets</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handlePresetChange('ecommerce')}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  Ecommerce
                </button>
                <button
                  onClick={() => handlePresetChange('local-service')}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  Local Service
                </button>
                <button
                  onClick={() => handlePresetChange('b2b-leadgen')}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  B2B Lead-Gen
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <NumberInput
                id="monthlyAdSpend"
                label="Monthly Ad Spend"
                value={inputs.monthlyAdSpend}
                onChange={(value) => handleInputChange('monthlyAdSpend', value)}
                min={0}
                max={1000000}
                step={100}
                prefix="$"
                helpText="Total monthly advertising budget"
              />

              <NumberInput
                id="cpc"
                label="Cost Per Click"
                value={inputs.cpc}
                onChange={(value) => handleInputChange('cpc', value)}
                min={0.01}
                max={100}
                step={0.01}
                prefix="$"
                helpText="Average cost per click in your campaigns"
              />

              <NumberInput
                id="cr"
                label="Conversion Rate"
                value={inputs.cr * 100}
                onChange={(value) => handleInputChange('cr', value / 100)}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                helpText="Percentage of visitors who convert"
              />

              <NumberInput
                id="aov"
                label="Average Order Value"
                value={inputs.aov}
                onChange={(value) => handleInputChange('aov', value)}
                min={1}
                max={50000}
                step={1}
                prefix="$"
                helpText="Average value per conversion or lead"
              />

              <NumberInput
                id="closeRate"
                label="Close Rate"
                value={inputs.closeRate * 100}
                onChange={(value) => handleInputChange('closeRate', value / 100)}
                min={0}
                max={100}
                step={1}
                suffix="%"
                helpText="For lead-gen: % of leads that become customers. For ecommerce: set to 100%"
              />

              <NumberInput
                id="aeoLift"
                label="Expected AEO Lift"
                value={inputs.aeoLift * 100}
                onChange={(value) => handleInputChange('aeoLift', value / 100)}
                min={0}
                max={200}
                step={5}
                suffix="%"
                helpText="Expected traffic increase from AI Engine Optimization"
              />
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>AEO Lift Explanation:</strong> AI Engine Optimization increases qualified
                traffic through better targeting and ad optimization. Your conversion rate remains
                the same, but you get more high-quality visitors.
              </p>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <ResultCard title="Current Performance">
            <div className="space-y-1">
              <MetricRow label="Monthly Clicks" value={formatNumber(results.clicks)} />
              <MetricRow label="Conversions" value={formatNumber(results.conversions)} />
              <MetricRow label="Revenue" value={formatCurrency(results.revenue)} />
              <MetricRow label="CAC" value={formatCurrency(results.cac)} />
              <MetricRow
                label="ROI"
                value={formatPercent(results.roi)}
                className="border-t pt-2 font-semibold"
              />
            </div>
          </ResultCard>

          <ResultCard title="With AEO Optimization">
            <div className="space-y-1">
              <MetricRow
                label="Monthly Clicks"
                value={formatNumber(results.withAeo.clicks)}
                delta={{
                  value: `+${formatNumber(results.withAeo.clicks - results.clicks)}`,
                  type: 'increase',
                }}
              />
              <MetricRow
                label="Conversions"
                value={formatNumber(results.withAeo.conversions)}
                delta={{
                  value: `+${formatNumber(results.withAeo.conversions - results.conversions)}`,
                  type: 'increase',
                }}
              />
              <MetricRow
                label="Revenue"
                value={formatCurrency(results.withAeo.revenue)}
                delta={{
                  value: `+${formatCurrency(results.withAeo.revenue - results.revenue)}`,
                  type: 'increase',
                }}
              />
              <MetricRow
                label="CAC"
                value={formatCurrency(results.withAeo.cac)}
                delta={{
                  value: formatCurrency(results.withAeo.cac - results.cac),
                  type: results.withAeo.cac < results.cac ? 'increase' : 'decrease',
                }}
              />
              <MetricRow
                label="ROI"
                value={formatPercent(results.withAeo.roi)}
                delta={{
                  value: formatPercent(results.withAeo.roi - results.roi),
                  type: 'increase',
                }}
                className="border-t pt-2 font-semibold"
              />
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
              <Link href="/ads" className="w-full">
                <ActionButton onClick={() => {}} className="w-full" size="sm">
                  Open Ads Creator
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

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ROI Calculator',
            description:
              'Calculate advertising return on investment and customer acquisition costs',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        }}
      />
    </div>
  );
}
