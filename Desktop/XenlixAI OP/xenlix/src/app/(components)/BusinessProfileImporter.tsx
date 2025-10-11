'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { NormalizedBusinessProfile } from '@/lib/business-profile-parser';

interface ImportResponse {
  success: boolean;
  data?: {
    profile: NormalizedBusinessProfile;
    recommendations: {
      seo: string[];
      content: string[];
      reviews: string[];
      local: string[];
      priority: 'high' | 'medium' | 'low';
    };
  };
  error?: string;
  warnings?: string[];
}

interface BusinessProfileImporterProps {
  onProfileImported?: (profile: NormalizedBusinessProfile) => void;
  className?: string;
}

export default function BusinessProfileImporter({
  onProfileImported,
  className = '',
}: BusinessProfileImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [source, setSource] = useState('manual-import');
  const [mergeWithExisting, setMergeWithExisting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonInput(text);
      setSource(`file:${file.name}`);
    } catch (error) {
      console.error('File read error:', error);
      setImportResult({
        success: false,
        error: 'Failed to read file',
      });
    }
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setImportResult({
        success: false,
        error: 'Please provide JSON data to import',
      });
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    try {
      // Parse JSON to validate format
      let jsonData;
      try {
        jsonData = JSON.parse(jsonInput);
      } catch (parseError) {
        throw new Error('Invalid JSON format');
      }

      const response = await fetch('/api/business/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonData,
          source,
          mergeWithExisting,
        }),
      });

      const result: ImportResponse = await response.json();
      setImportResult(result);

      if (result.success && result.data && onProfileImported) {
        onProfileImported(result.data.profile);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearExample = (exampleType: string) => {
    const examples = {
      google: JSON.stringify(
        {
          name: 'Example Restaurant',
          businessStatus: 'OPERATIONAL',
          categories: ['Restaurant', 'Italian Restaurant'],
          phoneNumber: '+1-555-123-4567',
          websiteUri: 'https://example-restaurant.com',
          location: {
            address: {
              addressLines: ['123 Main Street'],
              locality: 'San Francisco',
              administrativeArea: 'CA',
              postalCode: '94102',
              regionCode: 'US',
            },
          },
          regularHours: {
            periods: [
              { openDay: 'MONDAY', openTime: '11:00', closeDay: 'MONDAY', closeTime: '22:00' },
              { openDay: 'TUESDAY', openTime: '11:00', closeDay: 'TUESDAY', closeTime: '22:00' },
            ],
          },
        },
        null,
        2
      ),
      yelp: JSON.stringify(
        {
          id: 'example-restaurant-sf',
          name: 'Example Restaurant',
          rating: 4.5,
          review_count: 185,
          categories: [
            { alias: 'italian', title: 'Italian' },
            { alias: 'restaurants', title: 'Restaurants' },
          ],
          location: {
            address1: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94102',
          },
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
          phone: '+15551234567',
        },
        null,
        2
      ),
      generic: JSON.stringify(
        {
          businessName: 'Example Restaurant',
          industry: 'Restaurant',
          services: ['Fine Dining', 'Catering', 'Private Events'],
          city: 'San Francisco',
          address: {
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
          },
          phone: '+1-555-123-4567',
          email: 'info@example-restaurant.com',
          website: 'https://example-restaurant.com',
          reviews: { rating: 4.5, count: 200 },
          attributes: {
            yearEstablished: 2015,
            specialties: ['Italian Cuisine', 'Fresh Pasta'],
          },
        },
        null,
        2
      ),
    };

    setJsonInput(examples[exampleType as keyof typeof examples] || '');
    setSource(`example:${exampleType}`);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Business Profile</h2>
        <p className="text-gray-600">
          Import your business data from Google My Business, Yelp, Facebook, or custom JSON format.
        </p>
      </div>

      {/* Upload Options */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Upload JSON File
            <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="merge"
              checked={mergeWithExisting}
              onChange={(e) => setMergeWithExisting(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="merge" className="text-sm text-gray-700">
              Merge with existing profile
            </label>
          </div>
        </div>

        {/* Example Templates */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Or try an example format:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleClearExample('google')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Google My Business
            </button>
            <button
              onClick={() => handleClearExample('yelp')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Yelp Business
            </button>
            <button
              onClick={() => handleClearExample('generic')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Generic Format
            </button>
          </div>
        </div>
      </div>

      {/* JSON Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">JSON Data</label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your business profile JSON data here..."
          className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Source Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Source (optional)</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g., google-my-business-export, yelp-api"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={isLoading || !jsonInput.trim()}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Importing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Import Profile
          </div>
        )}
      </button>

      {/* Results */}
      {importResult && (
        <div className="mt-6">
          {importResult.success ? (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800">Profile Imported Successfully</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Business profile has been normalized and is ready for optimization.
                  </p>
                </div>
              </div>

              {/* Profile Summary */}
              {importResult.data && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Profile Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Business:</span>{' '}
                      {importResult.data.profile.businessName}
                    </div>
                    <div>
                      <span className="font-medium">Industry:</span>{' '}
                      {importResult.data.profile.industry}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>{' '}
                      {importResult.data.profile.city}
                    </div>
                    <div>
                      <span className="font-medium">Services:</span>{' '}
                      {importResult.data.profile.services.length}
                    </div>
                    <div>
                      <span className="font-medium">Reviews:</span>{' '}
                      {importResult.data.profile.reviews.rating.toFixed(1)} (
                      {importResult.data.profile.reviews.count})
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>{' '}
                      {Math.round(importResult.data.profile.metadata.confidence * 100)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Recommendations */}
              {importResult.data?.recommendations && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">
                    Optimization Recommendations
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded ${
                        importResult.data.recommendations.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : importResult.data.recommendations.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {importResult.data.recommendations.priority} priority
                    </span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries(importResult.data.recommendations).map(([category, items]) => {
                      if (category === 'priority' || !Array.isArray(items) || items.length === 0)
                        return null;
                      return (
                        <div key={category}>
                          <h5 className="font-medium text-blue-800 capitalize">{category}</h5>
                          <ul className="list-disc list-inside text-blue-700 ml-2 space-y-1">
                            {items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Import Warnings</h3>
                    <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                      {importResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Import Failed</h3>
                <p className="text-sm text-red-700 mt-1">{importResult.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">Supported Formats</h4>
            <ul className="space-y-1">
              <li>• Google My Business API exports</li>
              <li>• Yelp Business API data</li>
              <li>• Facebook Business API data</li>
              <li>• Custom JSON with business fields</li>
            </ul>
            <p className="mt-2">
              The parser will automatically detect the format and normalize the data for
              optimization tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
