import { Metadata } from "next";
import BusinessProfileImporter from "../../(components)/BusinessProfileImporter";
import { NormalizedBusinessProfile } from "@/lib/business-profile-parser";

export const metadata: Metadata = {
  title: "Import Business Data | AI Profile Optimizer | XenlixAI",
  description: "Import and normalize your business profile from Google My Business, Yelp, Facebook, or custom JSON format for AI optimization.",
};

export default function BusinessImportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Business Profile Import
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Import your business data from popular platforms and normalize it into a standard structure 
            for AI-powered optimization and marketing automation.
          </p>
        </div>

        <BusinessProfileImporter 
          onProfileImported={(profile: NormalizedBusinessProfile) => {
            console.log('Profile imported:', profile);
            // In a real app, you would save this to your state management or database
          }}
        />

        {/* Feature Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Platform Import</h3>
            <p className="text-gray-600 text-sm">
              Import from Google My Business, Yelp, Facebook, or any custom JSON format
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Normalization</h3>
            <p className="text-gray-600 text-sm">
              Automatically normalize different data formats into a consistent structure
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimization Ready</h3>
            <p className="text-gray-600 text-sm">
              Get instant recommendations for SEO, content, reviews, and local optimization
            </p>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">API Integration</h2>
          <p className="text-gray-600 mb-4">
            You can also integrate the business profile parser directly into your applications:
          </p>
          
          <div className="bg-gray-900 rounded-lg p-4 text-sm">
            <code className="text-green-400">
              <span className="text-blue-400">POST</span> <span className="text-yellow-300">/api/business/import</span>
              <br />
              <span className="text-gray-500">Content-Type: application/json</span>
              <br /><br />
              <span className="text-white">{"{"}</span>
              <br />
              <span className="text-white">  "jsonData": {"{"}</span>
              <br />
              <span className="text-white">    "name": "Your Business",</span>
              <br />
              <span className="text-white">    "industry": "Restaurant",</span>
              <br />
              <span className="text-white">    "city": "San Francisco"</span>
              <br />
              <span className="text-white">    ...</span>
              <br />
              <span className="text-white">  {"}"},</span>
              <br />
              <span className="text-white">  "source": "manual-import",</span>
              <br />
              <span className="text-white">  "mergeWithExisting": false</span>
              <br />
              <span className="text-white">{"}"}</span>
            </code>
          </div>
          
          <p className="text-gray-600 mt-4 text-sm">
            <strong>Response:</strong> Normalized business profile with optimization recommendations and confidence scoring.
          </p>
        </div>
      </div>
    </div>
  );
}