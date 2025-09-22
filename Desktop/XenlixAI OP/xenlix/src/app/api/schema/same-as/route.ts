/**
 * /api/schema/same-as - Social Profile Validation and sameAs Generation API
 * 
 * Validates social media profiles and generates sameAs URLs for Schema.org JSON-LD
 */

import { NextRequest, NextResponse } from 'next/server';
import { JsonLdSchemaMerger } from '@/lib/jsonld-schema-merger';

interface SameAsRequest {
  handle: string;
  canonical: string;
  extras?: string[];
  existingSchemas?: any[];
  businessData?: {
    name: string;
    website?: string;
    description?: string;
    phone?: string;
    address?: string;
    socials?: string[];
  };
  options?: {
    requireMinimum?: number;
    validateReciprocity?: boolean;
    includeReport?: boolean;
  };
}

interface SameAsResponse {
  success: boolean;
  data?: {
    schemas: any[];
    sameAs: string[];
    warnings: string[];
    diff: {
      added: string[];
      removed: string[];
      unchanged: string[];
    };
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    output: {
      prettyJson: string;
      minifiedJson: string;
      htmlScript: string;
    };
    report?: {
      summary: string;
      stats: {
        schemasCount: number;
        sameAsCount: number;
        validationIssues: number;
        richResultsReady: boolean;
      };
      recommendations: string[];
      warnings: string[];
    };
  };
  error?: string;
  duration?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<SameAsResponse>> {
  const startTime = Date.now();

  try {
    const body: SameAsRequest = await request.json();
    
    // Validate required fields
    if (!body.handle) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: handle',
        duration: Date.now() - startTime,
      }, { status: 400 });
    }

    if (!body.canonical) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: canonical',
        duration: Date.now() - startTime,
      }, { status: 400 });
    }

    // Validate canonical URL
    try {
      new URL(body.canonical);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid canonical URL format',
        duration: Date.now() - startTime,
      }, { status: 400 });
    }

    const merger = new JsonLdSchemaMerger();
    let result;

    // Choose processing method based on input
    if (body.existingSchemas && body.existingSchemas.length > 0) {
      // Merge with existing schemas
      result = await merger.mergeWithExistingSchemas(body.existingSchemas, {
        handle: body.handle,
        canonical: body.canonical,
        extras: body.extras,
      });
    } else if (body.businessData) {
      // Generate new Phase 2 schemas
      result = await merger.enhancePhase2Schemas(body.businessData, {
        handle: body.handle,
        canonical: body.canonical,
        extras: body.extras,
      });
    } else {
      // Generate minimal schemas
      result = await merger.enhancePhase2Schemas({
        name: body.handle,
        website: body.canonical,
      }, {
        handle: body.handle,
        canonical: body.canonical,
        extras: body.extras,
      });
    }

    // Check minimum requirement
    const minimumRequired = body.options?.requireMinimum || 5;
    if (result.sameAsResult.validUrls.length < minimumRequired) {
      result.sameAsResult.warnings.push(
        `Only ${result.sameAsResult.validUrls.length} valid profiles found, minimum ${minimumRequired} required`
      );
    }

    // Generate comprehensive report if requested
    let report;
    if (body.options?.includeReport !== false) {
      report = merger.generateComprehensiveReport(result);
    }

    const response: SameAsResponse = {
      success: true,
      data: {
        schemas: result.schemas,
        sameAs: result.sameAsResult.validUrls,
        warnings: result.sameAsResult.warnings,
        diff: result.diff,
        validation: result.validation,
        output: result.output,
        ...(report && { report }),
      },
      duration: Date.now() - startTime,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('SameAs API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get('handle');
  const canonical = searchParams.get('canonical');

  if (!handle || !canonical) {
    return NextResponse.json({
      success: false,
      error: 'Missing required parameters: handle and canonical',
    }, { status: 400 });
  }

  // Convert GET params to POST format
  const body: SameAsRequest = {
    handle,
    canonical,
    extras: searchParams.get('extras')?.split(',').filter(Boolean) || [],
    options: {
      includeReport: searchParams.get('includeReport') !== 'false',
      requireMinimum: parseInt(searchParams.get('requireMinimum') || '5'),
    },
  };

  // Redirect to POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  }));
}

// OPTIONS for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}