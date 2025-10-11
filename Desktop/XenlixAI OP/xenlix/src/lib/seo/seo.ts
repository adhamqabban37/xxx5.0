import { NormalizedBusiness, SeoChecklistItem } from '@/types/seo';

/**
 * Generate SEO checklist from business profile
 * Focuses on traditional search engine optimization for Google, Bing
 */
export function buildSeoChecklist(biz: NormalizedBusiness): SeoChecklistItem[] {
  const checklist: SeoChecklistItem[] = [];

  // Technical SEO
  checklist.push({
    category: 'Technical',
    title: 'Optimize Page Titles and Meta Descriptions',
    description: biz.address?.city
      ? `Create location-specific titles: "${biz.name} | [Service] in ${biz.address.city}"`
      : `Create compelling titles: "${biz.name} | [Primary Service]"`,
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Technical',
    title: 'Implement Header Tag Structure',
    description: 'Use proper H1-H6 hierarchy with target keywords and location modifiers',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Technical',
    title: 'Add Schema Markup',
    description: 'Implement LocalBusiness, Organization, and Service schema throughout the site',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Technical',
    title: 'Create XML Sitemap',
    description:
      'Generate and submit XML sitemap to Google Search Console and Bing Webmaster Tools',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Technical',
    title: 'Optimize Robots.txt',
    description: 'Ensure robots.txt allows crawling of important pages and blocks unnecessary ones',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Technical',
    title: 'Set Canonical URLs',
    description: 'Implement canonical tags to prevent duplicate content issues',
    priority: 'medium',
    status: 'pending',
  });

  // Content SEO
  if (biz.services && biz.services.length > 0) {
    checklist.push({
      category: 'Content',
      title: 'Create Service Pages',
      description: `Develop dedicated pages for each of your ${biz.services.length} services with local keywords`,
      priority: 'high',
      status: 'pending',
    });
  }

  if (biz.address?.city) {
    checklist.push({
      category: 'Local',
      title: 'Create Location Landing Page',
      description: `Build a comprehensive page targeting "${biz.name} ${biz.address.city}" with local information`,
      priority: 'high',
      status: 'pending',
    });

    checklist.push({
      category: 'Local',
      title: 'Add City-Specific Content',
      description: `Include ${biz.address.city} landmarks, neighborhoods, and local references in content`,
      priority: 'medium',
      status: 'pending',
    });
  }

  checklist.push({
    category: 'Content',
    title: 'Develop Content Calendar',
    description: 'Create monthly blog posts addressing customer questions and industry topics',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Content',
    title: 'Add Customer Testimonials',
    description: 'Feature customer reviews and case studies prominently on key pages',
    priority: 'medium',
    status: biz.rating !== undefined ? 'complete' : 'needs-attention',
  });

  checklist.push({
    category: 'Content',
    title: 'Create FAQ Section',
    description:
      biz.faqs && biz.faqs.length > 0
        ? `Expand your ${biz.faqs.length} FAQs with more detailed answers and related questions`
        : 'Develop comprehensive FAQ section targeting long-tail keywords',
    priority: 'medium',
    status: biz.faqs && biz.faqs.length > 0 ? 'complete' : 'needs-attention',
  });

  // Local SEO
  checklist.push({
    category: 'Local',
    title: 'Optimize Internal Linking',
    description:
      'Create strategic internal links between service pages, location pages, and blog content',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Local',
    title: 'Build Local Citations',
    description: 'Submit to 20+ local directories with consistent NAP information',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Local',
    title: 'Get Local Backlinks',
    description:
      'Acquire links from local news sites, chambers of commerce, and industry associations',
    priority: 'medium',
    status: 'pending',
  });

  // Performance SEO
  checklist.push({
    category: 'Performance',
    title: 'Optimize Core Web Vitals',
    description: 'Achieve LCP < 2.8s, CLS < 0.05, INP < 200ms for better search rankings',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Performance',
    title: 'Implement Mobile Optimization',
    description: 'Ensure responsive design and fast mobile loading speeds',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Performance',
    title: 'Optimize Images',
    description: 'Compress images, add alt text, and implement lazy loading',
    priority: 'medium',
    status: 'pending',
  });

  // Authority Building
  checklist.push({
    category: 'Authority',
    title: 'Develop E-E-A-T Signals',
    description: 'Showcase Experience, Expertise, Authoritativeness, and Trustworthiness',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Authority',
    title: 'Add Team/About Pages',
    description: 'Create detailed pages about your team, credentials, and company history',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Authority',
    title: 'Display Certifications',
    description: 'Prominently feature industry certifications, awards, and affiliations',
    priority: 'medium',
    status: 'pending',
  });

  checklist.push({
    category: 'Authority',
    title: 'Build Industry Authority',
    description: 'Guest post on industry blogs and participate in local business events',
    priority: 'low',
    status: 'pending',
  });

  // Local-specific items
  if (biz.address?.city) {
    checklist.push({
      category: 'Local',
      title: 'Target "Near Me" Keywords',
      description: `Optimize for searches like "[service] near me" and "[service] in ${biz.address.city}"`,
      priority: 'high',
      status: 'pending',
    });
  }

  // Review and monitoring
  checklist.push({
    category: 'Technical',
    title: 'Set Up Analytics Tracking',
    description: 'Install Google Analytics 4, Search Console, and local SEO tracking tools',
    priority: 'high',
    status: 'pending',
  });

  checklist.push({
    category: 'Technical',
    title: 'Monitor Rankings',
    description: 'Track rankings for target keywords and local search positions monthly',
    priority: 'medium',
    status: 'pending',
  });

  return checklist.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
