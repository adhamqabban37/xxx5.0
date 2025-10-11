'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Home,
  ArrowLeft,
  FileText,
  Calculator,
  Building2,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Extract potential intent from the broken URL
  const getUrlSuggestions = (path: string) => {
    const suggestions = [];

    // Common path patterns and their fixes
    if (path.includes('calculator')) {
      suggestions.push({
        title: 'ROI Calculator',
        href: '/calculators/roi',
        description: 'Calculate your marketing ROI and potential savings',
        icon: Calculator,
      });
      suggestions.push({
        title: 'Pricing Calculator',
        href: '/calculators/pricing',
        description: 'Get personalized pricing for your business needs',
        icon: Calculator,
      });
    }

    if (path.includes('tool') || path.includes('json') || path.includes('schema')) {
      suggestions.push({
        title: 'JSON-LD Schema Generator',
        href: '/tools/json-ld',
        description: 'Generate structured data markup for better SEO',
        icon: FileText,
      });
    }

    if (path.includes('seo') || path.includes('audit') || path.includes('analysis')) {
      suggestions.push({
        title: 'SEO Audit Tool',
        href: '/seo/audit',
        description: 'Get comprehensive SEO analysis for your website',
        icon: Search,
      });
      suggestions.push({
        title: 'AEO Audit Tool',
        href: '/aeo',
        description: 'Optimize for AI search engines and voice queries',
        icon: Search,
      });
    }

    if (path.includes('business') || path.includes('dallas') || path.includes('city')) {
      suggestions.push({
        title: 'Dallas SEO Services',
        href: '/dallas',
        description: 'Local SEO optimization for Dallas businesses',
        icon: Building2,
      });
    }

    if (path.includes('plan') || path.includes('pricing') || path.includes('checkout')) {
      suggestions.push({
        title: 'Pricing Plans',
        href: '/plans',
        description: 'Choose the perfect plan for your business growth',
        icon: FileText,
      });
    }

    if (path.includes('case') || path.includes('study') || path.includes('example')) {
      suggestions.push({
        title: 'Case Studies',
        href: '/case-studies',
        description: 'See real results from our client success stories',
        icon: FileText,
      });
    }

    return suggestions;
  };

  // Get contextual suggestions based on the broken URL
  const suggestions = getUrlSuggestions(pathname);

  // Popular destinations for when no contextual matches
  const popularPages = [
    {
      title: 'SEO Audit Tool',
      href: '/seo/audit',
      description: 'Free comprehensive website analysis',
      icon: Search,
    },
    {
      title: 'AEO Optimization',
      href: '/aeo',
      description: 'AI Answer Engine optimization',
      icon: Search,
    },
    {
      title: 'ROI Calculator',
      href: '/calculators/roi',
      description: 'Calculate marketing ROI potential',
      icon: Calculator,
    },
    {
      title: 'Pricing Plans',
      href: '/plans',
      description: 'Find the right plan for your business',
      icon: FileText,
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Route to a search or contact page with the query
      router.push(`/contact?message=${encodeURIComponent(`I was looking for: ${searchQuery}`)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-blue-800/20 to-transparent pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Error display */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>

          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-300 mb-2">Page Not Found</h2>
          <p className="text-gray-400 mb-2">
            The page{' '}
            <code className="bg-slate-800/50 px-2 py-1 rounded text-cyan-400">{pathname}</code>{' '}
            doesn't exist.
          </p>
          <p className="text-gray-500 text-sm">
            Don't worry - we'll help you find what you're looking for.
          </p>
        </div>

        {/* Search functionality */}
        <div className="mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-white">Can't find what you need?</h3>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Tell us what you were looking for..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>

        {/* Contextual suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Based on your URL, you might be looking for:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion, index) => (
                <Link
                  key={index}
                  href={suggestion.href}
                  className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/50 hover:border-cyan-500/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                      <suggestion.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {suggestion.title}
                      </h4>
                      <p className="text-gray-400 text-sm">{suggestion.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular destinations */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6">
            {suggestions.length > 0 ? 'Or explore our popular tools:' : 'Try our popular tools:'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularPages.map((page, index) => (
              <Link
                key={index}
                href={page.href}
                className="group bg-slate-800/20 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/40 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="text-center">
                  <div className="inline-flex p-3 bg-cyan-500/10 rounded-lg mb-4 group-hover:bg-cyan-500/20 transition-colors">
                    <page.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {page.title}
                  </h4>
                  <p className="text-gray-400 text-sm">{page.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 text-white border border-slate-600 rounded-lg hover:bg-slate-800/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 text-white border border-slate-600 rounded-lg hover:bg-slate-800/70 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Contact Support
          </Link>
        </div>

        {/* Technical info for developers */}
        <div className="mt-12 text-center">
          <details className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-left">
            <summary className="text-gray-400 cursor-pointer hover:text-white transition-colors">
              Technical Details
            </summary>
            <div className="mt-4 space-y-2 text-sm font-mono">
              <div className="text-gray-400">
                <span className="text-cyan-400">Path:</span> {pathname}
              </div>
              <div className="text-gray-400">
                <span className="text-cyan-400">Status:</span> 404 Not Found
              </div>
              <div className="text-gray-400">
                <span className="text-cyan-400">Suggestions:</span> {suggestions.length} contextual
                matches found
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
