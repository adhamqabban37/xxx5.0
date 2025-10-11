import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AeoValidationDashboard from '@/components/AeoValidationDashboard';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Calendar } from 'lucide-react';

async function getRecentValidations(userId?: string) {
  if (!userId) return [];

  return await prisma.aeoValidation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      websiteUrl: true,
      businessName: true,
      overallScore: true,
      issueCount: true,
      paymentStatus: true,
      createdAt: true,
    },
  });
}

export default async function AeoValidationPage() {
  const session = await getServerSession(authOptions);
  const recentValidations = await getRecentValidations(session?.user?.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">AEO Validation Platform</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Optimize your website for Answer Engine visibility with AI-powered analysis
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600 mb-2">🔍</div>
              <h3 className="font-semibold mb-1">Comprehensive Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Lighthouse performance, SEO audit, schema validation, and AEO optimization analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600 mb-2">⚡</div>
              <h3 className="font-semibold mb-1">Instant Results</h3>
              <p className="text-sm text-muted-foreground">
                Get detailed optimization recommendations and actionable insights in minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600 mb-2">🎯</div>
              <h3 className="font-semibold mb-1">Premium Deliverables</h3>
              <p className="text-sm text-muted-foreground">
                Custom JSON-LD schemas, implementation guides, and competitor analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        <AeoValidationDashboard userId={session?.user?.id} />
      </Suspense>

      {recentValidations.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Validations
            </CardTitle>
            <CardDescription>Your previously analyzed websites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentValidations.map((validation) => (
                <Link
                  key={validation.id}
                  href={`/aeo-validation/${validation.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{validation.websiteUrl}</h3>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                      {validation.businessName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {validation.businessName}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span>Score: {Math.round(validation.overallScore)}/100</span>
                        <span>Issues: {validation.issueCount}</span>
                        <span className="text-muted-foreground">
                          {new Date(validation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Badge
                        variant={validation.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      >
                        {validation.paymentStatus === 'paid' ? 'Premium' : 'Free'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const metadata = {
  title: 'AEO Validation Platform - Xenlix AI',
  description:
    'Optimize your website for Answer Engine visibility with comprehensive AEO analysis and recommendations.',
};
