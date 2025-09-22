import { Metadata } from 'next';
import BreadcrumbSchema from '../../../components/BreadcrumbSchema';
import VisualBreadcrumbs from '../../../components/VisualBreadcrumbs';

export const metadata: Metadata = {
  title: "ROI Calculator | Business Investment ROI Calculator - XenlixAI",
  description: "Calculate your marketing ROI and business investment returns with our free calculator. Make data-driven decisions for your marketing campaigns.",
  robots: "index, follow",
  alternates: {
    canonical: "/calculators/roi"
  }
};

export default function ROICalculatorExample() {
  // Custom breadcrumbs for better UX
  const customBreadcrumbs = [
    { name: 'Home', url: '/', position: 1 },
    { name: 'Business Tools', url: '/calculators', position: 2 },
    { name: 'ROI Calculator', url: '/calculators/roi', position: 3 }
  ];

  return (
    <>
      {/* Breadcrumb Schema + WebPage Schema */}
      <BreadcrumbSchema 
        customBreadcrumbs={customBreadcrumbs}
        webPageProps={{
          name: "ROI Calculator | XenlixAI Business Tools",
          description: "Calculate your marketing ROI and business investment returns with our free calculator. Make data-driven decisions for your marketing campaigns.",
          datePublished: "2024-01-15",
          dateModified: new Date().toISOString().split('T')[0],
          author: {
            "@type": "Organization", 
            "@id": "https://xenlix.ai#organization"
          }
        }}
      />

      {/* Visual Breadcrumbs with custom items */}
      <VisualBreadcrumbs customBreadcrumbs={customBreadcrumbs} />

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ROI Calculator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Calculate your return on investment for marketing campaigns, business tools, and strategic initiatives.
            </p>
          </div>

          {/* ROI Calculator Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Investment Details</h2>
                {/* Calculator inputs would go here */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Investment ($)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Return ($)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="15,000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">ROI Results</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">50%</div>
                    <div className="text-gray-600">Return on Investment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}