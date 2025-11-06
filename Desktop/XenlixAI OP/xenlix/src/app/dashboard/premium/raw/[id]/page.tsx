/**
 * Raw JSON Viewer Page - Premium Dashboard
 * Displays pretty-printed raw JSON analytics data for premium scans
 */

import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { CopyButton, BackButton } from './components/ClientButtons';

const prisma = new PrismaClient();

interface RawJsonData {
  id: string;
  url: string;
  schemaVersion: string;
  analyzerVersion: string;
  raw: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

async function getRawJsonData(id: string, userId?: string): Promise<RawJsonData | null> {
  try {
    const scan = await prisma.aeoValidation.findUnique({
      where: { id },
      select: {
        id: true,
        websiteUrl: true,
        rawJson: true,
        schemaVersion: true,
        analyzerVersion: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!scan || !scan.rawJson) {
      return null;
    }

    // Optional: Check if user has access to this scan
    if (userId && scan.userId && scan.userId !== userId) {
      return null;
    }

    return {
      id: scan.id,
      url: scan.websiteUrl,
      schemaVersion: scan.schemaVersion || 'unknown',
      analyzerVersion: scan.analyzerVersion || 'unknown',
      raw: scan.rawJson as Record<string, unknown>,
      createdAt: scan.createdAt.toISOString(),
      updatedAt: scan.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch raw JSON data:', error);
    return null;
  }
}

export default async function RawJsonViewerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const data = await getRawJsonData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Raw JSON Analytics</h1>
              <p className="text-gray-600 mt-1">
                Complete AEO analysis payload for: <span className="font-medium">{data.url}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <CopyButton jsonData={data.raw} />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Scan ID</dt>
              <dd className="text-sm text-gray-900 font-mono">{data.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Schema Version</dt>
              <dd className="text-sm text-gray-900 font-mono">{data.schemaVersion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Analyzer Version</dt>
              <dd className="text-sm text-gray-900 font-mono">{data.analyzerVersion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Generated</dt>
              <dd className="text-sm text-gray-900">
                {new Date(data.createdAt).toLocaleDateString()} at{' '}
                {new Date(data.createdAt).toLocaleTimeString()}
              </dd>
            </div>
          </div>
        </div>

        {/* Raw JSON Display */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Raw JSON Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete validated payload from the AEO analysis engine
            </p>
          </div>
          <div className="p-6">
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                <code>{JSON.stringify(data.raw, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <BackButton />
        </div>
      </div>
    </div>
  );
}
