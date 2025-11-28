import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AdvertiserStatus {
  isOnboarded: boolean;
  advertiserId: string | null;
  isLoading: boolean;
}

/**
 * Hook to guard advertiser routes and redirect to signup if onboarding is incomplete.
 * Only shows error if data is inconsistent (onboarding complete but no advertiser record).
 */
export function useAdvertiserGuard(): AdvertiserStatus {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AdvertiserStatus>({
    isOnboarded: false,
    advertiserId: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAdvertiserStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Check profile onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('advertiser_onboarding_completed, is_advertiser')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Check for advertiser record
        const { data: advertiser, error: advertiserError } = await supabase
          .from('advertisers')
          .select('id, status')
          .eq('owner_profile_id', user.id)
          .maybeSingle();

        // If onboarding not complete OR no advertiser record, redirect to signup
        if (!profile?.advertiser_onboarding_completed || !advertiser) {
          navigate('/advertiser/signup', { replace: true });
          return;
        }

        // Onboarding complete and advertiser exists
        setStatus({
          isOnboarded: true,
          advertiserId: advertiser.id,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error checking advertiser status:', error);
        setStatus({
          isOnboarded: false,
          advertiserId: null,
          isLoading: false,
        });
      }
    };

    checkAdvertiserStatus();
  }, [navigate]);

  return status;
}
