'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SEORecommendationEngine = void 0;
class SEORecommendationEngine {
  constructor(businessProfile) {
    this.businessProfile = businessProfile;
  }
  /**
   * Generate comprehensive SEO recommendations
   */
  async generateRecommendations() {
    const recommendations = {
      metaTags: this.generateMetaTagRecommendations(),
      headings: this.generateHeadingRecommendations(),
      internalLinking: this.generateInternalLinkingStrategy(),
      localContent: this.generateLocalContentIdeas(),
      sitemapUpdates: this.generateSitemapRecommendations(),
      technicalSEO: this.generateTechnicalSEOChecklist(),
      keywordStrategy: this.generateKeywordStrategy(),
      contentOptimization: this.generateContentOptimization(),
    };
    const competitorAnalysis = this.generateCompetitorAnalysis();
    const actionPlan = this.generateActionPlan(recommendations);
    const estimatedResults = this.generateEstimatedResults();
    return {
      businessProfile: this.businessProfile,
      recommendations,
      competitorAnalysis,
      actionPlan,
      estimatedResults,
    };
  }
  /**
   * Generate meta tag recommendations
   */
  generateMetaTagRecommendations() {
    const { businessName, industry, city, services, description, contact } = this.businessProfile;
    // Primary keywords combination
    const primaryService = services[0] || industry;
    const locationKeyword = city ? `${city}` : '';
    // Generate title variations
    const titleVariations = [
      `${businessName} | ${primaryService} in ${locationKeyword}`,
      `Best ${primaryService} ${locationKeyword} | ${businessName}`,
      `${primaryService} Services ${locationKeyword} | ${businessName}`,
      `Professional ${primaryService} | ${businessName} ${locationKeyword}`,
      `${locationKeyword} ${primaryService} Company | ${businessName}`,
    ].filter((title) => title.length <= 60);
    // Generate description variations
    const descriptionVariations = [
      `Professional ${primaryService} services in ${locationKeyword}. ${businessName} offers ${services.slice(0, 3).join(', ')}. Contact us today for expert solutions.`,
      `Looking for ${primaryService} in ${locationKeyword}? ${businessName} provides top-quality ${services.slice(0, 2).join(' and ')} services. Call ${contact.phone || 'us'} today!`,
      `${businessName} - Your trusted ${primaryService} provider in ${locationKeyword}. Specializing in ${services.slice(0, 3).join(', ')}. Get a free consultation today.`,
    ].filter((desc) => desc.length <= 160);
    return {
      title: {
        primary: titleVariations[0],
        alternatives: titleVariations.slice(1),
        length: titleVariations[0].length,
        keywordDensity: this.calculateKeywordDensity(titleVariations[0], primaryService),
      },
      description: {
        primary: descriptionVariations[0],
        alternatives: descriptionVariations.slice(1),
        length: descriptionVariations[0].length,
        callToAction: contact.phone ? `Call ${contact.phone}` : 'Contact us today',
      },
      keywords: this.generateKeywords(),
      openGraph: {
        title: titleVariations[0],
        description: descriptionVariations[0],
        image: '/og-image.jpg',
        type: 'business.business',
      },
      twitter: {
        card: 'summary_large_image',
        title: titleVariations[0],
        description: descriptionVariations[0],
        image: '/twitter-card.jpg',
      },
      localBusiness: {
        type: this.getSchemaType(industry),
        name: businessName,
        address: contact.address || '',
        phone: contact.phone || '',
        hours: this.formatBusinessHours(),
        geo: {
          latitude: undefined, // Would be populated from geocoding API
          longitude: undefined,
        },
      },
    };
  }
  /**
   * Generate heading structure recommendations
   */
  generateHeadingRecommendations() {
    const { businessName, industry, city, services, uniqueSellingPoints } = this.businessProfile;
    const primaryService = services[0] || industry;
    return {
      h1: {
        primary: `Professional ${primaryService} Services in ${city}`,
        alternatives: [
          `${businessName} - Leading ${primaryService} in ${city}`,
          `Expert ${primaryService} Solutions | ${businessName}`,
          `Top-Rated ${primaryService} Company in ${city}`,
        ],
        keywords: [primaryService, city, businessName],
      },
      h2: {
        suggestions: [
          `Our ${primaryService} Services`,
          `Why Choose ${businessName}?`,
          `Service Areas in ${city}`,
          `Customer Reviews and Testimonials`,
          `About Our ${industry} Company`,
          `Get Started Today`,
        ],
        structure: [
          'Services overview',
          'Benefits/USPs',
          'Local coverage',
          'Social proof',
          'Company info',
          'Call to action',
        ],
      },
      h3: {
        suggestions: services.map((service) => `${service} in ${city}`),
        supportingTopics: [
          'Free Consultation',
          'Licensed and Insured',
          'Emergency Services',
          'Satisfaction Guarantee',
          'Local Expertise',
          'Competitive Pricing',
        ],
      },
      optimization: {
        keywordPlacement: [
          `Include "${primaryService}" in H1`,
          `Use location "${city}" in multiple headings`,
          `Include service variations in H3 tags`,
          `Add branded terms in H2 headings`,
        ],
        semanticKeywords: this.generateSemanticKeywords(),
        userIntent: this.determineUserIntent(),
      },
    };
  }
  /**
   * Generate internal linking strategy
   */
  generateInternalLinkingStrategy() {
    const { services, city, industry } = this.businessProfile;
    const primaryPages = [
      {
        url: '/',
        title: 'Home',
        purpose: 'Brand introduction and primary services',
        priority: 'high',
      },
      {
        url: '/services',
        title: 'Services',
        purpose: 'Complete service overview',
        priority: 'high',
      },
      {
        url: '/about',
        title: 'About Us',
        purpose: 'Company credibility and expertise',
        priority: 'medium',
      },
      {
        url: '/contact',
        title: 'Contact',
        purpose: 'Lead generation and contact info',
        priority: 'high',
      },
      {
        url: '/reviews',
        title: 'Reviews',
        purpose: 'Social proof and testimonials',
        priority: 'medium',
      },
      ...services.map((service) => ({
        url: `/services/${this.slugify(service)}`,
        title: `${service} Services`,
        purpose: `Detailed information about ${service}`,
        priority: 'high',
      })),
    ];
    return {
      primaryPages,
      linkingOpportunities: this.generateLinkingOpportunities(primaryPages),
      siteArchitecture: {
        pillars: ['Service Pages', 'Location Pages', 'Resource Center', 'Company Information'],
        clusters: [
          {
            topic: 'Services',
            pages: services.map((service) => `/services/${this.slugify(service)}`),
            internalLinks: services.length * 3,
          },
          {
            topic: 'Locations',
            pages: [`/${this.slugify(city)}`, `/service-areas`],
            internalLinks: 6,
          },
        ],
      },
      breadcrumbs: {
        structure: ['Home', 'Services', 'Service Name'],
        implementation: 'JSON-LD structured data + visual breadcrumbs',
      },
    };
  }
  /**
   * Generate local content ideas
   */
  generateLocalContentIdeas() {
    const { city, industry, services } = this.businessProfile;
    return {
      locationPages: [
        {
          title: `${services[0]} Services in ${city}`,
          url: `/${this.slugify(city)}-${this.slugify(services[0])}`,
          content: [
            `Professional ${services[0]} services throughout ${city}`,
            'Local service areas and coverage',
            'Why choose local professionals',
            'Customer testimonials from area',
          ],
          keywords: [services[0], city, 'local', 'near me'],
          priority: 10,
        },
        ...this.generateNearbyLocationPages(),
      ],
      localTopics: [
        {
          topic: `${city} ${industry} Trends 2025`,
          keywords: [city, industry, 'trends', '2025'],
          contentType: 'blog',
          difficulty: 'medium',
          impact: 8,
        },
        {
          topic: `Best ${industry} Practices in ${city}`,
          keywords: [city, industry, 'best practices', 'guide'],
          contentType: 'blog',
          difficulty: 'easy',
          impact: 7,
        },
        {
          topic: `${city} ${industry} Cost Guide`,
          keywords: [city, industry, 'cost', 'pricing', 'guide'],
          contentType: 'resource',
          difficulty: 'medium',
          impact: 9,
        },
      ],
      communityContent: {
        events: [
          `${city} Business Expo`,
          `Local ${industry} Workshop`,
          `Community Service Projects`,
          `${city} Chamber of Commerce Events`,
        ],
        partnerships: [
          `Local ${industry} Associations`,
          `${city} Chamber of Commerce`,
          'Local Business Networks',
          'Community Organizations',
        ],
        sponsorships: [
          'Local Sports Teams',
          'Community Events',
          'School Programs',
          'Charity Fundraisers',
        ],
        localNews: [
          `${city} Business News`,
          `Local ${industry} Updates`,
          'Community Development',
          'Economic Growth Stories',
        ],
      },
      seasonalContent: this.generateSeasonalContent(),
    };
  }
  /**
   * Generate sitemap recommendations
   */
  generateSitemapRecommendations() {
    const { services, city } = this.businessProfile;
    return {
      structure: {
        mainSitemap: '/sitemap.xml',
        subSitemaps: [
          { type: 'pages', url: '/sitemap-pages.xml', priority: 1.0 },
          { type: 'services', url: '/sitemap-services.xml', priority: 0.9 },
          { type: 'locations', url: '/sitemap-locations.xml', priority: 0.8 },
          { type: 'blog', url: '/sitemap-blog.xml', priority: 0.7 },
        ],
      },
      pages: [
        { url: '/', priority: 1.0, changeFreq: 'weekly', lastMod: new Date().toISOString() },
        {
          url: '/services',
          priority: 0.9,
          changeFreq: 'monthly',
          lastMod: new Date().toISOString(),
        },
        { url: '/about', priority: 0.7, changeFreq: 'monthly', lastMod: new Date().toISOString() },
        {
          url: '/contact',
          priority: 0.8,
          changeFreq: 'monthly',
          lastMod: new Date().toISOString(),
        },
        ...services.map((service) => ({
          url: `/services/${this.slugify(service)}`,
          priority: 0.8,
          changeFreq: 'monthly',
          lastMod: new Date().toISOString(),
        })),
      ],
      localSEO: {
        businessListing: true,
        locationPages: [`/${this.slugify(city)}`],
        serviceAreaPages: [`/service-areas`, `/areas-served`],
      },
    };
  }
  /**
   * Generate technical SEO checklist
   */
  generateTechnicalSEOChecklist() {
    return {
      coreWebVitals: {
        lcp: {
          target: '< 2.5 seconds',
          recommendations: [
            'Optimize images and use WebP format',
            'Implement lazy loading',
            'Use CDN for static assets',
            'Minimize server response time',
          ],
        },
        fid: {
          target: '< 100 milliseconds',
          recommendations: [
            'Minimize JavaScript execution time',
            'Remove unused JavaScript',
            'Use code splitting',
            'Optimize event handlers',
          ],
        },
        cls: {
          target: '< 0.1',
          recommendations: [
            'Set dimensions for images and videos',
            'Reserve space for ads',
            'Avoid inserting content above existing content',
            'Use CSS transforms instead of layout changes',
          ],
        },
      },
      mobile: {
        responsive: true,
        mobileFirst: true,
        recommendations: [
          'Implement responsive design',
          'Optimize for mobile page speed',
          'Use mobile-friendly navigation',
          'Ensure clickable elements are appropriately sized',
        ],
      },
      pageSpeed: {
        targetScore: 90,
        optimizations: [
          'Compress images',
          'Minify CSS and JavaScript',
          'Enable browser caching',
          'Use efficient file formats',
        ],
        priorityFixes: [
          'Optimize largest contentful paint',
          'Reduce server response time',
          'Eliminate render-blocking resources',
        ],
      },
      indexing: {
        robotsTxt: this.generateRobotsTxt(),
        indexabilityIssues: [
          'Check for noindex tags',
          'Verify canonical URLs',
          'Fix crawl errors',
          'Submit XML sitemap',
        ],
        crawlabilityChecks: [
          'Clean URL structure',
          'Proper internal linking',
          'No broken links',
          'Optimized robots.txt',
        ],
      },
      schema: {
        businessSchema: true,
        localBusinessSchema: true,
        serviceSchema: true,
        reviewSchema: true,
        faqSchema: true,
      },
    };
  }
  /**
   * Generate keyword strategy
   */
  generateKeywordStrategy() {
    const { industry, services, city } = this.businessProfile;
    return {
      primary: [
        {
          keyword: `${services[0]} ${city}`,
          volume: 1000,
          difficulty: 45,
          intent: 'commercial',
        },
        {
          keyword: `${industry} ${city}`,
          volume: 800,
          difficulty: 50,
          intent: 'commercial',
        },
        {
          keyword: `${services[0]} near me`,
          volume: 1200,
          difficulty: 40,
          intent: 'transactional',
        },
      ],
      secondary: services.slice(1).map((service) => ({
        keyword: `${service} ${city}`,
        volume: 500,
        difficulty: 35,
        intent: 'commercial',
      })),
      longTail: [
        {
          keyword: `best ${services[0]} company in ${city}`,
          volume: 200,
          opportunity: 8,
        },
        {
          keyword: `affordable ${services[0]} services ${city}`,
          volume: 150,
          opportunity: 7,
        },
        {
          keyword: `professional ${services[0]} ${city} reviews`,
          volume: 100,
          opportunity: 6,
        },
      ],
      local: [
        {
          keyword: `${services[0]} ${city}`,
          localVolume: 800,
          competition: 'medium',
        },
        {
          keyword: `${city} ${industry}`,
          localVolume: 600,
          competition: 'high',
        },
      ],
      seasonal: this.generateSeasonalKeywords(),
    };
  }
  /**
   * Generate content optimization recommendations
   */
  generateContentOptimization() {
    const { services, industry, city } = this.businessProfile;
    return {
      existingContent: [
        {
          url: '/',
          currentTitle: 'Home Page',
          recommendedTitle: `Professional ${services[0]} Services in ${city}`,
          improvements: [
            'Add location keywords to title',
            'Include primary service in H1',
            'Add customer testimonials',
            'Optimize meta description',
          ],
          priority: 10,
        },
        {
          url: '/services',
          currentTitle: 'Our Services',
          recommendedTitle: `${services[0]} & ${industry} Services in ${city}`,
          improvements: [
            'Create individual service pages',
            'Add service-specific keywords',
            'Include pricing information',
            'Add FAQ section',
          ],
          priority: 9,
        },
      ],
      gapAnalysis: {
        missingTopics: [
          `How to choose ${industry} services`,
          `${services[0]} cost guide`,
          `DIY vs Professional ${services[0]}`,
          `${industry} maintenance tips`,
        ],
        competitorContent: [
          'Service comparison pages',
          'Local market analysis',
          'Customer success stories',
          'Technical guides',
        ],
        opportunityScore: 8.5,
      },
      contentCalendar: this.generateContentCalendar(),
    };
  }
  // Helper methods
  calculateKeywordDensity(text, keyword) {
    const words = text.toLowerCase().split(' ');
    const keywordWords = keyword.toLowerCase().split(' ');
    let matches = 0;
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      if (keywordWords.every((word, j) => words[i + j] === word)) {
        matches++;
      }
    }
    return (matches / words.length) * 100;
  }
  generateKeywords() {
    const { industry, services, city } = this.businessProfile;
    return [
      ...services,
      industry,
      city,
      `${services[0]} ${city}`,
      `${industry} near me`,
      `local ${industry}`,
      `professional ${services[0]}`,
      `best ${industry} ${city}`,
    ];
  }
  getSchemaType(industry) {
    const schemaMap = {
      restaurant: 'Restaurant',
      retail: 'Store',
      healthcare: 'MedicalBusiness',
      automotive: 'AutomotiveBusiness',
      'home services': 'HomeAndConstructionBusiness',
      legal: 'LegalService',
      fitness: 'ExerciseGym',
      beauty: 'BeautySalon',
    };
    return schemaMap[industry.toLowerCase()] || 'LocalBusiness';
  }
  formatBusinessHours() {
    if (!this.businessProfile.operatingHours) {
      return 'Mo-Fr 9:00-17:00';
    }
    return Object.entries(this.businessProfile.operatingHours)
      .map(([day, hours]) => `${day.substring(0, 2)} ${hours}`)
      .join(', ');
  }
  generateSemanticKeywords() {
    const { industry, services } = this.businessProfile;
    const semanticMap = {
      restaurant: ['dining', 'cuisine', 'menu', 'food', 'catering'],
      retail: ['shopping', 'products', 'merchandise', 'store', 'boutique'],
      healthcare: ['medical', 'treatment', 'care', 'wellness', 'health'],
      'home services': ['repair', 'maintenance', 'installation', 'contractor', 'improvement'],
    };
    return semanticMap[industry.toLowerCase()] || services;
  }
  determineUserIntent() {
    const { industry } = this.businessProfile;
    const intentMap = {
      restaurant: 'Find local dining options',
      retail: 'Purchase products or browse inventory',
      healthcare: 'Find medical services and book appointments',
      'home services': 'Hire professionals for home projects',
    };
    return intentMap[industry.toLowerCase()] || 'Find local business services';
  }
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  generateLinkingOpportunities(pages) {
    return [
      {
        fromPage: '/',
        toPage: '/services',
        anchorText: 'Our Services',
        context: 'Main navigation and homepage content',
        seoValue: 9,
      },
      {
        fromPage: '/services',
        toPage: `/services/${this.slugify(this.businessProfile.services[0])}`,
        anchorText: this.businessProfile.services[0],
        context: 'Service overview page',
        seoValue: 8,
      },
      {
        fromPage: '/',
        toPage: '/contact',
        anchorText: 'Contact Us',
        context: 'Call-to-action sections',
        seoValue: 7,
      },
    ];
  }
  generateNearbyLocationPages() {
    const { city } = this.businessProfile;
    // This would typically use a location API to find nearby cities
    const nearbyLocations = ['Downtown', 'North Side', 'South Side', 'East Side', 'West Side'];
    return nearbyLocations.map((location) => ({
      title: `${this.businessProfile.services[0]} in ${location} ${city}`,
      url: `/${this.slugify(location)}-${this.slugify(city)}`,
      content: [
        `Local ${this.businessProfile.services[0]} services in ${location}`,
        'Area-specific expertise',
        'Local customer testimonials',
        'Service area coverage',
      ],
      keywords: [location, city, this.businessProfile.services[0], 'local'],
      priority: 7,
    }));
  }
  generateSeasonalContent() {
    const { industry } = this.businessProfile;
    const seasons = [
      { month: 'January', topics: ['New Year specials', 'Winter services'] },
      { month: 'April', topics: ['Spring cleaning', 'Spring services'] },
      { month: 'July', topics: ['Summer specials', 'Vacation services'] },
      { month: 'October', topics: ['Fall preparation', 'Holiday services'] },
    ];
    return seasons.map((season) => ({
      ...season,
      keywords: [...season.topics, industry, 'seasonal'],
    }));
  }
  generateSeasonalKeywords() {
    const { services, industry } = this.businessProfile;
    return [
      {
        keyword: `${services[0]} spring special`,
        months: ['March', 'April', 'May'],
        trend: 'increasing',
      },
      {
        keyword: `${industry} summer services`,
        months: ['June', 'July', 'August'],
        trend: 'stable',
      },
    ];
  }
  generateContentCalendar() {
    const { services, industry, city } = this.businessProfile;
    return [
      {
        month: 'January',
        topics: [
          {
            title: `2025 ${industry} Trends in ${city}`,
            type: 'blog',
            keywords: [industry, 'trends', '2025', city],
            deadline: '2025-01-15',
          },
          {
            title: `${services[0]} New Year Checklist`,
            type: 'resource',
            keywords: [services[0], 'checklist', 'guide'],
            deadline: '2025-01-31',
          },
        ],
      },
    ];
  }
  generateRobotsTxt() {
    return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /temp/

Sitemap: https://yourdomain.com/sitemap.xml`;
  }
  generateCompetitorAnalysis() {
    const { competitors, industry, city } = this.businessProfile;
    return {
      competitors: competitors || [`${industry} ${city}`, `best ${industry} near me`],
      gapAnalysis: [
        'Missing local landing pages',
        'Insufficient customer reviews',
        'Weak service descriptions',
        'No FAQ section',
      ],
      opportunities: [
        'Target long-tail local keywords',
        'Create location-specific content',
        'Improve Google My Business profile',
        'Build local citations',
      ],
    };
  }
  generateActionPlan(recommendations) {
    return {
      immediate: [
        { task: 'Optimize title tags and meta descriptions', impact: 'high', effort: 2 },
        { task: 'Set up Google My Business profile', impact: 'high', effort: 3 },
        { task: 'Create XML sitemap', impact: 'medium', effort: 2 },
        { task: 'Add schema markup', impact: 'high', effort: 4 },
      ],
      shortTerm: [
        { task: 'Create service-specific landing pages', impact: 'high', effort: 8 },
        { task: 'Implement internal linking strategy', impact: 'medium', effort: 6 },
        { task: 'Optimize page loading speed', impact: 'high', effort: 7 },
        { task: 'Build local citations', impact: 'medium', effort: 5 },
      ],
      longTerm: [
        { task: 'Develop content marketing strategy', impact: 'high', effort: 10 },
        { task: 'Build high-quality backlinks', impact: 'high', effort: 9 },
        { task: 'Create location-specific content', impact: 'medium', effort: 8 },
        { task: 'Monitor and adjust SEO strategy', impact: 'medium', effort: 6 },
      ],
    };
  }
  generateEstimatedResults() {
    return {
      timeframe: '3-6 months',
      expectedTrafficIncrease: '150-300%',
      expectedRankingImprovement: 'Top 10 for primary keywords',
      localVisibilityImprovement: 'Top 3 in local map pack',
    };
  }
}
exports.SEORecommendationEngine = SEORecommendationEngine;
