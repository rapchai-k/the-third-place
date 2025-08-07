import { useState } from 'react';
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

  // Apply referral code during registration
  const applyReferralCode = async (referralCode: string, newUserId: string) => {
    try {
      // Find the referrer by referral code
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        throw new Error('Invalid referral code');
      }

      // Update the new user's referred_by field
      const { error: updateError } = await supabase
        .from('users')
        .update({ referred_by: referrer.id })
        .eq('id', newUserId);

      if (updateError) throw updateError;

      // Create a referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_user_id: newUserId,
        });

      if (referralError) throw referralError;

      // Dispatch webhook event for referral
      const { error: webhookError } = await supabase
        .rpc('dispatch_webhook', {
          event_type: 'user.referred_user',
          event_data: {
            referred_user_id: newUserId,
            referrer_id: referrer.id,
            referral_code: referralCode
          },
          actor_user_id: referrer.id
        });

      if (webhookError) {
        console.error('Webhook dispatch failed:', webhookError);
        // Don't throw here as the referral is still valid
      }

      return true;
    } catch (error) {
      console.error('Error applying referral code:', error);
      return false;
    }
  };

  // Share referral code
  const shareReferralCode = async (code: string, method: 'copy' | 'whatsapp' | 'email') => {
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