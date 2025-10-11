import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Website Builder | One-Click Business Websites | XenlixAI',
  description:
    'Build professional websites in minutes with AI. One-click builder includes mobile optimization, SEO templates & custom branding. No coding needed!',
  keywords:
    'AI website builder, one-click website builder, business website creator, mobile optimization, SEO templates',
};

export default function AIWebsiteBuilderPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'XenlixAI Website Builder',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '29',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'RecurringCharge',
        frequency: 'monthly',
      },
    },
    featureList: [
      'AI Website Builder',
      'Mobile Optimization',
      'SEO-Ready Templates',
      'Custom Branding',
      'E-commerce Integration',
    ],
    description:
      'AI-powered website builder that creates professional business websites in minutes with automatic mobile optimization and SEO.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />

      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            XenlixAI
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link
              href="/ai-seo-automation"
              className="text-gray-300 hover:text-white transition-colors"
            >
              SEO Automation
            </Link>
            <Link href="/plans" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            One-Click AI Website Builder for Business
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Build professional websites in minutes, not weeks. Our AI creates stunning,
            mobile-optimized sites with built-in SEO, custom branding, and e-commerce ready
            features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plans"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Build Website Now
            </Link>
            <Link
              href="#features"
              className="border border-purple-400 text-purple-400 font-bold py-4 px-8 rounded-lg hover:bg-purple-400 hover:text-white transition-all duration-200"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Everything You Need in One Platform
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Design Generator</h3>
              <p className="text-gray-300">
                AI analyzes your business and creates custom designs, layouts, and color schemes
                that match your brand perfectly.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Mobile Optimization</h3>
              <p className="text-gray-300">
                Every website is automatically optimized for mobile devices with responsive design
                and fast loading speeds.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">SEO-Ready Templates</h3>
              <p className="text-gray-300 mb-3">
                Built-in SEO optimization with meta tags, schema markup, fast loading, and search
                engine friendly structure.
              </p>
              <p className="text-gray-300">
                Generate professional{' '}
                <Link
                  href="/tools/json-ld"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  schema markup
                </Link>{' '}
                and see our{' '}
                <Link href="/plans" className="text-green-400 hover:text-green-300 underline">
                  pricing plans
                </Link>{' '}
                for complete website automation.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Custom Branding</h3>
              <p className="text-gray-300">
                Upload your logo, choose colors, and customize fonts. AI ensures consistent branding
                across all pages.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">E-commerce Integration</h3>
              <p className="text-gray-300">
                Built-in shopping cart, payment processing, inventory management, and order tracking
                for online stores.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Content Management</h3>
              <p className="text-gray-300">
                Easy content updates, blog management, and AI-powered content suggestions to keep
                your site fresh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Build Your Website in 3 Simple Steps
          </h2>
          <div className="space-y-12">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Tell AI About Your Business</h3>
                <p className="text-gray-300 text-lg">
                  Answer a few questions about your business, industry, and goals. Our AI uses this
                  to create a personalized website that matches your brand.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">AI Builds Your Site</h3>
                <p className="text-gray-300 text-lg">
                  Watch as AI creates your professional website with custom design, optimized
                  content, mobile responsiveness, and built-in SEO - all in under 5 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Launch & Grow</h3>
                <p className="text-gray-300 text-lg">
                  Your website goes live instantly with hosting included. AI continues optimizing
                  performance, SEO, and user experience automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Build Your Professional Website?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of businesses who built stunning websites in minutes, not months.
          </p>
          <Link
            href="/plans"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 inline-block"
          >
            Start Building Now
          </Link>
          <p className="text-gray-400 mt-4">
            No coding required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
