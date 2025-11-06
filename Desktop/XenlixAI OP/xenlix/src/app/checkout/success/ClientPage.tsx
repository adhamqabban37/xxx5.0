'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, Calendar, TrendingUp, Users } from 'lucide-react';

export default function CheckoutSuccessClientPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'premium';

  const planNames = {
    premium: 'Premium SEO + AEO',
    enterprise: 'Enterprise',
  };

  const planName = planNames[plan as keyof typeof planNames] || 'Premium SEO + AEO';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to XenlixAI Premium!</h1>
          <p className="text-xl text-gray-600">Your {planName} subscription is now active</p>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next?</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Instant Access to Your Dashboard</h3>
                <p className="text-gray-600 mb-3">
                  Your premium dashboard is ready with detailed SEO + AEO reports, implementation
                  guides, and tracking tools.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Access Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Welcome Email with Implementation Guide
                </h3>
                <p className="text-gray-600">
                  Check your inbox for a comprehensive implementation roadmap and priority action
                  items.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">AI-Generated Quick Fixes</h3>
                <p className="text-gray-600">
                  Ready-to-implement code snippets, schema markup, and technical fixes for the
                  issues we detected.
                </p>
              </div>
            </div>

            {plan === 'enterprise' && (
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Dedicated SEO Specialist Contact</h3>
                  <p className="text-gray-600">
                    Your dedicated specialist will reach out within 24 hours to schedule your first
                    strategy call.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What You Get Access To */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Premium Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Complete SEO + AEO audit reports</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Auto-generated technical fixes</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>FAQ schema markup generation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Page speed optimization guide</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Google My Business optimization</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Content templates for AI engines</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Monthly progress tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Competitor monitoring alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Priority email support</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Implementation roadmap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Results */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Expected Results Timeline</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Week 1-2</h3>
              <p className="text-blue-100">Quick fixes implemented, technical issues resolved</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Week 3-4</h3>
              <p className="text-blue-100">Search rankings improve, AI visibility increases</p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Week 5-8</h3>
              <p className="text-blue-100">150% traffic increase, outranking competitors</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help Getting Started?</h2>
          <p className="text-gray-600 mb-6">
            Our team is here to ensure your success. Don&apos;t hesitate to reach out if you have
            any questions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:support@xenlix.ai"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email Support
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            Thank you for choosing XenlixAI. We&apos;re excited to help you dominate search results!
          </p>
        </div>
      </div>
    </div>
  );
}
