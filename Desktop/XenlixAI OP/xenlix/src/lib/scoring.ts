interface TechSignals {
  hasJSONLD: boolean;
  hasSitemap: boolean;
  hasRobots: boolean;
  https: boolean;
  canonical?: string;
  metaDescription?: string;
  pageSpeedHint?: 'fast' | 'avg' | 'slow';
}

interface SEOSnippets {
  title: string;
  description: string;
  h1: string;
}

interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  website: string;
  socials: string[];
  hours?: string[];
  lat?: number;
  lng?: number;
}

interface ScoreBreakdown {
  totalScore: number;
  breakdown: {
    jsonLD: number;
    https: number;
    canonical: number;
    metaDescription: number;
    sitemap: number;
    robots: number;
    title: number;
    h1: number;
    contactInfo: number;
  };
}

export function computePreviewScore(
  techSignals: TechSignals,
  seoSnippets: SEOSnippets,
  businessInfo: BusinessInfo
): ScoreBreakdown {
  let score = 0;
  const breakdown = {
    jsonLD: 0,
    https: 0,
    canonical: 0,
    metaDescription: 0,
    sitemap: 0,
    robots: 0,
    title: 0,
    h1: 0,
    contactInfo: 0,
  };

  // +20 hasJSONLD
  if (techSignals.hasJSONLD) {
    breakdown.jsonLD = 20;
    score += 20;
  }

  // +10 https
  if (techSignals.https) {
    breakdown.https = 10;
    score += 10;
  }

  // +10 canonical
  if (techSignals.canonical) {
    breakdown.canonical = 10;
    score += 10;
  }

  // +10 metaDescription
  if (techSignals.metaDescription) {
    breakdown.metaDescription = 10;
    score += 10;
  }

  // +10 sitemap/robots (5 each)
  if (techSignals.hasSitemap) {
    breakdown.sitemap = 5;
    score += 5;
  }
  if (techSignals.hasRobots) {
    breakdown.robots = 5;
    score += 5;
  }

  // +10 title length 35–65 chars else +5 if present
  const titleLength = seoSnippets.title.length;
  if (titleLength >= 35 && titleLength <= 65) {
    breakdown.title = 10;
    score += 10;
  } else if (seoSnippets.title && titleLength > 0) {
    breakdown.title = 5;
    score += 5;
  }

  // +10 H1 present and meaningful
  if (seoSnippets.h1 && seoSnippets.h1.length > 5 && seoSnippets.h1 !== 'No H1 found') {
    breakdown.h1 = 10;
    score += 10;
  }

  // +10 contact info present (phone OR address)
  if (businessInfo.phone || businessInfo.address) {
    breakdown.contactInfo = 10;
    score += 10;
  }

  // Cap at 100
  const totalScore = Math.min(score, 100);

  return {
    totalScore,
    breakdown
  };
}

export function generateMockTimeseries(currentScore: number): Array<{ time: string; score: number }> {
  const startScore = Math.max(0, currentScore - 15);
  const dataPoints = [];
  
  for (let i = 0; i < 12; i++) {
    // Easing function: quadratic ease-out
    const progress = i / 11;
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    const score = Math.round(startScore + (currentScore - startScore) * easedProgress);
    
    // Generate time labels (last 12 periods)
    const hoursAgo = 11 - i;
    const timeLabel = hoursAgo === 0 ? 'Now' : `${hoursAgo}h ago`;
    
    dataPoints.push({
      time: timeLabel,
      score: score
    });
  }
  
  return dataPoints;
}

export function buildPreviewBenefits(data: {
  techSignals: TechSignals;
  businessInfo: BusinessInfo;
  quickFindings: string[];
}): string[] {
  const benefits: string[] = [];
  
  // Rule: If no JSON-LD → include "Add complete JSON-LD to become answer-ready."
  if (!data.techSignals.hasJSONLD) {
    benefits.push("Add complete JSON-LD to become answer-ready");
  }
  
  // Rule: If no phone/address → include "Strengthen local trust signals (NAP consistency)."
  if (!data.businessInfo.phone || !data.businessInfo.address) {
    benefits.push("Strengthen local trust signals (NAP consistency)");
  }
  
  // Rule: If no canonical → include canonical as specific action
  if (!data.techSignals.canonical) {
    benefits.push("Implement canonical URLs to prevent duplicate content issues");
  }
  
  // Rule: If no meta description → include meta description as specific action
  if (!data.techSignals.metaDescription) {
    benefits.push("Add optimized meta descriptions for better AI snippet performance");
  }
  
  // Rule: Always include one benefit bullet
  const hasGoodFoundation = data.techSignals.hasJSONLD && data.businessInfo.phone && data.techSignals.https;
  if (hasGoodFoundation) {
    benefits.push("Higher AI visibility across ChatGPT, Claude, and Perplexity");
  } else {
    benefits.push("Better answer-engine ranking and discoverability");
  }
  
  // Limit to 3-4 bullets for clean presentation
  return benefits.slice(0, 4);
}