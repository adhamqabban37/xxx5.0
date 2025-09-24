'use client';

import React, { useState } from 'react';
import { useAEOScore, AEOScoreRequest } from '@/hooks/useAEOScore';
import { AEOScoreDisplay } from '@/components/AEOScoreDisplay';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  TrashIcon, 
  InformationCircleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function AEOAnalyzerPage() {
  const { analyzeAEOScore, loading, result, error, reset } = useAEOScore();
  const [url, setUrl] = useState('');
  const [queries, setQueries] = useState(['']);
  const [scanType, setScanType] = useState<'full' | 'quick'>('full');

  const handleAddQuery = () => {
    setQueries([...queries, '']);
  };

  const handleRemoveQuery = (index: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter((_, i) => i !== index));
    }
  };

  const handleQueryChange = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validQueries = queries.filter(q => q.trim().length > 0);
    if (!url || validQueries.length === 0) {
      return;
    }

    const request: AEOScoreRequest = {
      url,
      queries: validQueries,
      scanType,
      includeSemanticAnalysis: true
    };

    try {
      await analyzeAEOScore(request);
    } catch (err) {
      console.error('AEO analysis failed:', err);
    }
  };

  const handleReset = () => {
    reset();
    setUrl('');
    setQueries(['']);
    setScanType('full');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
            <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
            AEO Semantic Analyzer
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Analyze how well your website content answers user queries using advanced semantic analysis 
            powered by sentence-transformers and AI.
          </p>
        </div>

        {/* Analysis Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Scan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="full"
                    checked={scanType === 'full'}
                    onChange={(e) => setScanType(e.target.value as 'full' | 'quick')}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm">Full Analysis (Recommended)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="quick"
                    checked={scanType === 'quick'}
                    onChange={(e) => setScanType(e.target.value as 'full' | 'quick')}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm">Quick Scan</span>
                </label>
              </div>
            </div>

            {/* Query Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  User Queries to Test
                </label>
                <button
                  type="button"
                  onClick={handleAddQuery}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  disabled={loading}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Query
                </button>
              </div>
              
              <div className="space-y-3">
                {queries.map((query, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => handleQueryChange(index, e.target.value)}
                      placeholder={`Query ${index + 1}: e.g., "best dentist in Dallas"`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                    {queries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuery(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-2 flex items-start space-x-2 text-sm text-gray-600">
                <InformationCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Add questions your target audience might ask. The AI will analyze how well your content answers these queries.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading || !url || queries.every(q => !q.trim())}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    Analyze AEO Score
                  </>
                )}
              </button>
              
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  New Analysis
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">Analyzing Your Content</h3>
            <p className="text-blue-700">
              This may take 60-90 seconds as we crawl your website and perform semantic analysis...
            </p>
            <div className="mt-4 text-sm text-blue-600">
              <p>🔍 Crawling website content...</p>
              <p>🧠 Generating embeddings with sentence-transformers...</p>
              <p>📊 Computing semantic similarity scores...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && <AEOScoreDisplay result={result} />}
        
        {/* Help Section */}
        {!result && !loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How AEO Semantic Analysis Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium mb-2">Content Extraction</h4>
                <p className="text-sm text-gray-600">
                  Our AI crawls your website and extracts all text content, including headings, paragraphs, and FAQ sections.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-medium mb-2">Semantic Embedding</h4>
                <p className="text-sm text-gray-600">
                  Using sentence-transformers (all-MiniLM-L6-v2), we generate embeddings for both your queries and content.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-medium mb-2">Similarity Analysis</h4>
                <p className="text-sm text-gray-600">
                  We compute cosine similarity between queries and content to find the best matches and identify gaps.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}