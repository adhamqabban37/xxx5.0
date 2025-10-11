interface LeadData {
  name: string;
  email: string;
  company: string;
  message: string;
}

interface LeadEmailProps extends LeadData {
  leadId: string;
  submittedAt: string;
}

export function generateAdminNotificationEmail({
  name,
  email,
  company,
  message,
  leadId,
  submittedAt,
}: LeadEmailProps): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px;">New Lead from XenlixAI Contact Form</h1>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Contact Information</h2>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px;">
            <p style="margin: 8px 0; color: #374151;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #3b82f6;">${email}</a></p>
            <p style="margin: 8px 0; color: #374151;"><strong>Company:</strong> ${company}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Message</h2>
          <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 0 6px 6px 0;">
            <p style="margin: 0; color: #374151; line-height: 1.6;">${message}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Lead Details</h2>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px;">
            <p style="margin: 8px 0; color: #374151;"><strong>Lead ID:</strong> ${leadId}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Submitted:</strong> ${submittedAt}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Source:</strong> Contact Form</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="mailto:${email}?subject=Re: Your inquiry about XenlixAI" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Reply to ${name}
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            This email was sent from the XenlixAI contact form. 
            <br>Please respond promptly to maintain our 24-hour response commitment.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function generateAutoReplyEmail({ name, message }: LeadData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">XenlixAI</h1>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 22px; margin: 0 0 15px 0;">Thank you, ${name}!</h2>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
            We've received your message and appreciate your interest in XenlixAI. Our team will review your inquiry and get back to you within 24 hours.
          </p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">What happens next?</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Our team will review your specific needs and use case</li>
            <li style="margin-bottom: 8px;">We'll prepare a personalized response with relevant information</li>
            <li style="margin-bottom: 8px;">If needed, we'll schedule a demo tailored to your requirements</li>
          </ul>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Your message:</h3>
          <p style="color: #6b7280; line-height: 1.6; margin: 0; font-style: italic;">"${message}"</p>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="https://calendly.com/your-username/30min" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 10px;">
            Schedule a Demo
          </a>
          <a href="https://yourdomain.com/resources" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Browse Resources
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            Need immediate assistance? Contact us:
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            📧 <a href="mailto:hello@xenlix.ai" style="color: #3b82f6;">hello@xenlix.ai</a> | 
            🌐 <a href="https://yourdomain.com" style="color: #3b82f6;">www.xenlix.ai</a>
          </p>
        </div>
      </div>
    </div>
  `;
}
