import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | XenlixAI - AI Marketing & AEO Analytics',
  description:
    "Monitor your AI marketing performance, AEO optimization progress, and campaign analytics with XenlixAI's comprehensive dashboard.",
  robots: 'noindex, nofollow', // Private dashboard should not be indexed
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
