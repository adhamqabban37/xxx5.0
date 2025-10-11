'use client';

import Link from 'next/link';
import { Calculator, TrendingUp, DollarSign, BarChart3, Target, Zap } from 'lucide-react';

const calculators = [
  {
    title: 'ROI Calculator',
    description: 'Calculate your potential return on investment from AI marketing automation',
    href: '/calculators/roi',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    features: [
      'Revenue projections',
      'Cost savings analysis',
      'Payback period',
      'Growth forecasting',
    ],
  },
  {
    title: 'Pricing Calculator',
    description: 'Get personalized pricing recommendations based on your business needs',
    href: '/calculators/pricing',
    icon: DollarSign,
    color: 'from-blue-500 to-cyan-600',
    features: ['Custom quotes', 'Feature comparison', 'Budget planning', 'Upgrade paths'],
  },
];

const benefits = [
  {
    icon: BarChart3,
    title: 'Data-Driven Decisions',
    description: 'Make informed choices with accurate calculations based on real industry data',
  },
  {
    icon: Target,
    title: 'Precision Planning',
    description:
      'Plan your marketing budget and timeline with confidence using our forecasting tools',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get immediate insights without waiting for consultations or manual calculations',
  },
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-blue-800/30 to-transparent pointer-events-none"></div>

      <div className="relative z-10 min-h-screen">
        {/* Header Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium mb-6">
              <Calculator className="w-4 h-4" />
              Business Calculators
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Smart Business
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {' '}
                Calculators
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Make data-driven decisions with our AI-powered calculators. Get instant insights into
              ROI, pricing, and business growth potential with precise calculations tailored to your
              industry.
            </p>
          </div>
        </section>

        {/* Calculator Cards */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {calculators.map((calc, index) => (
                <div
                  key={index}
                  className="group relative bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden hover:bg-slate-800/50 hover:border-cyan-500/50 transition-all duration-500"
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${calc.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
                  ></div>

                  <div className="relative p-8">
                    {/* Icon */}
                    <div
                      className={`inline-flex p-4 bg-gradient-to-br ${calc.color} rounded-xl mb-6 shadow-lg`}
                    >
                      <calc.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                      {calc.title}
                    </h3>

                    <p className="text-gray-400 mb-6 leading-relaxed">{calc.description}</p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-8">
                      {calc.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2 text-sm text-gray-300"
                        >
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Link
                      href={calc.href}
                      className="inline-flex items-center gap-2 w-full justify-center px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 transform group-hover:scale-105 font-semibold"
                    >
                      <Calculator className="w-5 h-5" />
                      Try {calc.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Use Our Calculators?
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Get accurate, actionable insights that help you make confident business decisions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex p-4 bg-cyan-500/20 rounded-xl mb-6 group-hover:bg-cyan-500/30 transition-colors">
                    <benefit.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{benefit.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Calculate Your Success?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Start with our ROI calculator to see how AI marketing automation can transform your
                business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/calculators/roi"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 font-semibold"
                >
                  <TrendingUp className="w-5 h-5" />
                  Calculate ROI
                </Link>

                <Link
                  href="/plans"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800/50 text-white border border-slate-600 rounded-xl hover:bg-slate-800/70 transition-colors font-semibold"
                >
                  View Pricing Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
