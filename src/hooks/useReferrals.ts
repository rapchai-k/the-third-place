import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  conversion_rate: number;
}

export interface ReferralActivity {
  id: string;
  referred_user_id: string;
  referred_user_name: string;
  joined_at: string;
  status: 'active' | 'pending';
}

export const useReferrals = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get referral count
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id, referred_user_id, users!referred_user_id(name, created_at)')
        .eq('referrer_id', userId);

      if (referralsError) throw referralsError;

      const totalReferrals = referrals?.length || 0;
      const successfulReferrals = referrals?.filter(r => r.users).length || 0;
      const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

      return {
        total_referrals: totalReferrals,
        successful_referrals: successfulReferrals,
        pending_referrals: totalReferrals - successfulReferrals,
        conversion_rate: Math.round(conversionRate * 100) / 100
      } as ReferralStats;
    },
    enabled: !!userId
  });

  // Fetch referral activity
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['referral-activity', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          joined_at,
          users!referred_user_id(name, created_at)
        `)
        .eq('referrer_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        referred_user_id: item.referred_user_id,
        referred_user_name: item.users?.name || 'Unknown User',
        joined_at: item.joined_at,
        status: item.users ? 'active' : 'pending'
      })) as ReferralActivity[];
    },
    enabled: !!userId
  });

  // Generate referral code
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID');

      // First, generate a new referral code using the database function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      // Update user's referral code
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: codeData })
        .eq('id', userId);

      if (updateError) throw updateError;

      return codeData;
    },
    onSuccess: (newCode) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      toast({
        title: "Referral code generated!",
        description: `Your new referral code is: ${newCode}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to generate referral code",
        description: error.message,
      });
    }
  });

  // Apply referral code during registration using server-side RPC
  const applyReferralCode = useCallback(async (referralCode: string, newUserId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('apply_referral_code', {
        _referral_code: referralCode,
        _new_user_id: newUserId,
      });

      if (error) throw error;

      // The RPC returns { success: boolean, error?: string, referrer_id?: string }
      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to apply referral code');
      }

      return true;
    } catch (error) {
      // Error applying referral code - logging removed for security
      return false;
    }
  }, []);

  // Share referral code
  const shareReferralCode = async (code: string, method: 'copy' | 'copyUrl' | 'whatsapp' | 'email') => {
    const referralUrl = `${window.location.origin}/auth?ref=${code}`;
    const message = `Join our amazing community! Use my referral code: ${code} or click here: ${referralUrl}`;

    switch (method) {
      case 'copy':
        // Copy only the referral code, not the full URL
        await navigator.clipboard.writeText(code);
        toast({
          title: "Copied!",
          description: `Referral code "${code}" copied to clipboard`,
        });
        break;

      case 'copyUrl':
        // Copy the full referral URL
        await navigator.clipboard.writeText(referralUrl);
        toast({
          title: "Copied!",
          description: "Referral URL copied to clipboard",
        });
        break;

      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;

      case 'email':
        window.open(`mailto:?subject=Join our community&body=${encodeURIComponent(message)}`, '_blank');
        break;
    }
  };

  return {
    stats,
    activity,
    loading: statsLoading || activityLoading || loading,
    generateCode: generateCodeMutation.mutate,
    generateCodeLoading: generateCodeMutation.isPending,
    applyReferralCode,
    shareReferralCode,
  };
};