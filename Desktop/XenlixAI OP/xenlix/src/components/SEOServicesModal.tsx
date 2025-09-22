"use client";

import { useState } from 'react';
import { X, Target, TrendingUp, Search, MapPin, FileText, Users } from 'lucide-react';

interface SEOServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SEOServicesModal({ isOpen, onClose }: SEOServicesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">SEO Services</h2>
            <p className="text-gray-400 mt-1">Coming Soon - Advanced SEO Solutions</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overview */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">What We're Building</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              We're developing a comprehensive suite of SEO services powered by AI to help businesses dominate search results and get found by their ideal customers. Our services will combine cutting-edge technology with proven SEO strategies.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local SEO Optimization */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-8 h-8 text-blue-400 mr-3" />
                <h4 className="text-lg font-semibold text-white">Local SEO Optimization</h4>
              </div>
              <p className="text-gray-300 mb-4">
                Dominate local search results and attract customers in your area.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Google Business Profile optimization</li>
                <li>• Local citation building</li>
                <li>• Review management</li>
                <li>• Local keyword targeting</li>
              </ul>
            </div>

            {/* Technical SEO Audits */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Search className="w-8 h-8 text-green-400 mr-3" />
                <h4 className="text-lg font-semibold text-white">Technical SEO Audits</h4>
              </div>
              <p className="text-gray-300 mb-4">
                Comprehensive technical analysis to fix issues hurting your rankings.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Site speed optimization</li>
                <li>• Core Web Vitals improvement</li>
                <li>• Mobile responsiveness</li>
                <li>• Schema markup implementation</li>
              </ul>
            </div>

            {/* Content Strategy */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-purple-400 mr-3" />
                <h4 className="text-lg font-semibold text-white">Content Strategy</h4>
              </div>
              <p className="text-gray-300 mb-4">
                AI-powered content strategies that rank and convert.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Keyword research & targeting</li>
                <li>• Content gap analysis</li>
                <li>• Topic cluster development</li>
                <li>• SEO-optimized content creation</li>
              </ul>
            </div>

            {/* Competitor Analysis */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Target className="w-8 h-8 text-red-400 mr-3" />
                <h4 className="text-lg font-semibold text-white">Competitor Analysis</h4>
              </div>
              <p className="text-gray-300 mb-4">
                Discover what your competitors are doing and beat them at their own game.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Competitor keyword analysis</li>
                <li>• Backlink gap identification</li>
                <li>• Content strategy analysis</li>
                <li>• Market opportunity mapping</li>
              </ul>
            </div>

            {/* Performance Tracking */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-8 h-8 text-yellow-400 mr-3" />
                <h4 className="text-lg font-semibold text-white">Performance Tracking</h4>
              </div>
              <p className="text-gray-300 mb-4">
                Real-time monitoring and reporting of your SEO performance.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Keyword ranking tracking</li>
                <li>• Traffic growth monitoring</li>
                <li>• Conversion rate optimization</li>
                <li>• Monthly performance reports</li>
              </ul>
            </div>

            {/* Managed SEO Campaigns */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-cyan-400 mr-3" />
                <h4 className="text-lg font-semibold text-white">Managed SEO Campaigns</h4>
              </div>
              <p className="text-gray-300 mb-4">
                Full-service SEO management by our expert team.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Dedicated SEO strategist</li>
                <li>• Monthly strategy sessions</li>
                <li>• Ongoing optimization</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Get Early Access</h3>
            <p className="text-gray-300 mb-4">
              Be the first to know when our SEO services launch. Join our waitlist for exclusive early-bird pricing and priority access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Join Waitlist
              </button>
              <button 
                onClick={onClose}
                className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}