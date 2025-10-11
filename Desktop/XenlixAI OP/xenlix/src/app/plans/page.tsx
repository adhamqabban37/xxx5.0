import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XenlixAI Pricing Plans | AI Marketing Automation Pricing',
  description:
    'Choose your AI marketing plan: Basic ($29), Pro ($79), or Growth ($199). Get AI websites, SEO automation & ad creation. 14-day free trial!',
  keywords: 'AI marketing pricing, XenlixAI plans, AI automation cost, AI website builder pricing',
};

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$29',
    period: '/month',
    description: 'Perfect for small businesses just starting with AI visibility',
    features: [
      'Basic AEO optimization',
      'Google AI search visibility',
      'Monthly performance reports',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/month',
    description: 'Ideal for growing businesses ready to dominate AI search',
    features: [
      'Advanced AEO optimization',
      'Multi-platform AI visibility (ChatGPT, Gemini, Copilot)',
      'AI-powered ad campaign guidance',
      'Weekly performance reports',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$199',
    period: '/month',
    description: 'For businesses scaling with comprehensive AI marketing',
    features: [
      'Premium AEO optimization',
      'Full AI ecosystem coverage',
      'Custom AI ad strategy',
      'Real-time analytics dashboard',
      'Dedicated account manager',
      'White-label reports',
    ],
  },
];

export default function PlansPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'XenlixAI Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Basic Plan',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'RecurringCharge',
          frequency: 'monthly',
        },
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '79',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'RecurringCharge',
          frequency: 'monthly',
        },
      },
      {
        '@type': 'Offer',
        name: 'Growth Plan',
        price: '199',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'RecurringCharge',
          frequency: 'monthly',
        },
      },
    ],
    featureList: [
      'AI Website Builder',
      'SEO Automation',
      'Ad Campaign Creator',
      'Analytics Dashboard',
      'Multi-platform AI Visibility',
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Pricing Plans</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Choose Your Plan</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            Scale your business visibility in the AI era with our Answer Engine Optimization and AI
            advertising solutions
          </p>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Not sure which plan is right for you?{' '}
            <Link
              href="/calculators/pricing"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Calculate your ROI
            </Link>{' '}
            to find the perfect fit.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-8 ${
                plan.popular ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-300 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout?plan=${plan.id}`}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Select Plan
              </Link>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <p className="text-sm text-gray-500">
            Need a custom plan?{' '}
            <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Contact us</span>
          </p>
        </div>
      </div>
    </div>
  );
}
