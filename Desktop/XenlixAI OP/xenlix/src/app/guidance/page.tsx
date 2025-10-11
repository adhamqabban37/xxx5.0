import Link from 'next/link';

export default function GuidancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">AI Guidance Page</h1>
        <div className="text-gray-300 mb-8">Custom AEO & AI advertising recommendations</div>
        <div className="space-x-4">
          <Link
            href="/tools/json-ld"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
          >
            Generate JSON-LD
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
