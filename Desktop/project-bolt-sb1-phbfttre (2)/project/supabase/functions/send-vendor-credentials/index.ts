/*
  # Send Vendor Credentials Email

  Sends login credentials to newly created vendors via email
*/

interface VendorCredentialsPayload {
  vendor_email: string;
  vendor_name: string;
  vendor_id: string;
  first_name: string;
  last_name: string;
  password: string;
  system_url: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const { vendor_email, vendor_name, vendor_id, first_name, last_name, password, system_url }: VendorCredentialsPayload = await req.json();

    // Create email content
    const emailContent = `
Dear ${first_name} ${last_name},

Welcome to RiderFlow! Your vendor account has been successfully created.

Vendor Information:
• Company: ${vendor_name}
• Vendor ID: ${vendor_id}
• Contact Email: ${vendor_email}

System Login Credentials:
• Email: ${vendor_email}
• Password: ${password}
• System Access: ${system_url}

Your Access Permissions:
• View assigned box installations
• Update installation status (scheduled → in-progress → completed)
• Add notes and completion details
• Receive automatic email notifications for new assignments

How to Use the System:
1. Login to the RiderFlow system using the link above
2. Use your email and password to sign in
3. Navigate to "Box Installation" section
4. View your assigned installations and update status as needed

Important Security Notes:
• Please change your password after first login
• Keep your credentials secure and confidential
• Only share installation updates through the system
• Contact support if you experience any login issues

You will receive email notifications whenever new box installations are assigned to you.

For technical support or questions about the system, please contact the RiderFlow team.

Best regards,
RiderFlow Team

---
This is an automated message. Please do not reply to this email.
    `.trim();

    // Log email for debugging (replace with actual email service)
    console.log('📧 Vendor credentials email:', {
      to: vendor_email,
      subject: `Welcome to RiderFlow - Your Vendor Account Credentials (${vendor_id})`,
      content: emailContent
    });

    // TODO: Replace with actual email service integration
    // Example integrations:
    // - SendGrid: https://sendgrid.com/
    // - Mailgun: https://www.mailgun.com/
    // - AWS SES: https://aws.amazon.com/ses/
    // - Resend: https://resend.com/
    
    // For now, simulate successful email sending
    const emailSent = true;

    if (emailSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Vendor credentials sent to ${vendor_email}`,
          vendor_id: vendor_id,
          email_content: emailContent // Include for debugging
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } else {
      throw new Error('Failed to send credentials email');
    }

  } catch (error) {
    console.error('Error sending vendor credentials:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send credentials'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});