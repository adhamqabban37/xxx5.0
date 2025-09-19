'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle, Shield, Clock, TrendingUp, Users, DollarSign, AlertTriangle, X } from 'lucide-react';

interface PlanFeature {
  feature: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  interval: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: 'premium',
    name: 'Premium SEO + AEO',
    price: '$97',
    originalPrice: '$197',
    interval: 'month',
    description: 'Everything you need to dominate local search and answer engine optimization',
    popular: true,
    cta: 'Start Growing Today',
    features: [
      { feature: 'Full AEO Audit & Implementation', included: true },
      { feature: 'Local SEO Optimization', included: true },
      { feature: 'Schema Markup Generation', included: true },
      { feature: 'City Page Generation', included: true },
      { feature: 'Competitor Analysis', included: true },
      { feature: 'Monthly Reporting', included: true },
      { feature: '24/7 Support', included: true },
      { feature: 'ROI Guarantee', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$297',
    interval: 'month',
    description: 'For businesses with multiple locations or complex needs',
    cta: 'Scale Your Business',
    features: [
      { feature: 'Everything in Premium', included: true },
      { feature: 'Multi-location Management', included: true },
      { feature: 'Custom Integrations', included: true },
      { feature: 'Dedicated Account Manager', included: true },
      { feature: 'White-label Reports', included: true },
      { feature: 'API Access', included: true },
      { feature: 'Priority Support', included: true },
      { feature: 'Custom Training', included: true },
    ]
  }
];

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams.get('plan') || 'premium';
  const [selectedPlan, setSelectedPlan] = useState(selectedPlanId);
  const [showGuarantee, setShowGuarantee] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
    website: ''
  });

  const currentPlan = plans.find(plan => plan.id === selectedPlan) || plans[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          customerInfo: formData
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-white font-semibold text-lg">XenlixAI</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trust Indicators */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Limited Time: 50% Off</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Growth Plan
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Join thousands of businesses already dominating their local markets with AI-powered SEO and AEO
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan Selection */}
          <div className="lg:col-span-2">
            <div className="grid gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border transition-all cursor-pointer ${
                    selectedPlan === plan.id
                      ? 'border-blue-400 bg-white/20 scale-105'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-8">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-white/70 mb-4">{plan.description}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                        {plan.originalPrice && (
                          <span className="text-xl text-white/50 line-through">{plan.originalPrice}</span>
                        )}
                        <span className="text-white/70">/{plan.interval}</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      selectedPlan === plan.id
                        ? 'border-blue-400 bg-blue-400'
                        : 'border-white/40'
                    }`}>
                      {selectedPlan === plan.id && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-white/90 text-sm">{feature.feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Form */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">{currentPlan.name}</span>
                  <span className="text-white font-semibold">{currentPlan.price}/{currentPlan.interval}</span>
                </div>
                {currentPlan.originalPrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400">Discount (50% off)</span>
                    <span className="text-green-400">-$100</span>
                  </div>
                )}
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-white font-bold text-xl">{currentPlan.price}/{currentPlan.interval}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <span className="text-xs text-white/70">Instant Setup</span>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <span className="text-xs text-white/70">Proven Results</span>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <span className="text-xs text-white/70">Expert Support</span>
                </div>
                <div className="text-center">
                  <DollarSign className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <span className="text-xs text-white/70">ROI Guarantee</span>
                </div>
              </div>

              <button
                onClick={() => setShowGuarantee(true)}
                className="w-full text-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors"
              >
                <Shield className="h-5 w-5 text-blue-600 inline mr-1" />
                View 30-Day Money-Back Guarantee
              </button>
            </div>

            {/* Contact Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-6">Your Information</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    placeholder="Your Company"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-lg"
                >
                  {currentPlan.cta} - {currentPlan.price}/{currentPlan.interval}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee Modal */}
      {showGuarantee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">30-Day Money-Back Guarantee</h3>
              <button
                onClick={() => setShowGuarantee(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">100% Risk-Free Trial</p>
                  <p className="text-sm">Try our service for 30 days with zero risk. If you're not completely satisfied, we'll refund every penny.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">No Questions Asked</p>
                  <p className="text-sm">Simply contact our support team within 30 days for an immediate refund. No complicated forms or lengthy processes.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Keep Everything</p>
                  <p className="text-sm">Even if you request a refund, you can keep all the SEO audits, reports, and improvements we've made to your website.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                We're confident you'll see real results within the first 30 days. Most clients see improved rankings within 2-3 weeks.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}