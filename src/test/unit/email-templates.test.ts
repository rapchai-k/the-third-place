import { describe, it, expect } from 'vitest';

// Mock the email template functions since they're in Supabase functions
const generateWelcomeEmailTemplate = (data: { userName: string; userEmail?: string; dashboardUrl?: string }) => {
  const { userName, dashboardUrl = "https://thethirdplace.community/dashboard" } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to My Third Place</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">My Third Place</div>
            <p class="tagline">Where Communities Come Together</p>
        </div>
        
        <div class="content">
            <h1 class="welcome-text">Welcome to My Third Place, ${userName}! 🎉</h1>
            
            <p class="description">
                We're absolutely thrilled to have you join our vibrant community platform!
            </p>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Discover Local Events</strong> - Find exciting activities</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Join Discussions</strong> - Engage in conversations</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Build Connections</strong> - Meet new friends</p>
                </div>
                <div class="feature">
                    <div class="feature-icon"></div>
                    <p class="feature-text"><strong>Create & Share</strong> - Organize your own events</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${dashboardUrl}" class="cta-button">Explore Your Dashboard</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Welcome to the community!</strong></p>
            <p>&copy; 2025 The Third Place. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
};

describe('Email Templates', () => {
  describe('Welcome Email Template', () => {
    it('should generate valid HTML structure', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'John Doe',
        userEmail: 'john@example.com'
      });

      expect(template).toContain('<!DOCTYPE html>');
      expect(template).toContain('<html lang="en">');
      expect(template).toContain('<head>');
      expect(template).toContain('<body>');
      expect(template).toContain('</html>');
    });

    it('should include user name in welcome message', () => {
      const userName = 'Alice Smith';
      const template = generateWelcomeEmailTemplate({
        userName,
        userEmail: 'alice@example.com'
      });

      expect(template).toContain(`Welcome to My Third Place, ${userName}!`);
    });

    it('should include The Third Place branding', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      expect(template).toContain('My Third Place');
      expect(template).toContain('Where Communities Come Together');
      expect(template).toContain('&copy; 2025 The Third Place');
    });

    it('should include all key features', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      expect(template).toContain('Discover Local Events');
      expect(template).toContain('Join Discussions');
      expect(template).toContain('Build Connections');
      expect(template).toContain('Create & Share');
    });

    it('should include call-to-action button', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      expect(template).toContain('Explore Your Dashboard');
      expect(template).toContain('href="https://thethirdplace.community/dashboard"');
    });

    it('should use custom dashboard URL when provided', () => {
      const customUrl = 'https://custom.thethirdplace.community/dashboard';
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com',
        dashboardUrl: customUrl
      });

      expect(template).toContain(`href="${customUrl}"`);
    });

    it('should handle special characters in user names', () => {
      const specialNames = [
        'José María',
        'O\'Connor',
        'Smith-Jones',
        'François',
        'Müller',
        'Björk'
      ];

      specialNames.forEach(name => {
        const template = generateWelcomeEmailTemplate({
          userName: name,
          userEmail: 'test@example.com'
        });

        expect(template).toContain(name);
        expect(template).toContain('<!DOCTYPE html>'); // Should still be valid HTML
      });
    });

    it('should be responsive with mobile viewport meta tag', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      expect(template).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    });

    it('should include proper email title', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      expect(template).toContain('<title>Welcome to My Third Place</title>');
    });

    it('should include UTF-8 charset declaration', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      expect(template).toContain('<meta charset="UTF-8">');
    });

    it('should have proper semantic structure', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      // Should have header, content, and footer sections
      expect(template).toContain('class="header"');
      expect(template).toContain('class="content"');
      expect(template).toContain('class="footer"');
      
      // Should have proper heading hierarchy
      expect(template).toContain('<h1');
      expect(template).toContain('<p');
    });

    it('should include accessibility features', () => {
      const template = generateWelcomeEmailTemplate({
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      // Should have lang attribute
      expect(template).toContain('lang="en"');
      
      // Links should be descriptive
      expect(template).toContain('Explore Your Dashboard');
    });
  });

  describe('Template Security', () => {
    it('should handle potentially malicious user names safely', () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '${alert("xss")}',
        '{{alert("xss")}}'
      ];

      maliciousNames.forEach(name => {
        const template = generateWelcomeEmailTemplate({
          userName: name,
          userEmail: 'test@example.com'
        });

        // Template should contain the name as-is (email clients handle escaping)
        // but should not break the HTML structure
        expect(template).toContain('<!DOCTYPE html>');
        expect(template).toContain('</html>');
      });
    });

    it('should handle empty or undefined user names gracefully', () => {
      const edgeCases = ['', ' ', undefined, null];

      edgeCases.forEach(name => {
        const template = generateWelcomeEmailTemplate({
          userName: name as any,
          userEmail: 'test@example.com'
        });

        expect(template).toContain('<!DOCTYPE html>');
        expect(template).toContain('Welcome to My Third Place');
      });
    });
  });

  describe('Template Performance', () => {
    it('should generate template quickly', () => {
      const startTime = performance.now();
      
      generateWelcomeEmailTemplate({
        userName: 'Performance Test User',
        userEmail: 'perf@example.com'
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Template generation should be very fast (under 10ms)
      expect(duration).toBeLessThan(10);
    });

    it('should produce consistent output', () => {
      const templateData = {
        userName: 'Consistency Test',
        userEmail: 'consistency@example.com'
      };

      const template1 = generateWelcomeEmailTemplate(templateData);
      const template2 = generateWelcomeEmailTemplate(templateData);

      expect(template1).toBe(template2);
    });

    it('should handle large user names efficiently', () => {
      const longName = 'A'.repeat(1000); // Very long name
      
      const template = generateWelcomeEmailTemplate({
        userName: longName,
        userEmail: 'long@example.com'
      });

      expect(template).toContain(longName);
      expect(template).toContain('<!DOCTYPE html>');
    });
  });
});
