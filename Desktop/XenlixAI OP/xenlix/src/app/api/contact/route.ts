import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Resend } from 'resend';
import { generateAdminNotificationEmail, generateAutoReplyEmail } from '@/components/emails/contact-emails';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Prevent execution during build time
export const runtime = 'nodejs';

// Initialize clients
const prisma = new PrismaClient();

// Initialize Resend only if API key is available
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - email functionality disabled');
    return null;
  }
  return new Resend(apiKey);
}

// Validation schema
const contactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, contactSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { name, email, company, message } = validation.data;
    
    // Save to database
    const lead = await (prisma as any).lead.create({
      data: {
        name,
        email,
        company,
        message,
      },
    });

    // Send notification email to admin
    try {
      const resend = getResendClient();
      if (resend) {
        const adminEmailHtml = generateAdminNotificationEmail({
          name,
          email,
          company,
          message,
          leadId: lead.id,
          submittedAt: new Date().toLocaleString()
        });

        await resend.emails.send({
          from: 'noreply@xenlix.ai',
          to: [process.env.ADMIN_EMAIL || 'admin@xenlix.ai'],
          subject: `New Lead: ${name} from ${company}`,
          html: adminEmailHtml,
        });
      }
    } catch (emailError) {
      // Continue processing even if email fails
      console.error('Admin email error:', emailError);
    }

    // Send auto-reply to the user
    try {
      const resend = getResendClient();
      if (resend) {
        const autoReplyHtml = generateAutoReplyEmail({
          name,
          email,
          company,
          message
        });

        await resend.emails.send({
          from: 'noreply@xenlix.ai',
          to: [email],
          subject: 'Thank you for contacting XenlixAI',
          html: autoReplyHtml,
        });
      }
    } catch (autoReplyError) {
      console.error('Auto-reply email error:', autoReplyError);
      // Continue processing even if auto-reply fails
    }

    return createSuccessResponse({
      message: 'Thank you for your message. We\'ll get back to you soon!',
      leadId: lead.id
    });
    
  } catch (error) {
    return createErrorResponse('Something went wrong. Please try again later.', 500);
  }
}