import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { Metadata } from 'next';
import SEOAnalyzerClient from './SEOAnalyzerClient';

export const metadata: Metadata = {
  title: 'SEO Strategy Analyzer | Business Intelligence | XenlixAI',
  description:
    'Advanced SEO strategy analyzer for premium users. Get comprehensive business profile analysis, keyword strategies, and local SEO recommendations.',
  robots: 'noindex, nofollow', // Premium feature, requires authentication
};

export default async function SEOAnalyzerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin?message=Premium access required for SEO Strategy Analyzer');
  }

  return <SEOAnalyzerClient />;
}
