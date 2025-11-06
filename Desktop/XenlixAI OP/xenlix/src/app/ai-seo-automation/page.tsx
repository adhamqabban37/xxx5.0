import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI SEO Automation | Automated SEO Optimization | XenlixAI',
  description:
    'Automate your SEO with AI: keyword research, schema markup, technical fixes & content optimization. Get found in Google & AI search engines.',
  keywords:
    'AI SEO automation, automated SEO, AI keyword research, schema markup automation, technical SEO automation',
};

export default function AISeOAutomationPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does AI SEO automation work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI SEO automation uses machine learning to analyze your website, research keywords, optimize content, implement schema markup, and fix technical SEO issues automatically. It monitors search rankings and adjusts strategies in real-time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can AI SEO really replace manual SEO work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For most small businesses, yes! AI handles 80% of SEO tasks faster and more accurately than manual work. It excels at technical SEO, keyword research, content optimization, and continuous monitoring - freeing you to focus on business growth.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does AI SEO take to show results?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most businesses see initial improvements in search visibility within 4-6 weeks. Significant ranking improvements typically occur within 3-4 months as AI optimizations compound and search engines index the changes.',
        },
      },
    ],
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'AI SEO Automation',
    provider: {
      '@type': 'Organization',
      name: 'XenlixAI',
    },
    serviceType: 'SEO Automation',
    areaServed: ['US', 'CA', 'GB', 'AU'],
    description:
      'Automated SEO optimization using AI for keyword research, content optimization, technical SEO fixes, and schema markup implementation.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />

      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/assets/logo.png" alt="XenlixAI Logo" width={160} height={50} />
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/plans" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI-Powered SEO Automation for Small Business
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stop spending hours on SEO tasks. Our AI handles keyword research, content optimization,
            technical fixes, and schema markup automatically - while you focus on growing your
            business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plans"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Get SEO Audit
            </Link>
            <Link
              href="#how-it-works"
              className="border border-purple-400 text-purple-400 font-bold py-4 px-8 rounded-lg hover:bg-purple-400 hover:text-white transition-all duration-200"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">How AI SEO Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Automated Keyword Research</h3>
              <p className="text-gray-300">
                AI analyzes your business, competitors, and market to identify high-impact keywords
                with low competition. No more guessing or manual research.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Schema Markup Automation</h3>
              <p className="text-gray-300 mb-3">
                Automatically implements JSON-LD structured data for rich snippets, FAQ pages,
                products, and local business information.
              </p>
              <p className="text-gray-300">
                Try our{' '}
                <Link
                  href="/tools/json-ld"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  JSON-LD schema generator tool
                </Link>{' '}
                to see the power of structured data in action.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Technical SEO Fixes</h3>
              <p className="text-gray-300">
                Identifies and fixes Core Web Vitals issues, broken links, missing meta tags,
                sitemap errors, and indexing problems automatically.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Content Gap Analysis</h3>
              <p className="text-gray-300">
                AI discovers content opportunities by analyzing competitor strategies and
                identifying topics your audience searches for but you haven't covered.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Real-time Performance Monitoring
              </h3>
              <p className="text-gray-300">
                Tracks rankings, organic traffic, and conversions 24/7. AI automatically adjusts
                strategies based on performance data and algorithm changes.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Local SEO Optimization</h3>
              <p className="text-gray-300">
                Optimizes Google Business Profile, local citations, review management, and
                location-specific content for improved local search visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                How does AI SEO automation work?
              </h3>
              <p className="text-gray-300">
                AI SEO automation uses machine learning to analyze your website, research keywords,
                optimize content, implement schema markup, and fix technical SEO issues
                automatically. It monitors search rankings and adjusts strategies in real-time based
                on performance data and search engine algorithm changes.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                Can AI SEO really replace manual SEO work?
              </h3>
              <p className="text-gray-300 mb-3">
                For most small businesses, yes! AI handles 80% of SEO tasks faster and more
                accurately than manual work. It excels at technical SEO, keyword research, content
                optimization, and continuous monitoring - freeing you to focus on business growth
                instead of technical details.
              </p>
              <p className="text-gray-300">
                <Link
                  href="/calculators/pricing"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Calculate your potential SEO savings
                </Link>{' '}
                to see how much time and money AI automation can save your business.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                How long does AI SEO take to show results?
              </h3>
              <p className="text-gray-300">
                Most businesses see initial improvements in search visibility within 4-6 weeks.
                Significant ranking improvements typically occur within 3-4 months as AI
                optimizations compound and search engines index the changes. The key is consistency
                - AI works 24/7 while you sleep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Automate Your SEO?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of businesses using AI to dominate search results while saving 20+ hours
            per week.
          </p>
          <Link
            href="/plans"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 inline-block"
          >
            Start Free SEO Audit
          </Link>
        </div>
      </section>
    </div>
  );
}
