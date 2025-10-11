import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Analyzer | Free Website SEO Analysis Tool - XenlixAI',
  description:
    "Analyze your website's SEO performance with our advanced AI-powered SEO analyzer. Get detailed insights, keyword analysis, and optimization recommendations for better search rankings.",
  keywords:
    'SEO analyzer, website SEO analysis, free SEO tool, SEO audit, search engine optimization analysis, keyword analysis',
  openGraph: {
    title: 'SEO Analyzer | Free Website SEO Analysis Tool - XenlixAI',
    description:
      "Analyze your website's SEO performance with our advanced AI-powered SEO analyzer. Get detailed insights, keyword analysis, and optimization recommendations for better search rankings.",
    type: 'website',
    url: 'https://www.xenlixai.com/seo-analyzer',
    siteName: 'XenlixAI',
    images: [
      {
        url: 'https://www.xenlixai.com/og-seo-analyzer.jpg',
        width: 1200,
        height: 630,
        alt: 'SEO Analyzer Tool - XenlixAI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Analyzer | Free Website SEO Analysis Tool - XenlixAI',
    description:
      "Analyze your website's SEO performance with our advanced AI-powered SEO analyzer. Get detailed insights, keyword analysis, and optimization recommendations for better search rankings.",
    creator: '@XenlixAI',
    images: ['https://www.xenlixai.com/og-seo-analyzer.jpg'],
  },
  alternates: {
    canonical: 'https://www.xenlixai.com/seo-analyzer',
  },
};

export default function SEOAnalyzerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
