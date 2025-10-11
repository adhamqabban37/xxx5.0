'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight, CheckCircle } from 'lucide-react';

export function PremiumGate() {
  const premiumFeatures = [
    'AI Visibility Score Tracking',
    'Competitor Benchmarking',
    'Citation & Source Analysis',
    'Answer Engine Coverage Reports',
    'Actionable AEO Recommendations',
    'Historical Trend Analysis',
    'Export & White-label Reports',
    'Priority Support & Updates',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-yellow-100 rounded-full p-4 w-20 h-20 flex items-center justify-center">
            <Crown className="h-10 w-10 text-yellow-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Premium AEO Intelligence Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Unlock comprehensive AI visibility tracking and optimization insights
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {premiumFeatures.map((feature) => (
              <div key={feature} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Why Premium AEO Intelligence?</h3>
            <p className="mb-4 opacity-90">
              As AI search engines like ChatGPT, Gemini, and Claude reshape how customers find
              businesses, traditional SEO isn't enough. Get ahead with our Premium AEO Intelligence
              Dashboard.
            </p>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• Track your visibility across 4+ AI engines</li>
              <li>• Identify exactly where competitors outrank you</li>
              <li>• Get AI-powered recommendations for immediate wins</li>
              <li>• Monitor citation authority and source quality</li>
            </ul>
          </div>

          {/* Social Proof */}
          <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
            <blockquote className="italic text-gray-700">
              "Our AEO visibility increased 340% in 3 months using these insights. We went from
              barely appearing in AI answers to ranking #1 for our industry queries."
            </blockquote>
            <cite className="text-sm text-blue-600 mt-2 block">
              — Sarah Chen, Marketing Director at TechFlow Solutions
            </cite>
          </div>

          {/* Pricing */}
          <div className="text-center space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">
                $97<span className="text-lg font-normal">/month</span>
              </div>
              <p className="text-gray-600 mt-1">Everything you need to dominate AI search</p>
              <p className="text-sm text-green-600 mt-2">✨ Limited time: 30-day free trial</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                View Pricing Details
              </Button>
            </div>
          </div>

          {/* Guarantee */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>🔒 30-day money-back guarantee • Cancel anytime • No setup fees</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
