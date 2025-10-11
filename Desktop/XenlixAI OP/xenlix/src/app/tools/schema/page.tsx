// Schema.org Social Media Validation Tool
// Demonstrates the SameAsProfileIntegrator component

import { Metadata } from 'next';
import { SameAsProfileIntegrator } from '@/components/SameAsProfileIntegrator';

export const metadata: Metadata = {
  title: 'Schema.org Social Media Validation Tool - Xenlix AI',
  description:
    'Validate and integrate social media profiles into Schema.org JSON-LD markup for improved SEO and Rich Results.',
  keywords: 'schema.org, social media validation, json-ld, seo tools, sameAs property',
};

export default function SchemaToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Schema.org Social Media Validation
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Validate and integrate social media profiles into your Schema.org JSON-LD markup for
              improved SEO performance and Rich Results eligibility.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Social Profile Validator</h2>
            <p className="text-gray-600 mb-8">
              Enter your business social media profiles below. The tool will validate each profile
              and generate optimized Schema.org JSON-LD markup with proper sameAs properties.
            </p>

            <SameAsProfileIntegrator
              businessData={{
                name: 'Your Business Name',
                website: 'https://yourbusiness.com',
                description: 'Your business description',
              }}
              onSchemasGenerated={(schemas: any[], output: string) => {
                console.log('Generated Schemas:', schemas, output);
              }}
            />
          </div>

          <div className="mt-12 bg-blue-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Supported Platforms</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Instagram',
                'X (Twitter)',
                'Facebook',
                'LinkedIn',
                'YouTube',
                'TikTok',
                'Threads',
                'GitHub',
                'Pinterest',
                'Reddit',
                'Medium',
                'Custom URLs',
              ].map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 text-sm">{platform}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-green-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Features</h3>
            <ul className="space-y-3 text-green-700">
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>Real-time profile validation with HTTP status checking</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>Automatic platform detection and URL normalization</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>Schema.org compliance validation and error reporting</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>Rich Results optimization for search engines</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>Copy-to-clipboard JSON-LD export functionality</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
