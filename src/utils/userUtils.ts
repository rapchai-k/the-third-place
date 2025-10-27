import { User } from '@supabase/supabase-js';

/**
 * Determines if a user is considered "new" based on their creation timestamp
 * A user is considered new if they were created within the last 5 minutes
 * This is useful for detecting users who just completed OAuth sign-up
 */
export const isNewUser = (user: User | null): boolean => {
  if (!user || !user.created_at) {
    return false;
  }

  const userCreatedAt = new Date(user.created_at);
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

  return userCreatedAt > fiveMinutesAgo;
};

/**
 * Checks if a user signed up via Google OAuth
 * This is determined by checking the app_metadata for the provider
 */
export const isGoogleOAuthUser = (user: User | null): boolean => {
  if (!user) {
    return false;
  }

  // Check if the user has Google as a provider in their app_metadata
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes('google');
};

/**
 * Determines if a user is a new Google OAuth user who should see the referral modal
 */
export const shouldShowReferralModal = (user: User | null): boolean => {
  return isNewUser(user) && isGoogleOAuthUser(user);
};
