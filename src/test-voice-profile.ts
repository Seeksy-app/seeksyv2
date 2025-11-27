// Test script to verify edge function is working
// This is a temporary test file to debug the voice profile creation

import { supabase } from "@/integrations/supabase/client";

export async function testVoiceProfileCreation() {
  console.log('🧪 Testing voice profile creation via edge function...');
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Not authenticated:', authError);
      return;
    }
    console.log('✅ User authenticated:', user.id);
    
    // Test data
    const testData = {
      voiceName: 'Test Voice ' + Date.now(),
      elevenlabsVoiceId: 'test-voice-id-' + Date.now(),
      sampleAudioUrl: 'https://example.com/test.mp3',
      isAvailableForAds: false,
      pricePerAd: null,
      usageTerms: 'Test terms',
      profileImageUrl: null,
    };
    
    console.log('📤 Calling create-voice-profile edge function...');
    console.log('📦 Payload:', testData);
    
    const { data, error } = await supabase.functions.invoke(
      'create-voice-profile',
      { body: testData }
    );
    
    if (error) {
      console.error('❌ Edge function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ Success!', data);
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
  }
}

// Make it available globally for testing in console
(window as any).testVoiceProfile = testVoiceProfileCreation;

console.log('🧪 Test function loaded. Run: window.testVoiceProfile()');
