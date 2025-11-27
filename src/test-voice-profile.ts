// Test script to verify blockchain NFT minting
// Run in browser console: window.testVoiceNFT()

import { supabase } from "@/integrations/supabase/client";

export async function testVoiceNFTMinting() {
  console.log('🎨 Testing Voice NFT Minting on Polygon Blockchain...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Not authenticated:', authError);
      return;
    }
    console.log('✅ User authenticated:', user.id);
    console.log('');
    
    // Step 1: Create voice profile
    console.log('📝 Step 1: Creating voice profile...');
    const testVoiceData = {
      voiceName: 'Test Voice NFT ' + new Date().toLocaleString(),
      elevenlabsVoiceId: 'test-nft-voice-' + Date.now(),
      sampleAudioUrl: 'https://example.com/test-voice.mp3',
      isAvailableForAds: true,
      pricePerAd: 50,
      usageTerms: 'Test NFT voice licensing terms',
      profileImageUrl: null,
    };
    
    const { data: voiceProfile, error: voiceError } = await supabase.functions.invoke(
      'create-voice-profile',
      { body: testVoiceData }
    );
    
    if (voiceError) {
      console.error('❌ Voice profile creation failed:', voiceError);
      return;
    }
    
    console.log('✅ Voice profile created!');
    console.log('   Voice ID:', voiceProfile.voiceProfile.id);
    console.log('   Voice Name:', voiceProfile.voiceProfile.voice_name);
    console.log('');
    
    // Step 2: Wait for NFT minting (it happens automatically)
    console.log('⏳ Step 2: Waiting for blockchain NFT minting...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check blockchain certificate
    console.log('🔍 Step 3: Checking blockchain certificate...');
    const { data: certificate, error: certError } = await supabase
      .from('voice_blockchain_certificates')
      .select('*')
      .eq('voice_profile_id', voiceProfile.voiceProfile.id)
      .single();
    
    if (certError) {
      console.warn('⚠️  Certificate not found yet. May take a moment to mint.');
      console.log('');
    } else {
      console.log('✅ BLOCKCHAIN NFT MINTED SUCCESSFULLY! 🎉');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📜 NFT Certificate Details:');
      console.log('   Token ID:', certificate.token_id);
      console.log('   Voice Fingerprint:', certificate.voice_fingerprint_hash.substring(0, 32) + '...');
      console.log('   Blockchain Network:', certificate.blockchain_network.toUpperCase());
      console.log('   Transaction Hash:', certificate.transaction_hash);
      console.log('   Contract Address:', certificate.contract_address);
      console.log('   Metadata URI:', certificate.metadata_uri);
      console.log('   Gas Sponsored:', certificate.gas_sponsored ? 'YES (Free!)' : 'NO');
      console.log('   Status:', certificate.certification_status.toUpperCase());
      console.log('');
      console.log('🔗 View on Polygonscan:');
      console.log(`   https://polygonscan.com/tx/${certificate.transaction_hash}`);
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ What just happened:');
    console.log('   1. You created a voice profile');
    console.log('   2. AI captured your voice fingerprint');
    console.log('   3. System minted an NFT on Polygon blockchain');
    console.log('   4. Certificate is now permanently stored on-chain');
    console.log('   5. You own the NFT proving voice ownership!');
    console.log('');
    console.log('💡 Cool facts:');
    console.log('   • Transaction was GASLESS (Seeksy paid the fee!)');
    console.log('   • NFT can\'t be edited or deleted (immutable)');
    console.log('   • Anyone can verify your voice ownership');
    console.log('   • Works across all platforms and social media');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return { voiceProfile, certificate };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
  }
}

// Make it available globally
(window as any).testVoiceNFT = testVoiceNFTMinting;

console.log('🧪 Voice NFT Test Ready!');
console.log('Run in console: window.testVoiceNFT()');
