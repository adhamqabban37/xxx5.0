import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
      category: 'How-To Content',
      severity: 'medium',
      description: 'No step-by-step instructional content detected for AI engines',
      impact: 'Medium - Missing instructional content opportunities'
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
    category: 'AI Content Optimization',
    severity: 'medium',
    description: 'Content not optimized for conversational AI responses',
    impact: 'Medium - Missing AI search visibility'
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

    if (!websiteUrl || !businessName) {
      return NextResponse.json(
        { error: "Website URL and business name are required" },
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

    // Perform AEO audit
    const auditResults = await performAEOAudit(body);

    // Store audit in database
    const aeoAudit = await prisma.aeoAudit.create({
      data: {
        // userId is now optional - omit for anonymous scans
        websiteUrl,
        businessInfo: {
          name: businessName,
          description: businessDescription,
          industry
        },
        auditResults,
        status: 'completed'
      }
    });

    return NextResponse.json({ 
      success: true, 
      auditId: aeoAudit.id,
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