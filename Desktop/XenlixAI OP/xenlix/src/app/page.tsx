import Link from "next/link";
import { Metadata } from "next";
import Testimonials from "./(components)/Testimonials";
import LogoRow from "./(components)/LogoRow";
import JsonLd from "./(components)/JsonLd";
import WebsiteBuilderButton from "../components/WebsiteBuilderButton";
import Hero3D from "../components/Hero3D";
import { orgAggregateRatingJsonLd, calculateAggregateRating } from "./(lib)/schema";

// Testimonials data for schema calculation
const testimonials = [
  { rating: 5 }, { rating: 5 }, { rating: 5 }, 
  { rating: 5 }, { rating: 5 }, { rating: 5 }
];

export const metadata: Metadata = {
  title: "XenlixAI | Get Found in ChatGPT & AI Search Engines - Free AEO Audit",
  description: "Free AEO (Answer Engine Optimization) audit reveals why your website isn't appearing in ChatGPT, Claude, Perplexity & AI search engines. Get your AI visibility score + actionable fixes in 60 seconds.",
  keywords: "AEO audit, answer engine optimization, ChatGPT SEO, AI search optimization, free website audit, AI visibility, get found in AI search",
  openGraph: {
    title: "XenlixAI | Get Found in ChatGPT & AI Search Engines - Free AEO Audit",
    description: "Free AEO (Answer Engine Optimization) audit reveals why your website isn't appearing in ChatGPT, Claude, Perplexity & AI search engines. Get your AI visibility score + actionable fixes in 60 seconds.",
    type: "website",
    url: "/",
    siteName: "XenlixAI",
    images: [
      {
        url: "/og-homepage.jpg",
        width: 1200,
        height: 630,
        alt: "XenlixAI - Answer Engine Optimization for AI Search Visibility"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "XenlixAI | Get Found in ChatGPT & AI Search Engines - Free AEO Audit",
    description: "Free AEO (Answer Engine Optimization) audit reveals why your website isn't appearing in ChatGPT, Claude, Perplexity & AI search engines. Get your AI visibility score + actionable fixes in 60 seconds.",
    images: ["/twitter-homepage.jpg"]
  },
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  const { average, count } = calculateAggregateRating(testimonials);
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is XenlixAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "XenlixAI is an AI-powered SEO automation platform that helps businesses optimize their websites, improve search rankings, and get found in Google, ChatGPT, Gemini, and other AI search engines."
        }
      },
      {
        "@type": "Question",
        "name": "Who is XenlixAI for?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Small to medium businesses, startups, and entrepreneurs looking to improve their SEO rankings and organic traffic with AI-powered automation."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI SEO automation work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI analyzes your website, performs keyword research, fixes technical SEO issues, optimizes content, and implements schema markup automatically to improve your search engine rankings."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <JsonLd data={faqSchema} id="faq-schema" />
      <JsonLd data={orgAggregateRatingJsonLd(average, count)} id="aggregate-rating-schema" />
      
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            XenlixAI
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link href="/ai-seo-automation" className="text-gray-300 hover:text-white transition-colors">
              SEO Services
            </Link>
            <Link href="/seo-analyzer" className="text-gray-300 hover:text-white transition-colors">
              SEO Analyzer
            </Link>
            <Link href="/case-studies" className="text-gray-300 hover:text-white transition-colors">
              Case Studies
            </Link>
            <Link href="/plans" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* 3D Hero Section */}
      <Hero3D />

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            What Our Free Scan Reveals
          </h2>
          <p className="text-xl text-gray-300 text-center mb-16">
            Most businesses are shocked by what they discover in their first scan
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-red-900/30 backdrop-blur-sm border border-red-600 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Missing from AI Engines</h3>
              <p className="text-gray-300">
                <span className="text-red-400 font-bold">87% of websites</span> aren't optimized for ChatGPT, Claude, or Perplexity. Your competitors are already ahead.
              </p>
            </div>
            
            <div className="bg-orange-900/30 backdrop-blur-sm border border-orange-600 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Technical SEO Errors</h3>
              <p className="text-gray-300">
                <span className="text-orange-400 font-bold">Page speed issues, broken links, missing meta tags</span> are killing your Google rankings right now.
              </p>
            </div>
            
            <div className="bg-yellow-900/30 backdrop-blur-sm border border-yellow-600 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Local SEO Gaps</h3>
              <p className="text-gray-300">
                <span className="text-yellow-400 font-bold">Local customers can't find you</span> because your Google My Business and local citations are incomplete.
              </p>
            </div>
            
            <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-600 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Content Problems</h3>
              <p className="text-gray-300">
                <span className="text-purple-400 font-bold">Thin content and missing keywords</span> mean you're invisible for searches your customers are making.
              </p>
            </div>
          </div>
          
          {/* Problem/Solution CTA */}
          <div className="mt-16 bg-gradient-to-r from-red-600/20 to-blue-600/20 border border-red-500 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Don't Let These Issues Cost You More Customers
            </h3>
            <p className="text-gray-300 mb-6">
              Every day you wait, competitors are stealing potential customers who can't find you online.
            </p>
            <Link
              href="/aeo"
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 px-8 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 inline-block text-lg shadow-xl"
            >
              Find My Website's Weak Points →
            </Link>
          </div>
          
          {/* Website Builder CTA */}
          <WebsiteBuilderButton />
        </div>
      </section>

      {/* Logo Row */}
      <LogoRow />

      {/* Testimonials */}
      <Testimonials />

      {/* Local Services */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Local AI Marketing Services
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We help businesses dominate local AI search results and grow their customer base
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link 
              href="/dallas"
              className="group bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-200">
                Dallas AI Marketing
              </h3>
              <p className="text-gray-300 mb-4">
                Answer-Engine Optimization + AI ads for Dallas businesses. Get found in ChatGPT, Gemini, and Copilot.
              </p>
              <div className="text-blue-400 font-medium group-hover:text-blue-200">
                Learn More →
              </div>
            </Link>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6">
              <div className="text-3xl mb-4">🌎</div>
              <h3 className="text-xl font-bold text-white mb-3">
                More Cities Coming
              </h3>
              <p className="text-gray-300 mb-4">
                Houston, Austin, San Antonio, and more markets launching soon.
              </p>
              <div className="text-gray-400">
                Stay tuned
              </div>
            </div>

            <Link 
              href="/case-studies"
              className="group bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 hover:from-green-700 hover:to-teal-700 transition-all duration-300"
            >
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-200">
                Local Success Stories
              </h3>
              <p className="text-gray-300 mb-4">
                See how local businesses tripled leads with AI marketing and answer-engine optimization.
              </p>
              <div className="text-green-400 font-medium group-hover:text-green-200">
                View Case Studies →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Stop Losing Customers to Hidden Website Problems
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Every day you wait, competitors are capturing customers who can't find you online. Our free scan reveals exactly what's costing you business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/aeo"
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 px-8 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 inline-block text-lg shadow-xl"
            >
              🚨 Find My Website Problems
            </Link>
            <Link
              href="/case-studies"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-block text-lg"
            >
              See Success Stories
            </Link>
          </div>
          
          {/* Risk-free guarantee */}
          <div className="mt-8 p-4 bg-green-900/20 border border-green-600 rounded-lg inline-block">
            <p className="text-green-400 font-semibold">
              ✅ Free scan reveals problems in under 60 seconds
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
