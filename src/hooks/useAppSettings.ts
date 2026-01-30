import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * App settings keys that can be fetched from the database
 */
export type AppSettingKey = 'enable_payments' | 'enable_welcome_email';

interface AppSettings {
  enable_payments: boolean;
}

/**
 * Hook to fetch app settings from the database
 * 
 * Uses the app_settings table which has a public read policy for specific keys
 * like 'enable_payments', allowing the frontend to read these settings without
 * authentication.
 * 
 * @example
 * ```tsx
 * const { paymentsEnabled, isLoading } = useAppSettings();
 * 
 * if (!paymentsEnabled) {
 *   // Show payments disabled message
 * }
 * ```
 */
export const useAppSettings = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['app-settings', 'enable_payments'],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('key', 'enable_payments')
        .maybeSingle();

      if (error) {
        // If there's an error (e.g., RLS blocking), default to payments disabled for safety
        console.error('Failed to fetch app settings:', error.message);
        return { enable_payments: false };
      }

      // If no row found, default to payments disabled for safety
      if (!data) {
        return { enable_payments: false };
      }

      return {
        enable_payments: data.value === 'true'
      };
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus (setting rarely changes)
  });

  return {
    paymentsEnabled: data?.enable_payments ?? false,
    isLoading,
    error,
  };
};

