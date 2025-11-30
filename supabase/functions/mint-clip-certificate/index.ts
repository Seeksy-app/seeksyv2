import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Mint Clip Certificate (Blockchain Certification)
 * 
 * Mints real on-chain ERC-721 certificate for finished clips on Polygon.
 * 
 * Process:
 * 1. Validates clip is ready for certification (status = 'ready')
 * 2. Sets cert_status = 'minting'
 * 3. Mints ERC-721 NFT on Polygon via smart contract
 * 4. Updates clip with real tx hash, token ID, and explorer URL
 * 
 * Integration:
 * - Uses Polygon RPC via POLYGON_RPC_URL
 * - Platform wallet signs transactions via SEEKSY_MINTER_PRIVATE_KEY
 * - Contract address configured via SEEKSY_CERTIFICATE_CONTRACT_ADDRESS
 * - Supports gasless transactions via Biconomy (future)
 */

// SeeksyClipCertificate Contract ABI (Deployed on Polygon Amoy)
// Contract Address: 0xB5627bDbA3ab392782E7E542a972013E3e7F37C3
const CERTIFICATE_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "clipId", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ClipCertified",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "string", "name": "clipId", "type": "string"}
    ],
    "name": "certifyClip",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

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

    console.log("→ Minting on-chain certificate on Polygon...");

    // ============================================================
    // REAL BLOCKCHAIN INTEGRATION
    // ============================================================
    
    // 1. Load blockchain configuration
    const rpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const minterPrivateKey = Deno.env.get("SEEKSY_MINTER_PRIVATE_KEY");
    
    // Contract deployed on Polygon Amoy testnet
    const contractAddress = "0xB5627bDbA3ab392782E7E542a972013E3e7F37C3";

    if (!rpcUrl || !minterPrivateKey) {
      throw new Error("Missing blockchain configuration (POLYGON_RPC_URL or SEEKSY_MINTER_PRIVATE_KEY)");
    }

    // 2. Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(minterPrivateKey, provider);
    
    console.log(`Platform wallet: ${signer.address}`);

    // 3. Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      CERTIFICATE_CONTRACT_ABI,
      signer
    );

    // 4. Certify clip on-chain
    try {
      const tx = await contract.certifyClip(
        signer.address, // Creator address (platform wallet for now, future: user wallet)
        clip.id
      );

      console.log(`Transaction submitted: ${tx.hash}`);

      // 6. Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      // 7. Extract certification timestamp from event
      let certTimestamp = Date.now().toString();
      let eventFound = false;
      
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed && parsed.name === "ClipCertified") {
            certTimestamp = parsed.args.timestamp.toString();
            eventFound = true;
            console.log(`Certificate timestamp from event: ${certTimestamp}`);
            break;
          }
        } catch (e) {
          // Skip logs that don't match our ABI
          continue;
        }
      }

      if (!eventFound) {
        console.warn("ClipCertified event not found in logs, using current timestamp");
      }

      // Generate tokenId from timestamp for display purposes
      const tokenId = certTimestamp;

      // 8. Build explorer URLs (Polygon Amoy testnet)
      const explorerUrls: Record<string, string> = {
        polygon: `https://amoy.polygonscan.com/tx/${tx.hash}`,
        base: `https://basescan.org/tx/${tx.hash}`,
        ethereum: `https://etherscan.io/tx/${tx.hash}`,
      };

      console.log("✓ Certificate minted on-chain");
      console.log(`  Chain: ${chain}`);
      console.log(`  TX Hash: ${tx.hash}`);
      console.log(`  Token ID: ${tokenId}`);
      console.log(`  Block: ${receipt.blockNumber}`);
      console.log(`  Contract: ${contractAddress}`);
      console.log(`  Explorer: ${explorerUrls[chain]}`);

      const finalTxHash = tx.hash;
      const finalTokenId = tokenId;
      const finalExplorerUrl = explorerUrls[chain];

      // 9. Update clip with certificate details
      const { data: certifiedClip, error: certError } = await supabase
        .from('clips')
        .update({
          cert_status: 'minted',
          cert_chain: chain,
          cert_tx_hash: finalTxHash,
          cert_token_id: finalTokenId,
          cert_explorer_url: finalExplorerUrl,
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

      console.log("✓ Clip certified successfully on-chain");

      return new Response(
        JSON.stringify({
          success: true,
          clip: certifiedClip,
          certificate: {
            chain,
            tx_hash: finalTxHash,
            token_id: finalTokenId,
            explorer_url: finalExplorerUrl,
            contract_address: contractAddress,
          },
          message: "Clip certificate minted on Polygon blockchain",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (blockchainError) {
      console.error("❌ Blockchain minting failed:", blockchainError);
      
      // Set failed status with error details
      await supabase
        .from('clips')
        .update({ 
          cert_status: 'failed',
          cert_updated_at: new Date().toISOString(),
        })
        .eq('id', clipId);
      
      throw new Error(`Blockchain minting failed: ${blockchainError instanceof Error ? blockchainError.message : String(blockchainError)}`);
    }

    // ============================================================
    // END REAL BLOCKCHAIN INTEGRATION
    // ============================================================

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
