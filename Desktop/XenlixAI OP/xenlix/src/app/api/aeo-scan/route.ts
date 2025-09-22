import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBusinessProfileFromUrl } from "@/lib/business-profile-extractor";

export const runtime = "nodejs";

const prisma = new PrismaClient();

interface AEOScanRequest {
  websiteUrl: string;
  businessName: string;
  businessDescription: string;
  industry: string;
}

// Mock AEO audit function (replace with real AI service)
async function performAEOAudit(formData: AEOScanRequest) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock audit results based on URL analysis
  const baseScore = 25 + Math.floor(Math.random() * 40); // Score between 25-65 to show improvement needed
  
  const faqSchemaPresent = Math.random() > 0.7;
  const howToContentPresent = Math.random() > 0.6;
  const entityOptimized = Math.random() > 0.8;
  const structuredDataPresent = Math.random() > 0.5;

  const weakPoints = [];
  const strengths = [];

  // Generate weak points (most sites will have several)
  if (!faqSchemaPresent) {
    weakPoints.push({
      category: 'FAQ Schema',
      severity: 'high',
      description: 'Missing FAQ structured data prevents AI engines from understanding your common questions',
      impact: 'High - AI engines can\'t extract Q&A content'
    });
  } else {
    strengths.push('FAQ Schema implemented');
  }

  if (!howToContentPresent) {
    weakPoints.push({
      category: 'Problem: Customers Can\'t Find Your Expertise',
      severity: 'medium',
      description: 'Your website lacks step-by-step guides that AI engines recommend to users seeking solutions.',
      impact: 'Why it matters: When customers ask AI "how to solve X," your competitors with instructional content get recommended instead of you—losing you qualified leads who are actively seeking help.'
    });
  } else {
    strengths.push('How-To content detected');
  }

  if (!entityOptimized) {
    weakPoints.push({
      category: 'Entity Optimization',
      severity: 'high',
      description: 'Business entity not properly defined for knowledge graph integration',
      impact: 'High - Poor AI understanding of your business'
    });
  } else {
    strengths.push('Entity optimization in place');
  }

  if (!structuredDataPresent) {
    weakPoints.push({
      category: 'Structured Data',
      severity: 'medium',
      description: 'Missing JSON-LD markup for better AI comprehension',
      impact: 'Medium - Limited AI engine understanding'
    });
  }

  // Always add some improvement opportunities
  weakPoints.push({
    category: 'Problem: AI Doesn\'t Understand Your Value',
    severity: 'medium',
    description: 'Your content isn\'t written in the conversational style that AI engines prefer when answering customer questions.',
    impact: 'Why it matters: When customers ask AI for business recommendations, unclear messaging means you get overlooked for competitors who communicate more directly—resulting in lost opportunities worth thousands in potential revenue.'
  });

  return {
    overallScore: baseScore,
    maxScore: 100,
    weakPoints,
    strengths,
    recommendations: [
      'Implement FAQ schema markup',
      'Add how-to structured content',
      'Optimize entity definitions',
      'Enhance conversational content'
    ],
    aiReadinessLevel: baseScore < 40 ? 'Poor' : baseScore < 60 ? 'Fair' : baseScore < 80 ? 'Good' : 'Excellent'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AEOScanRequest;
    
    const { websiteUrl, businessName, businessDescription, industry } = body;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: "Please enter a valid website URL" },
        { status: 400 }
      );
    }

    // Step 1: Extract business profile information from the website
    console.log(`🔍 Extracting business profile for: ${websiteUrl}`);
    const businessProfile = await getBusinessProfileFromUrl(websiteUrl);
    
    // Use extracted data as fallbacks for missing form data
    const finalBusinessData = {
      name: businessName || businessProfile.businessName || 'Unknown Business',
      description: businessDescription || `Business website: ${websiteUrl}`,
      industry: industry || 'Not specified',
      address: businessProfile.address,
      phone: businessProfile.phone,
      email: businessProfile.email,
      website: businessProfile.website || websiteUrl,
      hours: businessProfile.hours,
      googleReviewCount: businessProfile.googleReviewCount,
      googleRating: businessProfile.googleRating,
      logoUrl: businessProfile.logoUrl,
      socialProfiles: businessProfile.socialProfiles
    };

    // Step 2: Perform AEO audit with enriched business data
    const auditResults = await performAEOAudit({
      websiteUrl,
      businessName: finalBusinessData.name,
      businessDescription: finalBusinessData.description,
      industry: finalBusinessData.industry
    });

    // Step 3: Store audit in database with complete business profile
    // Workaround: Prisma type expects user relation in create input variant. Since user is optional, use unchecked create shape via type assertion.
    // In future: determine userId from session and include explicitly.
    const aeoAudit = await (prisma.aeoAudit as any).create({
      data: {
        websiteUrl,
        businessInfo: finalBusinessData,
        auditResults,
        status: 'completed'
      }
    });

    // Step 4: Return results with business profile
    return NextResponse.json({ 
      success: true, 
      auditId: aeoAudit.id,
      businessProfile: finalBusinessData,
      previewResults: {
        overallScore: auditResults.overallScore,
        weakPointsCount: auditResults.weakPoints.length,
        aiReadinessLevel: auditResults.aiReadinessLevel
      }
    });

  } catch (error) {
    console.error('AEO scan error:', error);
    return NextResponse.json(
      { error: "Failed to perform AEO audit. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get('auditId');

  if (!auditId) {
    return NextResponse.json(
      { error: "Audit ID is required" },
      { status: 400 }
    );
  }

  try {
    const audit = await prisma.aeoAudit.findUnique({
      where: { id: auditId }
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json(
      { error: "Failed to fetch audit results" },
      { status: 500 }
    );
  }
}