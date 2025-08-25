/**
 * Email templates for The Third Place platform
 * All templates are responsive and follow brand guidelines
 */

export interface EmailTemplateData {
  userName: string;
  userEmail?: string;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Base email styles used across all templates
 */
const baseStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
    margin: 0; 
    padding: 0; 
    background-color: #f8fafc; 
    line-height: 1.6;
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #ffffff; 
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    padding: 40px 20px; 
    text-align: center; 
  }
  .logo { 
    color: #ffffff; 
    font-size: 32px; 
    font-weight: bold; 
    margin-bottom: 10px; 
    text-decoration: none;
  }
  .tagline { 
    color: #e2e8f0; 
    font-size: 16px; 
    margin: 0;
  }
  .content { 
    padding: 40px 20px; 
  }
  .welcome-text { 
    font-size: 28px; 
    font-weight: 600; 
    color: #1e293b; 
    margin-bottom: 20px; 
    line-height: 1.2;
  }
  .description { 
    font-size: 16px; 
    line-height: 1.6; 
    color: #475569; 
    margin-bottom: 30px; 
  }
  .features { 
    margin: 30px 0; 
    background-color: #f8fafc;
    padding: 20px;
    border-radius: 8px;
  }
  .feature { 
    display: flex; 
    align-items: center; 
    margin-bottom: 15px; 
  }
  .feature:last-child {
    margin-bottom: 0;
  }
  .feature-icon { 
    width: 24px; 
    height: 24px; 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
    border-radius: 50%; 
    margin-right: 15px; 
    flex-shrink: 0;
    position: relative;
  }
  .feature-icon::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
  .feature-text { 
    font-size: 16px; 
    color: #475569; 
    margin: 0;
  }
  .cta-button { 
    display: inline-block; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: #ffffff !important; 
    text-decoration: none; 
    padding: 16px 32px; 
    border-radius: 8px; 
    font-weight: 600; 
    font-size: 16px;
    margin: 20px 0; 
    transition: transform 0.2s ease;
  }
  .cta-button:hover {
    transform: translateY(-2px);
  }
  .secondary-cta {
    text-align: center;
    margin: 30px 0;
  }
  .secondary-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
  }
  .footer { 
    background-color: #f1f5f9; 
    padding: 30px 20px; 
    text-align: center; 
    font-size: 14px; 
    color: #64748b; 
    border-top: 1px solid #e2e8f0;
  }
  .footer p {
    margin: 8px 0;
  }
  .social-links {
    margin: 20px 0;
  }
  .social-link {
    display: inline-block;
    margin: 0 10px;
    color: #667eea;
    text-decoration: none;
  }
  @media (max-width: 600px) { 
    .container { 
      margin: 0 10px; 
    } 
    .content { 
      padding: 30px 15px; 
    }
    .welcome-text {
      font-size: 24px;
    }
    .header {
      padding: 30px 15px;
    }
    .logo {
      font-size: 28px;
    }
  }
`;

/**
 * Welcome email template for new users
 */
export function generateWelcomeEmailTemplate(data: EmailTemplateData): string {
  const { userName, dashboardUrl = "https://thethirdplace.community/dashboard" } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to The Third Place</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">The Third Place</div>
            <p class="tagline">Where Communities Come Together</p>
        </div>
        
        <div class="content">
            <h1 class="welcome-text">Welcome to The Third Place, ${userName}! 🎉</h1>
            
            <p class="description">
                We're absolutely thrilled to have you join our vibrant community platform! The Third Place is your gateway to discovering amazing local events, engaging in meaningful discussions, and connecting with like-minded people in your area.
            </p>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Discover Local Events</strong> - Find exciting activities and gatherings in your community</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Join Discussions</strong> - Engage in meaningful conversations with your neighbors</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Build Connections</strong> - Meet new friends and strengthen community bonds</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Create & Share</strong> - Organize your own events and share your interests</p>
                </div>
            </div>
            
            <p class="description">
                Your community is waiting for you! Start by exploring your personalized dashboard where you can see upcoming events, join discussions, and discover communities that match your interests.
            </p>
            
            <div style="text-align: center;">
                <a href="${dashboardUrl}" class="cta-button">Explore Your Dashboard</a>
            </div>

            <div class="secondary-cta">
                <p>Or browse our popular sections:</p>
                <a href="https://thethirdplace.community/communities" class="secondary-link">Communities</a> • 
                <a href="https://thethirdplace.community/events" class="secondary-link">Events</a> • 
                <a href="https://thethirdplace.community/discussions" class="secondary-link">Discussions</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Welcome to the community!</strong></p>
            <p>If you have any questions or need help getting started, our support team is here to help.</p>
            
            <div class="social-links">
                <a href="#" class="social-link">Help Center</a>
                <a href="#" class="social-link">Community Guidelines</a>
                <a href="#" class="social-link">Contact Support</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                &copy; 2025 The Third Place. All rights reserved.<br>
                You're receiving this email because you signed up for The Third Place.
            </p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Event reminder email template
 */
export function generateEventReminderTemplate(data: EmailTemplateData & { 
  eventName: string; 
  eventDate: string; 
  eventLocation: string; 
  eventUrl: string; 
}): string {
  const { userName, eventName, eventDate, eventLocation, eventUrl } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder - ${eventName}</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">The Third Place</div>
            <p class="tagline">Event Reminder</p>
        </div>
        
        <div class="content">
            <h1 class="welcome-text">Don't forget, ${userName}!</h1>
            
            <p class="description">
                Your registered event <strong>${eventName}</strong> is coming up soon.
            </p>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Event:</strong> ${eventName}</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Date:</strong> ${eventDate}</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Location:</strong> ${eventLocation}</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${eventUrl}" class="cta-button">View Event Details</a>
            </div>
        </div>
        
        <div class="footer">
            <p>See you at the event!</p>
            <p>&copy; 2025 The Third Place. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}
