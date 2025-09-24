/**
 * AEO Help Tooltips Component
 * Provides contextual explanations for each AEO optimization step
 */

import React, { useState } from 'react';
import { HelpCircle, X, Lightbulb, TrendingUp, Search, Code2, Users } from 'lucide-react';

interface AEOStepInfo {
  title: string;
  description: string;
  benefits: string[];
  impact: string;
  actionItems: string[];
  icon: React.ElementType;
}

const AEO_STEPS: Record<string, AEOStepInfo> = {
  'schema-analysis': {
    title: 'Schema Markup Analysis',
    description: 'We analyze your website\'s structured data to help search engines understand your business better.',
    benefits: [
      'Improves rich snippet appearance in search results',
      'Helps Google understand your business type and services',
      'Increases click-through rates by 20-30%',
      'Better local search visibility'
    ],
    impact: 'High - Essential for AEO and voice search optimization',
    actionItems: [
      'Add LocalBusiness schema with complete business info',
      'Include FAQ schema for common customer questions',
      'Add Service schema for each service you offer',
      'Implement Organization schema with social profiles'
    ],
    icon: Code2
  },
  'content-optimization': {
    title: 'Content Optimization',
    description: 'We analyze your content for AEO-friendly language patterns and question-answer structures.',
    benefits: [
      'Increases chances of appearing in voice search results',
      'Improves featured snippet opportunities',
      'Better matches natural language queries',
      'Enhances user engagement and time on page'
    ],
    impact: 'Very High - Core factor for voice search and AEO rankings',
    actionItems: [
      'Create FAQ sections answering common questions',
      'Use conversational, natural language',
      'Structure content with clear headings',
      'Include location-specific information'
    ],
    icon: Users
  },
  'technical-seo': {
    title: 'Technical SEO Assessment',
    description: 'We evaluate your website\'s technical foundation to ensure optimal AEO performance.',
    benefits: [
      'Faster page load speeds improve voice search rankings',
      'Mobile optimization captures mobile voice searches',
      'HTTPS security builds trust with search engines',
      'Clean URLs enhance crawlability'
    ],
    impact: 'High - Technical foundation enables AEO success',
    actionItems: [
      'Optimize page speed (aim for <3 seconds)',
      'Ensure mobile-first responsive design',
      'Fix broken links and 404 errors',
      'Implement proper URL structure'
    ],
    icon: TrendingUp
  },
  'local-seo': {
    title: 'Local SEO Optimization',
    description: 'We optimize your business for local voice searches and "near me" queries.',
    benefits: [
      'Captures 46% of Google searches that have local intent',
      'Voice searches are 3x more likely to be local',
      'Improves Google My Business visibility',
      'Increases foot traffic and phone calls'
    ],
    impact: 'Critical - Most voice searches have local intent',
    actionItems: [
      'Complete and optimize Google My Business profile',
      'Add location pages for each service area',
      'Include local keywords naturally in content',
      'Encourage and respond to customer reviews'
    ],
    icon: Search
  },
  'voice-readiness': {
    title: 'Voice Search Readiness',
    description: 'We assess how well your content matches voice search query patterns and conversational AI.',
    benefits: [
      'Captures the growing voice search market (50% of adults use daily)',
      'Positions you for future AI-powered search',
      'Improves natural language processing compatibility',
      'Better smart speaker and mobile assistant visibility'
    ],
    impact: 'Future-Critical - Voice search growing 35% annually',
    actionItems: [
      'Create content answering "who, what, when, where, why" questions',
      'Use long-tail, conversational keywords',
      'Optimize for featured snippets',
      'Include local business information consistently'
    ],
    icon: Lightbulb
  }
};

interface AEOTooltipProps {
  stepKey: string;
  children: React.ReactNode;
  className?: string;
}

export const AEOTooltip: React.FC<AEOTooltipProps> = ({ stepKey, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const stepInfo = AEO_STEPS[stepKey];

  if (!stepInfo) {
    return <>{children}</>;
  }

  const Icon = stepInfo.icon;

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="flex items-center gap-2 cursor-help"
        onClick={() => setIsOpen(true)}
      >
        {children}
        <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{stepInfo.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{stepInfo.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Impact Level */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Business Impact</span>
                </div>
                <p className="text-blue-800">{stepInfo.impact}</p>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">How This Helps Your Business:</h4>
                <ul className="space-y-2">
                  {stepInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Recommended Actions:</h4>
                <ul className="space-y-2">
                  {stepInfo.actionItems.map((action, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-yellow-800">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Got it! Let's optimize this
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AEOProgressCardProps {
  stepKey: string;
  title: string;
  score: number;
  status: 'pending' | 'analyzing' | 'completed' | 'needs-attention';
  children?: React.ReactNode;
}

export const AEOProgressCard: React.FC<AEOProgressCardProps> = ({
  stepKey,
  title,
  score,
  status,
  children
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'analyzing':
        return 'bg-blue-50 border-blue-200';
      case 'needs-attention':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getStatusColor()} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <AEOTooltip stepKey={stepKey}>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </AEOTooltip>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor()}`}>
            {score}%
          </div>
          <div className="text-sm text-gray-500 capitalize">{status}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {children}
    </div>
  );
};

// Usage examples component for demonstration
export const AEODashboardExample: React.FC = () => {
  const mockSteps = [
    { key: 'schema-analysis', title: 'Schema Markup', score: 45, status: 'needs-attention' as const },
    { key: 'content-optimization', title: 'Content Optimization', score: 78, status: 'analyzing' as const },
    { key: 'technical-seo', title: 'Technical SEO', score: 92, status: 'completed' as const },
    { key: 'local-seo', title: 'Local SEO', score: 67, status: 'analyzing' as const },
    { key: 'voice-readiness', title: 'Voice Search Ready', score: 23, status: 'needs-attention' as const }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        AEO Optimization Progress
      </h2>
      
      {mockSteps.map((step) => (
        <AEOProgressCard
          key={step.key}
          stepKey={step.key}
          title={step.title}
          score={step.score}
          status={step.status}
        >
          <div className="text-sm text-gray-600">
            Click the help icon to learn how this optimization helps your business grow.
          </div>
        </AEOProgressCard>
      ))}
    </div>
  );
};