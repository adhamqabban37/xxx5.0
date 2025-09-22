/**
 * Business Information Extractor for AEO Analysis
 * Extracts business details from URL and content analysis
 */

interface BusinessInfo {
  name: string;
  website?: string;
  address?: string;
  phone?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  industry?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface ContentAnalysisResult {
  url: string;
  title: string;
  metaDescription: string;
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
  };
  technicalSeo: {
    hasMetaDescription: boolean;
    metaDescriptionLength: number;
    titleLength: number;
    hasAltTags: number;
    missingAltTags: number;
    hasStructuredData: boolean;
    loadTime: number;
    mobileOptimized: boolean;
  };
  businessAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  };
}

/**
 * Extract business information from analysis result
 */
export function extractBusinessInfo(analysisData: ContentAnalysisResult): BusinessInfo {
  const { url, title, entities, businessAddress } = analysisData;
  
  // Extract domain name as fallback business name
  const domain = new URL(url).hostname.replace('www.', '');
  const domainName = domain.split('.')[0];
  
  // Try to extract business name from title or organizations
  let businessName = '';
  if (entities.organizations && entities.organizations.length > 0) {
    businessName = entities.organizations[0];
  } else if (title) {
    // Clean up title to extract business name
    businessName = title
      .replace(/\s*-\s*.+$/, '') // Remove everything after dash
      .replace(/\s*\|\s*.+$/, '') // Remove everything after pipe
      .replace(/\s*–\s*.+$/, '') // Remove everything after em dash
      .trim();
  } else {
    // Capitalize domain name as fallback
    businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
  }
  
  // Extract location information - prioritize businessAddress from webpage
  const location: BusinessInfo['location'] = {};
  let fullAddress = '';
  let phone = '';
  
  if (businessAddress) {
    // Use extracted business address data first
    if (businessAddress.city) location.city = businessAddress.city;
    if (businessAddress.state) location.state = businessAddress.state;
    if (businessAddress.country) location.country = businessAddress.country;
    if (businessAddress.phone) phone = businessAddress.phone;
    
    // Build full address string
    if (businessAddress.address) {
      fullAddress = businessAddress.address;
    } else if (businessAddress.city) {
      fullAddress = `${businessAddress.city}${businessAddress.state ? ', ' + businessAddress.state : ''}${businessAddress.country ? ', ' + businessAddress.country : ''}`;
    }
  }
  
  // Fallback to entities if no businessAddress data
  if (!location.city && entities.places && entities.places.length > 0) {
    const place = entities.places[0];
    if (place.includes(',')) {
      const parts = place.split(',').map(p => p.trim());
      location.city = parts[0];
      if (parts.length > 1) {
        location.state = parts[1];
      }
      if (parts.length > 2) {
        location.country = parts[2];
      }
    } else {
      location.city = place;
    }
    
    // Build address from location if not already set
    if (!fullAddress && location.city) {
      fullAddress = `${location.city}${location.state ? ', ' + location.state : ''}${location.country ? ', ' + location.country : ''}`;
    }
  }
  
  // Determine industry from URL or title
  let industry = '';
  const industryKeywords = {
    'law': 'Legal Services',
    'legal': 'Legal Services',
    'attorney': 'Legal Services',
    'lawyer': 'Legal Services',
    'medical': 'Healthcare',
    'doctor': 'Healthcare',
    'dental': 'Healthcare',
    'health': 'Healthcare',
    'clinic': 'Healthcare',
    'restaurant': 'Food & Dining',
    'food': 'Food & Dining',
    'cafe': 'Food & Dining',
    'real estate': 'Real Estate',
    'realty': 'Real Estate',
    'property': 'Real Estate',
    'consulting': 'Consulting',
    'consultant': 'Consulting',
    'marketing': 'Marketing',
    'agency': 'Marketing',
    'tech': 'Technology',
    'software': 'Technology',
    'it': 'Technology',
    'auto': 'Automotive',
    'car': 'Automotive',
    'repair': 'Automotive',
    'beauty': 'Beauty & Wellness',
    'salon': 'Beauty & Wellness',
    'spa': 'Beauty & Wellness',
    'fitness': 'Fitness',
    'gym': 'Fitness',
    'trainer': 'Fitness'
  };
  
  const combinedText = `${url} ${title} ${businessName}`.toLowerCase();
  for (const [keyword, industryName] of Object.entries(industryKeywords)) {
    if (combinedText.includes(keyword)) {
      industry = industryName;
      break;
    }
  }
  
  // Try to detect social media links from common patterns
  const socials: BusinessInfo['socials'] = {};
  const baseDomain = domain.split('.')[0];
  
  // Common social media patterns
  const socialPatterns = {
    twitter: `https://twitter.com/${baseDomain}`,
    linkedin: `https://linkedin.com/company/${baseDomain}`,
    facebook: `https://facebook.com/${baseDomain}`,
    instagram: `https://instagram.com/${baseDomain}`,
    youtube: `https://youtube.com/@${baseDomain}`
  };
  
  // Only include if we have a reasonable business name (not just domain)
  if (businessName && businessName !== domainName) {
    Object.assign(socials, socialPatterns);
  }
  
  return {
    name: businessName,
    website: url,
    address: fullAddress || undefined,
    phone: phone || undefined,
    socials: Object.keys(socials).length > 0 ? socials : undefined,
    industry,
    location
  };
}

