import UnifiedAEOAnalysis from '@/components/UnifiedAEOAnalysis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Complete AEO Analysis | XenlixAI',
  description:
    'Comprehensive AEO analysis combining content crawling, AI semantic matching, and technical auditing',
};

export default async function CompleteAEOAnalysisPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/signin?callbackUrl=/aeo-analysis');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UnifiedAEOAnalysis />
    </div>
  );
}
