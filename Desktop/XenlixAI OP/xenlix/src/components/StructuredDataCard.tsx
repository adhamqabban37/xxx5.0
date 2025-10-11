'use client';

import { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle,
  AlertTriangle,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ExternalLink,
  Badge,
  AlertCircle,
  BookOpen,
  X,
} from 'lucide-react';

interface SchemaAudit {
  hasJsonLd: boolean;
  blocksCount: number;
  detectedTypes: string[];
  microdata: boolean;
  issues: string[];
  score: number;
}

interface SchemaRecommended {
  bundleString?: string;
  notes?: string[];
}

interface ApiResponse {
  schemaAudit: SchemaAudit;
  schemaRecommended?: SchemaRecommended;
}

interface StructuredDataCardProps {
  url: string;
  className?: string;
}

export default function StructuredDataCard({ url, className = '' }: StructuredDataCardProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);
  const [showImplementationModal, setShowImplementationModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analyze/preview?url=${encodeURIComponent(url)}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch schema data:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze structured data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [url]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Work';
  };

  const copyToClipboard = async () => {
    if (!data?.schemaRecommended?.bundleString) return;

    try {
      await navigator.clipboard.writeText(data.schemaRecommended.bundleString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers or when clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = data.schemaRecommended.bundleString;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadSchema = () => {
    if (!data?.schemaRecommended?.bundleString) return;

    try {
      const blob = new Blob([data.schemaRecommended.bundleString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schema.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download schema:', err);
    }
  };

  const markAsImplemented = () => {
    setMarked(true);
    // Show toast notification
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = 'Marked as implemented!';
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
      setMarked(false);
    }, 3000);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}
        role="region"
        aria-label="Structured data analysis loading"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`bg-white rounded-2xl p-6 border border-red-200 shadow-sm ${className}`}
        role="region"
        aria-label="Structured data analysis error"
      >
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <h3 className="font-semibold">Schema Analysis Unavailable</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          aria-label="Retry schema analysis"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {loading ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { schemaAudit } = data;

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}
      role="region"
      aria-labelledby="schema-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 id="schema-title" className="text-xl font-semibold text-gray-900 mb-1">
            Structured Data Analysis
          </h3>
          <p className="text-gray-600 text-sm">JSON-LD schemas and microdata detection</p>
        </div>

        {/* Score Badge */}
        <div
          className={`px-4 py-2 rounded-full border-2 ${getScoreBg(schemaAudit.score)}`}
          role="img"
          aria-label={`Schema score: ${schemaAudit.score} out of 100, ${getScoreLabel(schemaAudit.score)}`}
        >
          <div className={`text-2xl font-bold ${getScoreColor(schemaAudit.score)}`}>
            {schemaAudit.score}
          </div>
          <div className="text-xs text-gray-600 text-center">
            {getScoreLabel(schemaAudit.score)}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Code2 className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="font-medium text-gray-900">JSON-LD Blocks</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{schemaAudit.blocksCount}</div>
          {schemaAudit.hasJsonLd ? (
            <div className="text-green-600 text-sm flex items-center mt-1">
              <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
              Found
            </div>
          ) : (
            <div className="text-red-600 text-sm flex items-center mt-1">
              <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
              None found
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className="h-4 w-4 text-purple-500" aria-hidden="true" />
            <span className="font-medium text-gray-900">Schema Types</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{schemaAudit.detectedTypes.length}</div>
          {schemaAudit.microdata && (
            <div className="text-green-600 text-sm flex items-center mt-1">
              <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />+ Microdata
            </div>
          )}
        </div>
      </div>

      {/* Detected Schema Types */}
      {schemaAudit.detectedTypes.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Detected Schema Types</h4>
          <div className="flex flex-wrap gap-2">
            {schemaAudit.detectedTypes.map((type) => (
              <span
                key={type}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {schemaAudit.issues.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" aria-hidden="true" />
            Issues & Recommendations ({schemaAudit.issues.length})
          </h4>
          <div className="space-y-2">
            {schemaAudit.issues.map((issue, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Checklist */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" aria-hidden="true" />
          Implementation Checklist
        </h4>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-blue-900" role="checklist">
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 mt-0.5 rounded border border-blue-400 bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-blue-700 font-bold">•</span>
              </div>
              <span className="text-blue-900">
                Add JSON-LD in{' '}
                <code className="bg-blue-100 px-1 rounded text-xs font-mono text-blue-800">
                  &lt;head&gt;
                </code>{' '}
                as a single{' '}
                <code className="bg-blue-100 px-1 rounded text-xs font-mono text-blue-800">
                  &lt;script type="application/ld+json"&gt;
                </code>{' '}
                (array)
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 mt-0.5 rounded border border-blue-400 bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-blue-700 font-bold">•</span>
              </div>
              <span className="text-blue-900">
                Keep{' '}
                <code className="bg-blue-100 px-1 rounded text-xs font-mono text-blue-800">
                  @id
                </code>{' '}
                values stable across deployments
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 mt-0.5 rounded border border-blue-400 bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-blue-700 font-bold">•</span>
              </div>
              <span className="text-blue-900">Use absolute HTTPS URLs for all properties</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 mt-0.5 rounded border border-blue-400 bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-blue-700 font-bold">•</span>
              </div>
              <span className="text-blue-900">
                Don't fabricate ratings/reviews - use real data only
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 mt-0.5 rounded border border-blue-400 bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-blue-700 font-bold">•</span>
              </div>
              <span className="text-blue-900">
                Re-run audit after deploying to verify implementation
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recommended JSON-LD */}
      {data.schemaRecommended?.bundleString && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Recommended JSON-LD</h4>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              aria-expanded={showJson}
              aria-controls="json-content"
            >
              {showJson ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  <span>Hide JSON</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  <span>Show JSON</span>
                </>
              )}
            </button>
          </div>

          {showJson && (
            <div id="json-content" className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">
                {JSON.stringify(JSON.parse(data.schemaRecommended.bundleString), null, 2)}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={copyToClipboard}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  copyToClipboard();
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Copy JSON-LD schema to clipboard"
              disabled={!data?.schemaRecommended?.bundleString}
            >
              <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>

            <button
              onClick={downloadSchema}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  downloadSchema();
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Download schema as JSON file"
              disabled={!data?.schemaRecommended?.bundleString}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Download schema.json
            </button>

            <button
              onClick={markAsImplemented}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!marked) markAsImplemented();
                }
              }}
              disabled={marked}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              aria-label="Mark schema as implemented"
            >
              <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              {marked ? 'Marked!' : 'Mark as Implemented'}
            </button>

            <button
              onClick={() => setShowImplementationModal(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 focus:bg-orange-700 text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              aria-label="Show implementation guide"
            >
              <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
              How to implement
            </button>
          </div>
        </div>
      )}

      {/* Implementation Modal */}
      {showImplementationModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImplementationModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">How to Implement JSON-LD</h3>
              <button
                onClick={() => setShowImplementationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Platform Instructions */}
            <div className="space-y-6">
              {/* WordPress */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-6 h-6 bg-blue-600 rounded mr-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  WordPress
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Method 1:</strong> Use a plugin like "Schema Pro" or "All in One SEO"
                  </p>
                  <p>
                    <strong>Method 2:</strong> Add to your theme's{' '}
                    <code className="bg-gray-100 px-1 rounded font-mono">header.php</code>:
                  </p>
                  <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                    &lt;script type="application/ld+json"&gt;
                    <br />
                    &nbsp;&nbsp;{`{paste your JSON here}`}
                    <br />
                    &lt;/script&gt;
                  </div>
                  <p>
                    <strong>Method 3:</strong> Use Custom HTML block in page editor
                  </p>
                </div>
              </div>

              {/* Shopify */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-6 h-6 bg-green-600 rounded mr-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  Shopify
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>In your theme editor:</strong>
                  </p>
                  <p>1. Go to Online Store → Themes → Edit code</p>
                  <p>
                    2. Open <code className="bg-gray-100 px-1 rounded font-mono">theme.liquid</code>
                  </p>
                  <p>
                    3. Add before{' '}
                    <code className="bg-gray-100 px-1 rounded font-mono">&lt;/head&gt;</code>:
                  </p>
                  <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                    &lt;script type="application/ld+json"&gt;
                    <br />
                    &nbsp;&nbsp;{`{paste your JSON here}`}
                    <br />
                    &lt;/script&gt;
                  </div>
                </div>
              </div>

              {/* Next.js */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-6 h-6 bg-black rounded mr-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  Next.js / Custom Sites
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>In your page component or layout:</strong>
                  </p>
                  <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                    import Head from 'next/head'
                    <br />
                    <br />
                    &lt;Head&gt;
                    <br />
                    &nbsp;&nbsp;&lt;script
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;type="application/ld+json"
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;dangerouslySetInnerHTML=
                    {`{{ __html: JSON.stringify(schemaData) }}`}
                    <br />
                    &nbsp;&nbsp;/&gt;
                    <br />
                    &lt;/Head&gt;
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">✅ Verification & Testing</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>Test immediately:</strong>{' '}
                    <a
                      href="https://search.google.com/test/rich-results"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-700"
                    >
                      Google's Rich Results Test
                    </a>
                  </p>
                  <p>
                    <strong>Validate syntax:</strong>{' '}
                    <a
                      href="https://validator.schema.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-700"
                    >
                      Schema.org Validator
                    </a>
                  </p>
                  <p>
                    <strong>Monitor in GSC:</strong> Check "Enhancements" section for rich snippets
                  </p>
                </div>
              </div>

              {/* AEO Note */}
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">
                  🤖 AEO (AI Engine Optimization)
                </h4>
                <p className="text-sm text-purple-800">
                  <strong>Stronger entity graph helps AI engines understand your business.</strong>{' '}
                  JSON-LD creates clear relationships between your organization, products, and
                  services that AI systems can parse and reference accurately.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Implementation takes 2-5 minutes</span>
                <button
                  onClick={() => setShowImplementationModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Powered by Schema.org validation</span>
          <a
            href="https://developers.google.com/search/docs/appearance/structured-data"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            <span>Learn more</span>
            <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
