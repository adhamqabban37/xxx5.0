import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AeoValidationDashboard from '@/components/AeoValidationDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, CreditCard } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    session_id?: string;
  }>;
}

async function getValidationResult(id: string, userId?: string) {
  const validation = await prisma.aeoValidation.findUnique({
    where: {
      id,
      // Allow access if user owns it or if it's anonymous
      ...(userId
        ? {
            OR: [{ userId }, { userId: null }],
          }
        : {}),
    },
  });

  if (!validation) {
    return null;
  }

  return {
    ...validation,
    validationResults: validation.validationResults as any,
    criticalIssues: validation.criticalIssues as any,
    recommendations: validation.recommendations as any,
    optimizedSchemas: validation.optimizedSchemas as any,
    implementationGuide: validation.implementationGuide as any,
    competitorAnalysis: validation.competitorAnalysis as any,
  };
}

export default async function ValidationResultPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const validation = await getValidationResult(resolvedParams.id, session?.user?.id);

  if (!validation) {
    notFound();
  }

  // Check if this is a return from successful payment
  const isPaymentSuccess = resolvedSearchParams.session_id && validation.paymentStatus === 'paid';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isPaymentSuccess && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                <p className="text-green-700">
                  Premium features have been unlocked. Your optimized schemas and implementation
                  guide are now available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Validation Results</h1>
          <div className="flex items-center gap-2">
            <Badge variant={validation.paymentStatus === 'paid' ? 'default' : 'secondary'}>
              {validation.paymentStatus === 'paid' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Premium Unlocked
                </>
              ) : validation.paymentStatus === 'processing' ? (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Processing Payment
                </>
              ) : (
                <>
                  <CreditCard className="w-3 h-3 mr-1" />
                  Free Analysis
                </>
              )}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground">
          Analysis results for <strong>{validation.websiteUrl}</strong>
          {validation.businessName && ` • ${validation.businessName}`}
        </p>
      </div>

      <Suspense fallback={<div>Loading validation details...</div>}>
        <ValidationResultDisplay validation={validation} />
      </Suspense>
    </div>
  );
}

function ValidationResultDisplay({ validation }: { validation: any }) {
  // Convert the validation result to the format expected by the dashboard
  const dashboardData = {
    id: validation.id,
    websiteUrl: validation.websiteUrl,
    businessName: validation.businessName,
    businessType: validation.businessType,
    validationResults: validation.validationResults,
    overallScore: validation.overallScore,
    issueCount: validation.issueCount,
    criticalIssues: validation.criticalIssues,
    recommendations: validation.recommendations,
    paymentStatus: validation.paymentStatus,
    premiumUnlockedAt: validation.premiumUnlockedAt?.toISOString(),
    createdAt: validation.createdAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Display results using the existing dashboard component structure */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(validation.overallScore)}/100</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{validation.issueCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {validation.criticalIssues?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {validation.recommendations?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {validation.paymentStatus === 'paid' && validation.optimizedSchemas && (
        <Card>
          <CardHeader>
            <CardTitle>Premium Deliverables Available</CardTitle>
            <CardDescription>
              Your premium content has been generated and is ready for implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Optimized Schemas</h3>
                <p className="text-sm text-muted-foreground">JSON-LD schemas ready to implement</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Implementation Guide</h3>
                <p className="text-sm text-muted-foreground">Step-by-step instructions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Competitor Analysis</h3>
                <p className="text-sm text-muted-foreground">Competitive insights and gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show the detailed results in a simplified format */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Summary</CardTitle>
          <CardDescription>
            Completed on {new Date(validation.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(validation.validationResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