/**
 * Get industry-specific AEO recommendations
 */
export function getIndustryRecommendations(industry: string): string[] {
  const recommendations: { [key: string]: string[] } = {
    'Legal Services': [
      'Add FAQ schema for common legal questions',
      'Optimize for "near me" legal searches',
      'Include practice area-specific keywords',
      'Add attorney bio structured data'
    ],
    'Healthcare': [
      'Implement HealthcareOrganization schema',
      'Add medical condition FAQs',
      'Optimize for symptom-based queries',
      'Include doctor review snippets'
    ],
    'Food & Dining': [
      'Add Restaurant schema markup',
      'Include menu items and prices',
      'Optimize for food delivery searches',
      'Add customer review highlights'
    ],
    'Real Estate': [
      'Implement RealEstateAgent schema',
      'Add local market data',
      'Optimize for property type searches',
      'Include neighborhood information'
    ],
    'Consulting': [
      'Add Service schema markup',
      'Include case study structured data',
      'Optimize for industry-specific expertise',
      'Add testimonial schema'
    ],
    'Marketing': [
      'Implement Organization schema',
      'Add service area definitions',
      'Optimize for marketing strategy queries',
      'Include portfolio examples'
    ],
    'Technology': [
      'Add SoftwareApplication schema',
      'Include technical documentation',
      'Optimize for solution-based searches',
      'Add integration examples'
    ],
    'Automotive': [
      'Implement AutoDealer schema',
      'Add vehicle inventory data',
      'Optimize for car model searches',
      'Include service offerings'
    ],
    'Beauty & Wellness': [
      'Add BeautySalon schema markup',
      'Include service descriptions',
      'Optimize for treatment searches',
      'Add before/after examples'
    ],
    'Fitness': [
      'Implement SportsActivityLocation schema',
      'Add class schedules',
      'Optimize for workout type searches',
      'Include trainer credentials'
    ]
  };
  
  return recommendations[industry] || [
    'Add relevant schema markup for your business type',
    'Optimize for industry-specific search queries',
    'Include detailed service descriptions',
    'Add customer testimonials and reviews'
  ];
}

/**
 * Calculate business completeness score
 */
export function calculateBusinessCompletenessScore(businessInfo: BusinessInfo): {
  score: number;
  missing: string[];
  recommendations: string[];
} {
  const factors = [
    { key: 'name', label: 'Business Name', weight: 20 },
    { key: 'address', label: 'Business Address', weight: 15 },
    { key: 'phone', label: 'Phone Number', weight: 15 },
    { key: 'socials', label: 'Social Media Links', weight: 10 },
    { key: 'mapSrc', label: 'Location Map', weight: 10 },
    { key: 'industry', label: 'Industry Classification', weight: 15 },
    { key: 'website', label: 'Website URL', weight: 15 }
  ];
  
  let totalScore = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];
  
  factors.forEach(factor => {
    const value = businessInfo[factor.key as keyof BusinessInfo];
    if (value && (typeof value !== 'object' || Object.keys(value).length > 0)) {
      totalScore += factor.weight;
    } else {
      missing.push(factor.label);
      
      // Add specific recommendations based on what's missing
      switch (factor.key) {
        case 'address':
          recommendations.push('Add your business address for better local search visibility');
          break;
        case 'phone':
          recommendations.push('Include a phone number to improve customer contact options');
          break;
        case 'socials':
          recommendations.push('Add social media links to boost your online presence');
          break;
        case 'industry':
          recommendations.push('Specify your industry for more targeted optimization');
          break;
        default:
          recommendations.push(`Add ${factor.label.toLowerCase()} to improve your business profile`);
      }
    }
  });
  
  return {
    score: Math.round(totalScore),
    missing,
    recommendations
  };
}