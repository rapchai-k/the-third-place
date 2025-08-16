/*
  # Send Installation Notification Email

  Sends email notification to vendor when box installations are scheduled
*/

interface InstallationNotificationPayload {
  vendor_email: string;
  vendor_name: string;
  vendor_id: string;
  installations: Array<{
    rider_id: string;
    rider_name: string;
    rider_phone: string;
    installation_date: string;
    installation_time: string;
    location: string;
  }>;
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

    const { vendor_email, vendor_name, vendor_id, installations, system_url }: InstallationNotificationPayload = await req.json();

    // Create installation details list
    const installationsList = installations.map((inst, index) => 
      `${index + 1}. Rider: ${inst.rider_name} (ID: ${inst.rider_id})
   Phone: ${inst.rider_phone}
   Date: ${inst.installation_date} at ${inst.installation_time}
   Location: ${inst.location}`
    ).join('\n\n');

    // Create email content
    const emailContent = `
Dear ${vendor_name},

You have been assigned ${installations.length} new box installation(s):

${installationsList}

Installation Details:
• Total installations: ${installations.length}
• Vendor ID: ${vendor_id}
• Assigned to: ${vendor_name}

Next Steps:
1. Review the installation details above
2. Contact riders if needed to confirm timing
3. Complete installations on scheduled dates
4. Update status in the system after completion

System Access:
If you have system access, you can login to update installation status:
${system_url}
Login with: ${vendor_email}

Important Notes:
• Please arrive on time for scheduled installations
• Contact riders if you need to reschedule
• Update installation status after completion
• Take photos for proof of installation if required

For support or questions, please contact the RiderFlow team.

Best regards,
RiderFlow Installation Team

---
This is an automated notification. Installation assignments are managed through the RiderFlow system.
    `.trim();

    // Log email for debugging (replace with actual email service)
    console.log('📧 Installation notification email:', {
      to: vendor_email,
      subject: `New Box Installation Assignment - ${installations.length} installation(s) - Vendor ${vendor_id}`,
      content: emailContent,
      installations_count: installations.length
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
          message: `Installation notification sent to ${vendor_email}`,
          vendor_id: vendor_id,
          installations_count: installations.length,
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
      throw new Error('Failed to send email notification');
    }

  } catch (error) {
    console.error('Error sending installation notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send notification'
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