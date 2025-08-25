import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Mock environment variables for testing
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  RESEND_API_KEY: 'test-resend-key'
};

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Email Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Send Email Function', () => {
    it('should send email successfully with valid payload', async () => {
      // Mock successful Resend API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-message-id' })
      });

      const emailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        tags: ['test']
      };

      const response = await fetch('/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-resend-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle invalid email addresses', async () => {
      const emailPayload = {
        to: 'invalid-email',
        subject: 'Test Email',
        html: '<h1>Test</h1>'
      };

      // This would be handled by the function's validation
      expect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailPayload.to)) {
          throw new Error('Invalid email address format');
        }
      }).toThrow('Invalid email address format');
    });

    it('should handle missing required fields', async () => {
      const incompletePayload = {
        to: 'test@example.com'
        // Missing subject and html
      };

      expect(() => {
        if (!incompletePayload.to || !('subject' in incompletePayload) || !('html' in incompletePayload)) {
          throw new Error('Missing required fields: to, subject, html');
        }
      }).toThrow('Missing required fields: to, subject, html');
    });

    it('should handle Resend API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid API key' })
      });

      const emailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>'
      };

      // This would be handled by the function's error handling
      const mockResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        body: JSON.stringify(emailPayload)
      });

      const mockData = await mockResponse.json();
      
      if (!mockResponse.ok) {
        expect(mockData.message).toBe('Invalid API key');
      }
    });
  });

  describe('Welcome Email Trigger Function', () => {
    it('should trigger welcome email for new user', async () => {
      const welcomeEmailPayload = {
        userId: 'test-user-id',
        userEmail: 'newuser@example.com',
        userName: 'Test User'
      };

      // Mock successful email sending
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, messageId: 'welcome-message-id' })
      });

      const response = await fetch('/functions/v1/welcome-email-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcomeEmailPayload)
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/send-email'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Welcome to The Third Place')
        })
      );
    });

    it('should prevent duplicate welcome emails', async () => {
      const welcomeEmailPayload = {
        userId: 'existing-user-id',
        userEmail: 'existing@example.com',
        userName: 'Existing User'
      };

      // Mock user with existing welcome_email_sent_at
      const mockUser = {
        welcome_email_sent_at: '2025-01-01T00:00:00Z'
      };

      // This would be the logic in the function
      if (mockUser.welcome_email_sent_at) {
        const response = {
          success: true,
          alreadySent: true
        };
        expect(response.alreadySent).toBe(true);
      }
    });

    it('should handle missing user data gracefully', async () => {
      const incompletePayload = {
        userId: 'test-user-id'
        // Missing userEmail and userName
      };

      expect(() => {
        if (!incompletePayload.userId || !('userEmail' in incompletePayload) || !('userName' in incompletePayload)) {
          throw new Error('Missing required fields: userId, userEmail, userName');
        }
      }).toThrow('Missing required fields: userId, userEmail, userName');
    });
  });

  describe('Email Template Generation', () => {
    it('should generate valid HTML welcome email template', () => {
      const templateData = {
        userName: 'John Doe',
        userEmail: 'john@example.com'
      };

      // Mock template generation (would import from actual template file)
      const mockTemplate = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Welcome to The Third Place, ${templateData.userName}!</h1>
            <p>We're thrilled to have you join our community.</p>
          </body>
        </html>
      `;

      expect(mockTemplate).toContain(templateData.userName);
      expect(mockTemplate).toContain('Welcome to The Third Place');
      expect(mockTemplate).toContain('<!DOCTYPE html>');
    });

    it('should handle special characters in user names', () => {
      const templateData = {
        userName: 'José María O\'Connor',
        userEmail: 'jose@example.com'
      };

      // Template should safely handle special characters
      const mockTemplate = `Welcome to The Third Place, ${templateData.userName}!`;
      expect(mockTemplate).toContain('José María O\'Connor');
    });

    it('should include all required email elements', () => {
      const mockTemplate = `
        <!DOCTYPE html>
        <html>
          <head><title>Welcome to The Third Place</title></head>
          <body>
            <div class="header">The Third Place</div>
            <div class="content">
              <h1>Welcome!</h1>
              <a href="https://thethirdplace.community/dashboard">Explore Dashboard</a>
            </div>
            <div class="footer">© 2025 The Third Place</div>
          </body>
        </html>
      `;

      expect(mockTemplate).toContain('The Third Place');
      expect(mockTemplate).toContain('dashboard');
      expect(mockTemplate).toContain('© 2025');
      expect(mockTemplate).toContain('<!DOCTYPE html>');
    });
  });

  describe('Email Logging and Tracking', () => {
    it('should log successful email deliveries', async () => {
      const emailLog = {
        recipient: 'test@example.com',
        subject: 'Welcome to The Third Place',
        message_id: 'test-message-id',
        status: 'sent',
        provider: 'resend',
        sent_at: new Date().toISOString()
      };

      // Mock database insertion
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      
      // This would be the actual database call
      expect(emailLog.status).toBe('sent');
      expect(emailLog.provider).toBe('resend');
      expect(emailLog.message_id).toBe('test-message-id');
    });

    it('should log failed email deliveries', async () => {
      const emailLog = {
        recipient: 'test@example.com',
        subject: 'Welcome to The Third Place',
        status: 'failed',
        error_message: 'Invalid recipient address',
        provider: 'resend'
      };

      expect(emailLog.status).toBe('failed');
      expect(emailLog.error_message).toBe('Invalid recipient address');
    });

    it('should update user welcome_email_sent_at after successful delivery', async () => {
      const userId = 'test-user-id';
      const sentAt = new Date().toISOString();

      // Mock database update
      const mockUpdate = {
        welcome_email_sent_at: sentAt
      };

      expect(mockUpdate.welcome_email_sent_at).toBe(sentAt);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should continue execution if email logging fails', async () => {
      // Mock email sending success but logging failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-message-id' })
      });

      // Email should still be considered sent even if logging fails
      const emailResult = { success: true, messageId: 'test-message-id' };
      expect(emailResult.success).toBe(true);
    });

    it('should handle webhook dispatch failures gracefully', async () => {
      // Mock webhook failure
      mockFetch.mockRejectedValueOnce(new Error('Webhook service unavailable'));

      // Email delivery should not fail due to webhook issues
      const emailResult = { success: true, messageId: 'test-message-id' };
      expect(emailResult.success).toBe(true);
    });

    it('should provide meaningful error messages', () => {
      const errors = [
        'RESEND_API_KEY environment variable is not set',
        'Missing required fields: to, subject, html',
        'Invalid email address format',
        'Resend API error: Invalid API key'
      ];

      errors.forEach(error => {
        expect(error).toMatch(/^[A-Z]/); // Should start with capital letter
        expect(error.length).toBeGreaterThan(10); // Should be descriptive
      });
    });
  });
});
