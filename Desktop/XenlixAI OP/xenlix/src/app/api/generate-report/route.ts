import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audit data from request body
    const auditData = await request.json();

    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Generate HTML content for the PDF
    const htmlContent = generateReportHTML(auditData, session.user.email);

    // Set page content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Generate PDF with custom styling
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    // Close browser
    await browser.close();

    // Return PDF as response (use standard Response to satisfy BodyInit types)
    // Ensure we pass a proper ArrayBuffer to Blob
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );
    const pdfBlob = new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });
    return new Response(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Xenlix_AEO_Report.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF report' }, { status: 500 });
  }
}

function generateReportHTML(auditData: any, userEmail: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>XenlixAI AEO Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          min-height: 100vh;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
          min-height: 100vh;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #00D4FF;
        }
        
        .logo {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00D4FF, #FF6B9D);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .report-title {
          font-size: 1.8rem;
          color: #1e293b;
          margin-bottom: 10px;
        }
        
        .report-meta {
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .section {
          margin-bottom: 30px;
          padding: 20px;
          border-radius: 8px;
          background: #f8fafc;
          border-left: 4px solid #00D4FF;
        }
        
        .section-title {
          font-size: 1.4rem;
          color: #1e293b;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          margin-right: 20px;
        }
        
        .score-high { background: linear-gradient(135deg, #10b981, #059669); }
        .score-medium { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .score-low { background: linear-gradient(135deg, #ef4444, #dc2626); }
        
        .priority-fix {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
        }
        
        .priority-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00D4FF, #0ea5e9);
          color: white;
          font-weight: bold;
          margin-right: 15px;
        }
        
        .fix-title {
          font-size: 1.1rem;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        
        .fix-description {
          color: #64748b;
          margin-bottom: 15px;
        }
        
        .code-block {
          background: #1e293b;
          color: #10b981;
          padding: 15px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        
        .impact-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          color: white;
          margin-right: 10px;
        }
        
        .impact-high { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .impact-medium { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .impact-low { background: linear-gradient(135deg, #10b981, #059669); }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #00D4FF;
        }
        
        .stat-label {
          color: #64748b;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">XenlixAI</div>
          <h1 class="report-title">AEO & SEO Audit Report</h1>
          <div class="report-meta">
            Generated for: ${userEmail}<br>
            Date: ${currentDate}
          </div>
        </div>
        
        <!-- Overall Score Section -->
        <div class="section">
          <h2 class="section-title">
            <div class="score-circle ${auditData.overallScore >= 80 ? 'score-high' : auditData.overallScore >= 60 ? 'score-medium' : 'score-low'}">
              ${auditData.overallScore}/100
            </div>
            Overall Performance Score
          </h2>
          <p>Your website's current AEO and SEO performance rating based on comprehensive analysis.</p>
        </div>
        
        <!-- Key Statistics -->
        <div class="section">
          <h2 class="section-title">Key Metrics</h2>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-number">${auditData.traffic.current.toLocaleString()}</div>
              <div class="stat-label">Monthly Traffic</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">+${auditData.traffic.change}%</div>
              <div class="stat-label">Growth Rate</div>
            </div>
          </div>
        </div>
        
        <!-- Priority Fixes Section -->
        <div class="section">
          <h2 class="section-title">🚨 Priority Quick Fixes</h2>
          <p>Implement these fixes immediately for maximum impact on your search visibility:</p>
          
          ${auditData.priorityFixes
            .map(
              (fix: any, index: number) => `
            <div class="priority-fix">
              <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                <span class="priority-number">${index + 1}</span>
                <div style="flex: 1;">
                  <div class="fix-title">${fix.title}</div>
                  <span class="impact-badge impact-${fix.impact.toLowerCase()}">${fix.impact} Impact</span>
                  <span class="impact-badge" style="background: #3b82f6;">${fix.effort} Effort</span>
                </div>
              </div>
              <div class="fix-description">${fix.description}</div>
              <div class="code-block">${fix.code}</div>
            </div>
          `
            )
            .join('')}
        </div>
        
        <!-- Category Breakdown -->
        <div class="section">
          <h2 class="section-title">Performance Breakdown</h2>
          ${auditData.categoryBreakdown
            .map(
              (category: any) => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-weight: bold;">${category.category}</span>
                <span style="color: ${category.score >= 70 ? '#10b981' : category.score >= 50 ? '#f59e0b' : '#ef4444'};">
                  ${category.score}/100
                </span>
              </div>
              <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="
                  width: ${category.score}%; 
                  height: 100%; 
                  background: ${
                    category.score >= 70
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : category.score >= 50
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #ef4444, #dc2626)'
                  };
                "></div>
              </div>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 2px;">
                ${category.issues} issues found
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        
        <!-- Competitor Analysis -->
        <div class="section">
          <h2 class="section-title">Competitive Position</h2>
          ${auditData.competitorAnalysis
            .map(
              (competitor: any) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <div>
                <div style="font-weight: bold;">${competitor.competitor}</div>
                <div style="font-size: 0.85rem; color: #64748b;">Score: ${competitor.score}/100</div>
              </div>
              <div style="text-align: right;">
                <div style="color: #ef4444; font-weight: bold;">-${competitor.gap} points</div>
                <div style="font-size: 0.85rem; color: #64748b;">behind you</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>Generated by XenlixAI</strong></p>
          <p>For implementation support, visit your dashboard or contact our team.</p>
          <p style="margin-top: 10px; font-size: 0.8rem;">
            This report contains proprietary analysis. Please do not share without permission.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
