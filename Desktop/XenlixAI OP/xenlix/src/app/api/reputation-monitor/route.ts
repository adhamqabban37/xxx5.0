/**
 * Reputation & Entity Monitor API
 * Monitors business reputation across platforms and AI engines for consistency
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { BusinessExtractor } from '@/lib/business-extractor';
import { HuggingFaceClient } from '@/lib/huggingface-client';

interface ReviewData {
  id: string;
  platform: 'google' | 'yelp' | 'facebook';
  author: string;
  rating: number;
  text: string;
  date: string;
  isNew: boolean;
}

interface BusinessProfileData {
  platform: 'google' | 'yelp' | 'facebook';
  name: string;
  address: string;
  phone: string;
  website: string;
  hours: any;
  rating: number;
  reviewCount: number;
  lastUpdated: string;
}

interface AIEntityDescription {
  engine: 'ChatGPT' | 'Perplexity' | 'Bing Copilot';
  description: string;
  confidence: number;
  keyEntities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  accuracy: number;
}

interface EntityConsistency {
  status: 'OK' | 'Minor Issues' | 'Major Mismatch';
  details: string;
  issues: {
    field: string;
    platforms: string[];
    values: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
}

interface ReputationAlert {
  id: string;
  type: 'negative_review' | 'rating_drop' | 'info_mismatch' | 'ai_description_issue';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  platform?: string;
  actionRequired: string;
  timestamp: string;
}

interface ReputationMonitorResult {
  newReviews: ReviewData[];
  ratingChange: string;
  entityConsistency: EntityConsistency;
  aiSummaries: {
    ChatGPT: string;
    Perplexity: string;
    'Bing Copilot': string;
  };
  alerts: ReputationAlert[];
  businessProfiles: BusinessProfileData[];
  overallHealth: number;
  lastChecked: string;
}

// Simulate platform monitoring (in production, integrate with actual APIs)
class PlatformMonitor {
  private hfClient: HuggingFaceClient;

  constructor() {
    this.hfClient = new HuggingFaceClient();
  }

  async getGoogleBusinessProfile(
    businessName: string,
    location?: string
  ): Promise<BusinessProfileData> {
    // Simulate Google Business Profile data
    return {
      platform: 'google',
      name: businessName,
      address: location || '123 Main St, City, State 12345',
      phone: '(555) 123-4567',
      website: 'https://business.com',
      hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed',
      },
      rating: 4.2 + Math.random() * 0.6, // Simulate rating between 4.2-4.8
      reviewCount: Math.floor(Math.random() * 200) + 50,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getYelpProfile(businessName: string, location?: string): Promise<BusinessProfileData> {
    // Simulate Yelp profile data
    return {
      platform: 'yelp',
      name: businessName,
      address: location || '123 Main Street, City, ST 12345', // Slightly different format
      phone: '555-123-4567', // Different phone format
      website: 'https://business.com',
      hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed',
      },
      rating: 4.0 + Math.random() * 0.8, // Simulate rating between 4.0-4.8
      reviewCount: Math.floor(Math.random() * 150) + 30,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getFacebookProfile(businessName: string, location?: string): Promise<BusinessProfileData> {
    // Simulate Facebook business page data
    return {
      platform: 'facebook',
      name: businessName + ' LLC', // Slightly different business name
      address: location || '123 Main St, City, State',
      phone: '(555) 123-4567',
      website: 'https://business.com',
      hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed',
      },
      rating: 4.5 + Math.random() * 0.5, // Facebook ratings tend to be higher
      reviewCount: Math.floor(Math.random() * 100) + 20,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getRecentReviews(businessName: string): Promise<ReviewData[]> {
    // Simulate recent reviews from different platforms
    const sampleReviews = [
      {
        platform: 'google' as const,
        author: 'John D.',
        rating: 5,
        text: 'Excellent service and professional staff. Highly recommend!',
        sentiment: 'positive',
      },
      {
        platform: 'yelp' as const,
        author: 'Sarah M.',
        rating: 4,
        text: 'Good experience overall. Staff was helpful and knowledgeable.',
        sentiment: 'positive',
      },
      {
        platform: 'facebook' as const,
        author: 'Mike R.',
        rating: 2,
        text: 'Service was slow and staff seemed unprepared. Expected better.',
        sentiment: 'negative',
      },
      {
        platform: 'google' as const,
        author: 'Lisa K.',
        rating: 5,
        text: 'Amazing experience! Will definitely be coming back.',
        sentiment: 'positive',
      },
      {
        platform: 'yelp' as const,
        author: 'David P.',
        rating: 3,
        text: 'Average service. Nothing special but got the job done.',
        sentiment: 'neutral',
      },
    ];

    // Return 2-4 random reviews as "new"
    const numReviews = Math.floor(Math.random() * 3) + 2;
    const selectedReviews = sampleReviews
      .sort(() => 0.5 - Math.random())
      .slice(0, numReviews)
      .map((review, index) => ({
        id: `review_${Date.now()}_${index}`,
        platform: review.platform,
        author: review.author,
        rating: review.rating,
        text: review.text,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last week
        isNew: true,
      }));

    return selectedReviews;
  }
}

class AIEntityAnalyzer {
  private hfClient: HuggingFaceClient;

  constructor() {
    this.hfClient = new HuggingFaceClient();
  }

  async queryAIEngine(
    engine: 'ChatGPT' | 'Perplexity' | 'Bing Copilot',
    businessName: string
  ): Promise<AIEntityDescription> {
    // Simulate AI engine responses about the business
    const responses = {
      ChatGPT: {
        descriptions: [
          `${businessName} is a professional service provider known for their expertise and customer-focused approach. They offer comprehensive solutions with a strong reputation in the local market.`,
          `${businessName} operates as a leading business in their industry, providing high-quality services to customers. They are recognized for their professional standards and commitment to excellence.`,
          `${businessName} is an established company that specializes in delivering reliable services. They have built a strong customer base through consistent quality and professional service delivery.`,
        ],
        entities: ['professional services', 'customer service', 'quality', 'expertise'],
        sentiment: 'positive' as const,
        confidence: 85 + Math.random() * 10,
      },
      Perplexity: {
        descriptions: [
          `According to available data, ${businessName} is a business entity that provides services in their sector. Recent information shows they maintain active operations with customer engagement.`,
          `${businessName} appears to be a service-oriented business with documented customer interactions and business operations. Data suggests they maintain regular business hours and service delivery.`,
          `Based on multiple sources, ${businessName} operates as a business provider with established service offerings and customer base in their operational area.`,
        ],
        entities: ['business entity', 'service provider', 'operations', 'customers'],
        sentiment: 'neutral' as const,
        confidence: 75 + Math.random() * 15,
      },
      'Bing Copilot': {
        descriptions: [
          `${businessName} is a local business that serves customers in their area. They offer various services and can be contacted through their business listing information.`,
          `${businessName} operates as a business service provider with contact information and location details available through business directories and online presence.`,
          `${businessName} is listed as an active business with service offerings. Their business information includes contact details and operational status in local business directories.`,
        ],
        entities: ['local business', 'service provider', 'contact information', 'business listing'],
        sentiment: 'neutral' as const,
        confidence: 70 + Math.random() * 20,
      },
    };

    const engineData = responses[engine];
    const selectedDescription =
      engineData.descriptions[Math.floor(Math.random() * engineData.descriptions.length)];

    return {
      engine,
      description: selectedDescription,
      confidence: engineData.confidence,
      keyEntities: engineData.entities,
      sentiment: engineData.sentiment,
      accuracy: 80 + Math.random() * 15, // Random accuracy between 80-95%
    };
  }

  async analyzeAllEngines(businessName: string): Promise<Record<string, string>> {
    const engines: Array<'ChatGPT' | 'Perplexity' | 'Bing Copilot'> = [
      'ChatGPT',
      'Perplexity',
      'Bing Copilot',
    ];
    const results: Record<string, string> = {};

    for (const engine of engines) {
      const analysis = await this.queryAIEngine(engine, businessName);
      results[engine] = analysis.description;
    }

    return results;
  }
}

class EntityConsistencyChecker {
  checkConsistency(profiles: BusinessProfileData[]): EntityConsistency {
    const issues: EntityConsistency['issues'] = [];

    // Check name consistency
    const names = profiles.map((p) => p.name.toLowerCase().trim());
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length > 1) {
      issues.push({
        field: 'Business Name',
        platforms: profiles.map((p) => p.platform),
        values: profiles.map((p) => p.name),
        severity: 'medium',
      });
    }

    // Check phone consistency
    const phones = profiles.map((p) => p.phone.replace(/\D/g, '')); // Remove formatting
    const uniquePhones = [...new Set(phones)];
    if (uniquePhones.length > 1) {
      issues.push({
        field: 'Phone Number',
        platforms: profiles.map((p) => p.platform),
        values: profiles.map((p) => p.phone),
        severity: 'high',
      });
    }

    // Check address consistency (basic comparison)
    const addresses = profiles.map((p) => p.address.toLowerCase().replace(/[^\w\s]/g, ''));
    const addressSimilarity = this.calculateAddressSimilarity(addresses);
    if (addressSimilarity < 0.8) {
      issues.push({
        field: 'Address',
        platforms: profiles.map((p) => p.platform),
        values: profiles.map((p) => p.address),
        severity: 'high',
      });
    }

    // Check website consistency
    const websites = profiles.map((p) => p.website?.toLowerCase() || '');
    const uniqueWebsites = [...new Set(websites.filter((w) => w))];
    if (uniqueWebsites.length > 1) {
      issues.push({
        field: 'Website',
        platforms: profiles.map((p) => p.platform),
        values: profiles.map((p) => p.website || 'Not specified'),
        severity: 'medium',
      });
    }

    // Determine overall status
    const highSeverityIssues = issues.filter((i) => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter((i) => i.severity === 'medium').length;

    let status: EntityConsistency['status'];
    let details: string;

    if (highSeverityIssues > 0) {
      status = 'Major Mismatch';
      details = `Found ${highSeverityIssues} critical inconsistencies that need immediate attention.`;
    } else if (mediumSeverityIssues > 0) {
      status = 'Minor Issues';
      details = `Found ${mediumSeverityIssues} minor inconsistencies that should be addressed.`;
    } else {
      status = 'OK';
      details = 'All business information is consistent across platforms.';
    }

    return {
      status,
      details,
      issues,
    };
  }

  private calculateAddressSimilarity(addresses: string[]): number {
    if (addresses.length <= 1) return 1;

    // Simple similarity calculation based on common words
    const addressWords = addresses.map((addr) => addr.split(/\s+/));
    const allWords = [...new Set(addressWords.flat())];

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < addressWords.length; i++) {
      for (let j = i + 1; j < addressWords.length; j++) {
        const words1 = new Set(addressWords[i]);
        const words2 = new Set(addressWords[j]);
        const intersection = new Set([...words1].filter((w) => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        totalSimilarity += intersection.size / union.size;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1;
  }
}

class ReputationAlertGenerator {
  generateAlerts(
    newReviews: ReviewData[],
    ratingChanges: { platform: string; change: number }[],
    consistency: EntityConsistency,
    aiDescriptions: Record<string, string>
  ): ReputationAlert[] {
    const alerts: ReputationAlert[] = [];

    // Alert for negative reviews
    const negativeReviews = newReviews.filter((r) => r.rating <= 2);
    negativeReviews.forEach((review) => {
      alerts.push({
        id: `negative_review_${review.id}`,
        type: 'negative_review',
        severity: review.rating === 1 ? 'high' : 'medium',
        title: `New ${review.rating}-star review on ${review.platform}`,
        description: `"${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}"`,
        platform: review.platform,
        actionRequired: 'Consider responding professionally to address concerns',
        timestamp: new Date().toISOString(),
      });
    });

    // Alert for rating drops
    const significantDrops = ratingChanges.filter((change) => change.change < -0.1);
    significantDrops.forEach((change) => {
      alerts.push({
        id: `rating_drop_${change.platform}`,
        type: 'rating_drop',
        severity: change.change < -0.3 ? 'high' : 'medium',
        title: `Rating dropped on ${change.platform}`,
        description: `Average rating decreased by ${Math.abs(change.change).toFixed(1)} stars`,
        platform: change.platform,
        actionRequired: 'Monitor recent reviews and consider customer outreach',
        timestamp: new Date().toISOString(),
      });
    });

    // Alert for entity mismatches
    if (consistency.status !== 'OK') {
      const severity = consistency.status === 'Major Mismatch' ? 'high' : 'medium';
      alerts.push({
        id: `entity_mismatch_${Date.now()}`,
        type: 'info_mismatch',
        severity,
        title: `Business information inconsistencies detected`,
        description: consistency.details,
        actionRequired: 'Update business information across all platforms to ensure consistency',
        timestamp: new Date().toISOString(),
      });
    }

    // Alert for AI description issues
    const shortDescriptions = Object.entries(aiDescriptions).filter(
      ([engine, desc]) =>
        desc.length < 50 || desc.includes('no information') || desc.includes('not found')
    );

    if (shortDescriptions.length > 0) {
      alerts.push({
        id: `ai_description_issue_${Date.now()}`,
        type: 'ai_description_issue',
        severity: 'medium',
        title: `AI engines have limited information about your business`,
        description: `${shortDescriptions.length} AI engines provided minimal descriptions`,
        actionRequired:
          'Improve online presence and content to help AI engines understand your business better',
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { url, businessName } = body;

    if (!url || !businessName) {
      return NextResponse.json({ error: 'URL and business name are required' }, { status: 400 });
    }

    // Extract business information for context
    const businessExtractor = new BusinessExtractor();
    const businessInfo = await businessExtractor.extractBusinessInfo(url);

    const platformMonitor = new PlatformMonitor();
    const aiAnalyzer = new AIEntityAnalyzer();
    const consistencyChecker = new EntityConsistencyChecker();
    const alertGenerator = new ReputationAlertGenerator();

    // Get business profiles from all platforms
    const location = businessInfo?.location?.address?.formattedAddress;
    const [googleProfile, yelpProfile, facebookProfile] = await Promise.all([
      platformMonitor.getGoogleBusinessProfile(businessName, location),
      platformMonitor.getYelpProfile(businessName, location),
      platformMonitor.getFacebookProfile(businessName, location),
    ]);

    const businessProfiles = [googleProfile, yelpProfile, facebookProfile];

    // Get recent reviews
    const newReviews = await platformMonitor.getRecentReviews(businessName);

    // Calculate rating changes (mock previous ratings)
    const ratingChanges = businessProfiles.map((profile) => ({
      platform: profile.platform,
      change: (Math.random() - 0.5) * 0.4, // Random change between -0.2 and +0.2
    }));

    const overallRatingChange =
      ratingChanges.reduce((sum, change) => sum + change.change, 0) / ratingChanges.length;
    const ratingChangeStr =
      overallRatingChange >= 0
        ? `+${overallRatingChange.toFixed(1)} stars`
        : `${overallRatingChange.toFixed(1)} stars`;

    // Get AI engine descriptions
    const aiSummaries = await aiAnalyzer.analyzeAllEngines(businessName);

    // Check entity consistency
    const entityConsistency = consistencyChecker.checkConsistency(businessProfiles);

    // Generate alerts
    const alerts = alertGenerator.generateAlerts(
      newReviews,
      ratingChanges,
      entityConsistency,
      aiSummaries
    );

    // Calculate overall health score
    const avgRating =
      businessProfiles.reduce((sum, p) => sum + p.rating, 0) / businessProfiles.length;
    const consistencyScore =
      entityConsistency.status === 'OK'
        ? 100
        : entityConsistency.status === 'Minor Issues'
          ? 70
          : 40;
    const reputationScore = Math.max(
      0,
      100 -
        alerts.filter((a) => a.severity === 'high').length * 20 -
        alerts.filter((a) => a.severity === 'medium').length * 10
    );

    const overallHealth = Math.round(
      (avgRating / 5) * 40 + consistencyScore * 0.3 + reputationScore * 0.3
    );

    const result: ReputationMonitorResult = {
      newReviews,
      ratingChange: ratingChangeStr,
      entityConsistency,
      aiSummaries: aiSummaries as any,
      alerts,
      businessProfiles,
      overallHealth: Math.min(100, Math.max(0, overallHealth)),
      lastChecked: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        businessName,
        url,
        platformsChecked: businessProfiles.length,
        aiEnginesQueried: Object.keys(aiSummaries).length,
        processingTime: Date.now(),
      },
    });
  } catch (error) {
    console.error('Reputation Monitor API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
