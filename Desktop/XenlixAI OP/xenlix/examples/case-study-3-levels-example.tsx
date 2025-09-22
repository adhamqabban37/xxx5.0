import { Metadata } from 'next';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import VisualBreadcrumbs from '../components/VisualBreadcrumbs';

export const metadata: Metadata = {
  title: "Auto Detailing Dallas Case Study | AI Marketing Success Story - XenlixAI",
  description: "Discover how a Dallas auto detailing business increased leads by 300% using XenlixAI's Answer Engine Optimization and AI marketing automation.",
  robots: "index, follow",
  alternates: {
    canonical: "/case-studies/auto-detailing-dallas"
  }
};

export default function CaseStudyExample() {
  // Custom breadcrumbs with better naming
  const customBreadcrumbs = [
    { name: 'Home', url: '/', position: 1 },
    { name: 'Success Stories', url: '/case-studies', position: 2 },
    { name: 'Auto Detailing Dallas', url: '/case-studies/auto-detailing-dallas', position: 3 }
  ];

  return (
    <>
      {/* Breadcrumb Schema + WebPage Schema */}
      <BreadcrumbSchema 
        customBreadcrumbs={customBreadcrumbs}
        webPageProps={{
          name: "Auto Detailing Dallas Case Study | XenlixAI Success Stories",
          description: "Discover how a Dallas auto detailing business increased leads by 300% using XenlixAI's Answer Engine Optimization and AI marketing automation.",
          datePublished: "2024-02-15",
          dateModified: "2024-09-21",
          author: {
            "@type": "Organization",
            "@id": "https://xenlix.ai#organization"
          },
          publisher: {
            "@type": "Organization",
            "@id": "https://xenlix.ai#organization"
          }
        }}
      />

      {/* Visual Breadcrumbs */}
      <VisualBreadcrumbs customBreadcrumbs={customBreadcrumbs} />

      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              Success Story
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Auto Detailing Dallas: 300% Lead Increase
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              How a local auto detailing business transformed their online presence and tripled their leads with AI marketing automation.
            </p>
          </div>

          {/* Results Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">300%</div>
                <div className="text-gray-600">Lead Increase</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">150%</div>
                <div className="text-gray-600">Revenue Growth</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">85%</div>
                <div className="text-gray-600">Cost Reduction</div>
              </div>
            </div>
          </div>

          {/* Case Study Content */}
          <div className="prose prose-lg max-w-none">
            <h2>The Challenge</h2>
            <p>
              Dallas Auto Detailing Plus was struggling to compete in the crowded Dallas market. 
              Their website wasn't appearing in AI search results, and they were losing potential 
              customers to competitors who had better online visibility.
            </p>

            <h2>The Solution</h2>
            <p>
              XenlixAI implemented a comprehensive Answer Engine Optimization strategy:
            </p>
            <ul>
              <li>AI-optimized content for ChatGPT and Claude visibility</li>
              <li>Local SEO optimization for Dallas auto detailing keywords</li>
              <li>Structured data implementation for rich snippets</li>
              <li>Automated social media marketing campaigns</li>
            </ul>

            <h2>The Results</h2>
            <p>
              Within 90 days, Dallas Auto Detailing Plus saw transformational results that 
              exceeded all expectations and set new benchmarks in their industry.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}