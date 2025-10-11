import { NormalizedBusiness, AeoChecklistItem } from '@/types/seo';

/**
 * Generate AEO (AI-Engine Optimization) checklist from business profile
 * Focuses on optimization for AI search engines like ChatGPT, Gemini, Claude
 */
export function buildAeoChecklist(biz: NormalizedBusiness): AeoChecklistItem[] {
  const checklist: AeoChecklistItem[] = [];

  // Google Business Profile (GBP) Optimization
  checklist.push({
    category: 'GBP',
    title: 'Complete Google Business Profile',
    description: biz.address?.city
      ? `Ensure your GBP for ${biz.name} in ${biz.address.city} is 100% complete with all business information`
      : `Ensure your GBP for ${biz.name} is 100% complete with all business information`,
    priority: 'high',
    status: biz.address && biz.phone ? 'complete' : 'needs-attention',
  });

  checklist.push({
    category: 'GBP',
    title: 'Add Recent High-Quality Photos',
    description:
      'Upload 10+ recent photos including exterior, interior, products/services, and team photos',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'GBP',
    title: 'Optimize Business Categories',
    description: 'Select the most accurate primary category and 2-3 relevant secondary categories',
    priority: 'medium',
    status: 'pending',
  });

  // Bing Places Optimization
  checklist.push({
    category: 'Bing',
    title: 'Claim Bing Places Profile',
    description:
      'Set up and optimize your Bing Places for Business listing with complete NAP information',
    priority: 'medium',
    status: 'pending',
  });

  // Apple Maps Optimization
  checklist.push({
    category: 'Apple',
    title: 'Register with Apple Maps',
    description: 'Submit your business to Apple Maps Connect for iOS users searching locally',
    priority: 'medium',
    status: 'pending',
  });

  // Reviews Strategy
  const hasReviews = biz.rating !== undefined && biz.reviewCount !== undefined;
  checklist.push({
    category: 'Reviews',
    title: 'Implement Review Generation Strategy',
    description: hasReviews
      ? `Current rating: ${biz.rating}/5 (${biz.reviewCount} reviews). Target: 50+ reviews with 4.5+ rating`
      : 'Target: 25+ Google reviews with 4.5+ average rating within 90 days',
    priority: 'high',
    status:
      hasReviews && biz.rating! >= 4.0 && biz.reviewCount! >= 25 ? 'complete' : 'needs-attention',
  });

  checklist.push({
    category: 'Reviews',
    title: 'Respond to All Reviews',
    description:
      'Implement process to respond to all reviews within 24 hours, especially negative ones',
    priority: 'high',
    status: 'pending',
  });

  // NAP Consistency
  const hasCompleteNAP = biz.name && biz.address && biz.phone;
  checklist.push({
    category: 'NAP',
    title: 'Ensure NAP Consistency',
    description:
      'Verify identical Name, Address, Phone across all online directories and platforms',
    priority: 'high',
    status: hasCompleteNAP ? 'complete' : 'needs-attention',
  });

  // Schema Markup
  checklist.push({
    category: 'Schema',
    title: 'Implement LocalBusiness Schema',
    description: 'Add structured data markup for LocalBusiness, reviews, and FAQs to your website',
    priority: 'high',
    status: 'pending',
  });

  if (biz.services && biz.services.length > 0) {
    checklist.push({
      category: 'Schema',
      title: 'Add Service Schema Markup',
      description: `Add structured data for your ${biz.services.length} services to help AI engines understand your offerings`,
      priority: 'medium',
      status: 'pending',
    });
  }

  // Citation Building
  checklist.push({
    category: 'Citations',
    title: 'Build Industry-Specific Citations',
    description: 'Submit to top 10 industry-specific directories and local citation sources',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Citations',
    title: 'Monitor Citation Accuracy',
    description:
      'Use tools like Moz Local or BrightLocal to monitor and fix citation inconsistencies',
    priority: 'medium',
    status: 'pending',
  });

  // FAQ Optimization for AI
  if (biz.faqs && biz.faqs.length > 0) {
    checklist.push({
      category: 'Schema',
      title: 'Optimize FAQ Content for AI',
      description: `Your ${biz.faqs.length} FAQs are ready. Ensure they answer common customer questions naturally`,
      priority: 'medium',
      status: 'complete',
    });
  } else {
    checklist.push({
      category: 'Schema',
      title: 'Create FAQ Section',
      description:
        'Develop 10+ frequently asked questions with detailed answers for AI training data',
      priority: 'medium',
      status: 'needs-attention',
    });
  }

  // Service Area and Proximity
  if (biz.address?.city) {
    checklist.push({
      category: 'GBP',
      title: 'Define Service Areas',
      description: `Clearly define your service radius from ${biz.address.city} for accurate local search results`,
      priority: 'medium',
      status: 'pending',
    });
  }

  return checklist.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
