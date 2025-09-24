import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enhanced AEO Dashboard | XenlixAI',
  description: 'AI-powered business intelligence with comprehensive AEO optimization insights',
  robots: 'noindex, nofollow'
};

export default function EnhancedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}