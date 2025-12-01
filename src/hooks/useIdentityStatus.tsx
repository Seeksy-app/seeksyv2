import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IdentityStatus {
  faceVerified: boolean;
  voiceVerified: boolean;
  overallStatus: 'verified' | 'partial' | 'none';
  faceExplorerUrl: string | null;
  voiceExplorerUrl: string | null;
  faceAssetId: string | null;
  voiceProfileId: string | null;
}

export const useIdentityStatus = () => {
  return useQuery({
    queryKey: ['identity-status'],
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
    queryFn: async (): Promise<IdentityStatus> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          faceVerified: false,
          voiceVerified: false,
          overallStatus: 'none',
          faceExplorerUrl: null,
          voiceExplorerUrl: null,
          faceAssetId: null,
          voiceProfileId: null,
        };
      }

      // Check face identity from identity_assets
      const { data: faceAsset } = await supabase
        .from('identity_assets')
        .select('id, cert_status, cert_explorer_url')
        .eq('user_id', user.id)
        .eq('type', 'face_identity')
        .eq('cert_status', 'minted')
        .is('revoked_at', null)
        .maybeSingle();

      // Check voice identity from creator_voice_profiles
      const { data: voiceProfile } = await supabase
        .from('creator_voice_profiles')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();

      // Check voice blockchain certificate
      const { data: voiceCert } = await supabase
        .from('voice_blockchain_certificates')
        .select('id, certification_status, is_active, cert_explorer_url')
        .eq('creator_id', user.id)
        .eq('certification_status', 'verified')
        .eq('is_active', true)
        .maybeSingle();

      const faceVerified = !!faceAsset;
      const voiceVerified = !!(voiceProfile && voiceCert);

      let overallStatus: 'verified' | 'partial' | 'none' = 'none';
      if (faceVerified && voiceVerified) {
        overallStatus = 'verified';
      } else if (faceVerified || voiceVerified) {
        overallStatus = 'partial';
      }

      return {
        faceVerified,
        voiceVerified,
        overallStatus,
        faceExplorerUrl: faceAsset?.cert_explorer_url || null,
        voiceExplorerUrl: voiceCert?.cert_explorer_url || null,
        faceAssetId: faceAsset?.id || null,
        voiceProfileId: voiceProfile?.id || null,
      };
    },
  });
};
