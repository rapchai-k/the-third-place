import { describe, it, expect } from 'vitest';
import { isNewUser, isGoogleOAuthUser, shouldShowReferralModal } from '../userUtils';
import { User } from '@supabase/supabase-js';

describe('userUtils', () => {
  describe('isNewUser', () => {
    it('should return true for users created within the last 5 minutes', () => {
      const now = new Date();
      const recentUser = {
        id: 'test-id',
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      } as User;

      expect(isNewUser(recentUser)).toBe(true);
    });

    it('should return false for users created more than 5 minutes ago', () => {
      const now = new Date();
      const oldUser = {
        id: 'test-id',
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      } as User;

      expect(isNewUser(oldUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isNewUser(null)).toBe(false);
    });

    it('should return false for user without created_at', () => {
      const userWithoutCreatedAt = {
        id: 'test-id',
      } as User;

      expect(isNewUser(userWithoutCreatedAt)).toBe(false);
    });
  });

  describe('isGoogleOAuthUser', () => {
    it('should return true for users with Google provider', () => {
      const googleUser = {
        id: 'test-id',
        app_metadata: {
          providers: ['google']
        }
      } as User;

      expect(isGoogleOAuthUser(googleUser)).toBe(true);
    });

    it('should return false for users without Google provider', () => {
      const emailUser = {
        id: 'test-id',
        app_metadata: {
          providers: ['email']
        }
      } as User;

      expect(isGoogleOAuthUser(emailUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isGoogleOAuthUser(null)).toBe(false);
    });

    it('should return false for user without app_metadata', () => {
      const userWithoutMetadata = {
        id: 'test-id',
      } as User;

      expect(isGoogleOAuthUser(userWithoutMetadata)).toBe(false);
    });
  });

  describe('shouldShowReferralModal', () => {
    it('should return true for new Google OAuth users', () => {
      const now = new Date();
      const newGoogleUser = {
        id: 'test-id',
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        app_metadata: {
          providers: ['google']
        }
      } as User;

      expect(shouldShowReferralModal(newGoogleUser)).toBe(true);
    });

    it('should return false for old Google OAuth users', () => {
      const now = new Date();
      const oldGoogleUser = {
        id: 'test-id',
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        app_metadata: {
          providers: ['google']
        }
      } as User;

      expect(shouldShowReferralModal(oldGoogleUser)).toBe(false);
    });

    it('should return false for new email users', () => {
      const now = new Date();
      const newEmailUser = {
        id: 'test-id',
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        app_metadata: {
          providers: ['email']
        }
      } as User;

      expect(shouldShowReferralModal(newEmailUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(shouldShowReferralModal(null)).toBe(false);
    });
  });
});
