import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { pdf } from '@react-pdf/renderer';
import { z } from 'zod';
import { AEOReportPDF } from '@/components/pdf/AEOReportPDF';

// Request schema validation
const exportPDFRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  results: z.object({
    overallScore: z.number(),
    aeoScore: z.any().optional(),
    crawlData: z.any().optional(),
    lighthouseAudit: z.any().optional(),
    timestamp: z.string()
  }),
  reportTitle: z.string().optional().default('AEO Analysis Report')
});

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = exportPDFRequestSchema.parse(body);
    
    const { url, results, reportTitle } = validatedData;

    // Generate PDF
    const pdfStream = await pdf(
      AEOReportPDF({ 
        data: results, 
        url: url, 
        reportTitle: reportTitle 
      })
    ).toBuffer();

    // Generate filename
    const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `aeo-report-${sanitizedUrl}-${timestamp}.pdf`;

    // Return PDF as download
    return new NextResponse(pdfStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfStream.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('PDF export error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate PDF export', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}