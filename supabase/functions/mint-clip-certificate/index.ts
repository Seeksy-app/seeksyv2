import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Mint Clip Certificate (Blockchain Certification)
 * 
 * Simulates minting an on-chain certificate for a finished clip.
 * Phase 1: Mock implementation with proper data structure.
 * Phase 2: Will integrate actual blockchain contract calls.
 * 
 * Process:
 * 1. Validates clip is ready for certification (status = 'ready')
 * 2. Sets cert_status = 'minting'
 * 3. Simulates blockchain minting (TODO: Replace with real web3 integration)
 * 4. Updates clip with certificate details
 * 
 * Future integration points:
 * - Real wallet connection (user or platform wallet)
 * - Smart contract interaction (Polygon, Base, etc.)
 * - Gas estimation and transaction submission
 * - Transaction confirmation polling
 */

interface MintCertificateRequest {
  clipId: string;
  chain?: 'polygon' | 'base' | 'ethereum'; // Future: user-selectable chain
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== MINT CLIP CERTIFICATE ===");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User authentication failed");
    }

    const requestData: MintCertificateRequest = await req.json();
    const { clipId, chain = 'polygon' } = requestData;

    console.log(`Minting certificate for clip: ${clipId} on ${chain}`);

    // Get clip and verify ownership
    const { data: clip, error: clipError } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .eq('user_id', user.id)
      .single();

    if (clipError || !clip) {
      throw new Error("Clip not found or access denied");
    }

    // Validate clip is ready for certification
    if (clip.status !== 'ready') {
      throw new Error(`Clip must be in 'ready' status for certification. Current status: ${clip.status}`);
    }

    if (!clip.output_url) {
      throw new Error("Clip must have output URL before certification");
    }

    if (clip.cert_status === 'minted') {
      throw new Error("Clip already has a certificate");
    }

    // Set status to minting
    const { error: mintingError } = await supabase
      .from('clips')
      .update({ cert_status: 'minting' })
      .eq('id', clipId);

    if (mintingError) throw mintingError;

    console.log("→ Simulating blockchain minting...");

    // ============================================================
    // PHASE 1: MOCK IMPLEMENTATION
    // ============================================================
    // TODO: Replace this section with real blockchain integration
    // 
    // Future implementation will:
    // 1. Load user/workspace wallet config
    // 2. Prepare contract call with clip metadata
    // 3. Submit transaction to selected chain
    // 4. Poll for confirmation
    // 5. Parse transaction receipt for token ID
    // 
    // For now, simulate success after brief delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock certificate data
    const mockTxHash = `0x${Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    const mockTokenId = Math.floor(Math.random() * 1000000).toString();
    
    const explorerUrls: Record<string, string> = {
      polygon: `https://polygonscan.com/tx/${mockTxHash}`,
      base: `https://basescan.org/tx/${mockTxHash}`,
      ethereum: `https://etherscan.io/tx/${mockTxHash}`,
    };

    console.log("✓ Mock certificate minted");
    console.log(`  Chain: ${chain}`);
    console.log(`  TX Hash: ${mockTxHash}`);
    console.log(`  Token ID: ${mockTokenId}`);
    console.log(`  Explorer: ${explorerUrls[chain]}`);

    // ============================================================
    // END MOCK IMPLEMENTATION
    // ============================================================

    // Update clip with certificate details
    const { data: certifiedClip, error: certError } = await supabase
      .from('clips')
      .update({
        cert_status: 'minted',
        cert_chain: chain,
        cert_tx_hash: mockTxHash,
        cert_token_id: mockTokenId,
        cert_explorer_url: explorerUrls[chain],
        cert_created_at: new Date().toISOString(),
      })
      .eq('id', clipId)
      .select()
      .single();

    if (certError) {
      // Rollback to failed status
      await supabase
        .from('clips')
        .update({ cert_status: 'failed' })
        .eq('id', clipId);
      
      throw certError;
    }

    console.log("✓ Clip certified successfully");

    return new Response(
      JSON.stringify({
        success: true,
        clip: certifiedClip,
        certificate: {
          chain,
          tx_hash: mockTxHash,
          token_id: mockTokenId,
          explorer_url: explorerUrls[chain],
        },
        message: "Clip certificate minted successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Certificate minting error:", error);
    
    // Attempt to set failed status
    try {
      const authHeader = req.headers.get("Authorization");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: authHeader || "" },
          },
        }
      );

      const requestData = await req.json();
      await supabase
        .from('clips')
        .update({ cert_status: 'failed' })
        .eq('id', requestData.clipId);
    } catch (rollbackError) {
      console.error("Failed to update cert_status to failed:", rollbackError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
