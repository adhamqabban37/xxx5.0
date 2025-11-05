'use client';

import { useState } from 'react';
import { PrismaClient } from '@prisma/client';

interface JsonLdGeneratorProps {
  userEmail: string;
}

interface GeneratedResult {
  blocks: any[];
}

export default function JsonLdGenerator({ userEmail }: JsonLdGeneratorProps) {
  const [url, setUrl] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    // Validate URL
    if (!url.trim()) {
      setError('Please enter a valid URL');
      setLoading(false);
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL format (include https://)');
      setLoading(false);
      return;
    }

    try {
      const body: any = { url: url.trim() };

      // If user wants to use onboarding data as fallback
      if (useFallback) {
        // TODO: Fetch user's onboarding data from Prisma
        // For now, we'll just send the request without fallback
      }

      const response = await fetch('/api/seo/json-ld', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate JSON-LD';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (response.status === 502 && data.error === 'FETCH_OR_PARSE_FAILED') {
            setError(
              `Unable to fetch or parse the webpage. Please check if the URL is accessible and try again.`
            );
            return;
          }
          errorMessage = data.error || errorMessage;
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      setResult(data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;

    try {
      const jsonString = JSON.stringify(result.blocks, null, 2);
      await navigator.clipboard.writeText(jsonString);

      // Show feedback
      const button = document.getElementById('copy-button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      // Copy failed silently
    }
  };

  const downloadJson = () => {
    if (!result) return;

    const jsonString = JSON.stringify(result.blocks, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema-jsonld.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openRichResultsTest = () => {
    if (!result) return;

    const jsonString = JSON.stringify(result.blocks, null, 2);
    const encodedJson = encodeURIComponent(jsonString);
    const testUrl = `https://search.google.com/test/rich-results?code=${encodedJson}`;
    window.open(testUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
              Website URL *
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the full URL of the business website you want to analyze
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="useFallback"
              checked={useFallback}
              onChange={(e) => setUseFallback(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="useFallback" className="ml-2 text-sm text-gray-300">
              Use my onboarding data as fallback
            </label>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cta-button w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating JSON-LD...
              </div>
            ) : (
              'Generate JSON-LD'
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="glass-panel p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Generated JSON-LD</h3>
            <div className="flex space-x-3">
              <button
                id="copy-button"
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Copy JSON
              </button>
              <button
                onClick={downloadJson}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Download JSON
              </button>
              <button
                onClick={openRichResultsTest}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Google Test
              </button>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-sm text-gray-300">{JSON.stringify(result.blocks, null, 2)}</pre>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>
              Generated {result.blocks.length} schema.org block
              {result.blocks.length !== 1 ? 's' : ''}. Copy this JSON-LD and add it to your
              website&apos;s &lt;head&gt; section.
            </p>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="glass-panel p-8">
        <h3 className="text-lg font-semibold text-white mb-4">How to use JSON-LD</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <p>1. Generate the JSON-LD structured data using the form above</p>
          <p>2. Copy the generated JSON code</p>
          <p>
            3. Add it to your website&apos;s HTML within a &lt;script
            type=&quot;application/ld+json&quot;&gt; tag
          </p>
          <p>4. Test your implementation using Google&apos;s Rich Results Test</p>
          <p>5. Monitor your search appearance in Google Search Console</p>
        </div>
      </div>
    </div>
  );
}
