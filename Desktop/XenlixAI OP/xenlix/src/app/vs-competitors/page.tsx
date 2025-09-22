import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "XenlixAI vs Competitors | AI Marketing Compare | XenlixAI",
  description: "Compare XenlixAI vs Jasper AI vs SurferSEO vs Writesonic. See features, pricing, and which AI marketing platform is best for your business needs.",
  keywords: "XenlixAI vs Jasper, AI marketing comparison, SurferSEO alternative, best AI marketing platform",
};

export default function CompetitorComparisonPage() {
  const comparisonSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "XenlixAI vs Competitors: Complete Feature Comparison",
    "description": "Detailed comparison of XenlixAI against Jasper AI, SurferSEO, and other AI marketing platforms.",
    "author": {
      "@type": "Organization",
      "name": "XenlixAI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "XenlixAI"
    }
  };

  const competitors = [
    {
      name: "XenlixAI",
      logo: "🚀",
      pricing: "$29-199/mo",
      features: {
        websiteBuilder: "✅ One-click AI builder",
        seoAutomation: "✅ Full automation",
        adCreation: "✅ Multi-platform",
        analytics: "✅ Real-time dashboard",
        support: "✅ Priority support",
        integration: "✅ All-in-one platform"
      },
      pros: [
        "Complete marketing automation suite",
        "Most affordable for full feature set",
        "True one-click website builder",
        "Built for small businesses",
        "No technical knowledge required"
      ],
      cons: [
        "Newer platform (less brand recognition)",
        "Focused on SMBs vs enterprise"
      ],
      bestFor: "Small businesses wanting complete marketing automation"
    },
    {
      name: "Jasper AI",
      logo: "✏️",
      pricing: "$49-125/mo",
      features: {
        websiteBuilder: "❌ Content only",
        seoAutomation: "⚠️ Limited",
        adCreation: "✅ Copy only",
        analytics: "❌ No analytics",
        support: "⚠️ Chat only",
        integration: "⚠️ Content focus"
      },
      pros: [
        "Excellent long-form content",
        "Strong brand recognition",
        "Good for copywriting"
      ],
      cons: [
        "No website building",
        "Limited SEO features",
        "Higher cost for features",
        "Requires other tools"
      ],
      bestFor: "Content creators and copywriters"
    },
    {
      name: "SurferSEO",
      logo: "🏄",
      pricing: "$89-239/mo",
      features: {
        websiteBuilder: "❌ SEO only",
        seoAutomation: "✅ Advanced SEO",
        adCreation: "❌ No ad tools",
        analytics: "⚠️ SEO focused",
        support: "✅ Good support",
        integration: "⚠️ SEO tools only"
      },
      pros: [
        "Advanced SEO analysis",
        "Great content optimization",
        "Detailed SERP analysis"
      ],
      cons: [
        "SEO only, no other marketing",
        "Expensive for single feature",
        "Steep learning curve",
        "No website building"
      ],
      bestFor: "SEO specialists and agencies"
    },
    {
      name: "Writesonic",
      logo: "🎯",
      pricing: "$16-499/mo",
      features: {
        websiteBuilder: "❌ Content only",
        seoAutomation: "⚠️ Basic",
        adCreation: "✅ Good ad copy",
        analytics: "❌ No analytics",
        support: "⚠️ Limited",
        integration: "⚠️ Content focus"
      },
      pros: [
        "Good ad copywriting",
        "Affordable entry pricing",
        "Multiple content types"
      ],
      cons: [
        "No website building",
        "Limited automation",
        "Basic SEO features",
        "Requires multiple tools"
      ],
      bestFor: "Freelancers and content creators"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(comparisonSchema),
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
            <Link href="/ai-seo-automation" className="text-gray-300 hover:text-white transition-colors">
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
            XenlixAI vs Competitors: Complete Feature Comparison
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            See how XenlixAI stacks up against Jasper AI, SurferSEO, Writesonic, and other AI marketing platforms. Find the best solution for your business needs.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Feature Comparison Matrix
          </h2>
          
          {/* Mobile-friendly cards for each competitor */}
          <div className="grid lg:grid-cols-2 gap-8">
            {competitors.map((competitor, index) => (
              <div key={index} className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-8 ${
                competitor.name === 'XenlixAI' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-700'
              }`}>
                {competitor.name === 'XenlixAI' && (
                  <div className="text-center mb-4">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">{competitor.logo}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{competitor.name}</h3>
                  <p className="text-purple-400 font-bold text-lg">{competitor.pricing}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Website Builder</span>
                    <span className="text-sm text-gray-300">{competitor.features.websiteBuilder}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">SEO Automation</span>
                    <span className="text-sm text-gray-300">{competitor.features.seoAutomation}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Ad Creation</span>
                    <span className="text-sm text-gray-300">{competitor.features.adCreation}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Analytics</span>
                    <span className="text-sm text-gray-300">{competitor.features.analytics}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Support</span>
                    <span className="text-sm text-gray-300">{competitor.features.support}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Integration</span>
                    <span className="text-sm text-gray-300">{competitor.features.integration}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-bold text-white mb-3">Pros</h4>
                  <ul className="space-y-2">
                    {competitor.pros.map((pro, proIndex) => (
                      <li key={proIndex} className="flex items-start text-green-400">
                        <span className="mr-2">+</span>
                        <span className="text-sm">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-bold text-white mb-3">Cons</h4>
                  <ul className="space-y-2">
                    {competitor.cons.map((con, conIndex) => (
                      <li key={conIndex} className="flex items-start text-red-400">
                        <span className="mr-2">-</span>
                        <span className="text-sm">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <h4 className="text-lg font-bold text-white mb-2">Best For</h4>
                  <p className="text-gray-300 text-sm">{competitor.bestFor}</p>
                </div>

                {competitor.name === 'XenlixAI' && (
                  <div className="mt-6">
                    <Link
                      href="/plans"
                      className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                    >
                      Start Free Trial
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Scenarios */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Which Platform is Right for You?
          </h2>
          
          <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Small Business Owner</h3>
              <p className="text-gray-300 mb-4">
                <strong>Recommendation: XenlixAI</strong> - You need a complete marketing solution that handles everything from website creation to ad campaigns. XenlixAI provides the most value with all features in one affordable platform.
              </p>
              <div className="text-sm text-gray-400">
                Alternative: Multiple tools (expensive and complex to manage)
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Content Creator / Blogger</h3>
              <p className="text-gray-300 mb-4">
                <strong>Recommendation: Jasper AI</strong> - If you only need content writing and have other tools for website/SEO, Jasper excels at long-form content creation.
              </p>
              <div className="text-sm text-gray-400">
                Alternative: XenlixAI for complete business presence beyond just content
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">SEO Agency / Specialist</h3>
              <p className="text-gray-300 mb-4">
                <strong>Recommendation: SurferSEO</strong> - Deep SEO analysis and optimization tools for professionals who live and breathe SEO.
              </p>
              <div className="text-sm text-gray-400">
                Alternative: XenlixAI for agencies serving small business clients who need full marketing
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Startup / Entrepreneur</h3>
              <p className="text-gray-300 mb-4">
                <strong>Recommendation: XenlixAI</strong> - You need to move fast and build a complete online presence quickly. XenlixAI automates everything so you can focus on product and customers.
              </p>
              <div className="text-sm text-gray-400">
                Alternative: Building piecemeal with multiple tools (slower and more expensive)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Choose the Best AI Marketing Platform?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            See why thousands of businesses choose XenlixAI for complete marketing automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plans"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Try XenlixAI Free
            </Link>
            <Link
              href="/case-studies"
              className="border border-purple-400 text-purple-400 font-bold py-4 px-8 rounded-lg hover:bg-purple-400 hover:text-white transition-all duration-200"
            >
              See Success Stories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}