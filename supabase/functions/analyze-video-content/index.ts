import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  transcript: string;
  fillerWords: Array<{ word: string; timestamp: number; duration: number }>;
  scenes: Array<{ start: number; end: number; description: string; quality: string }>;
  suggestedAdBreaks: Array<{ timestamp: number; reason: string }>;
  qualityIssues: Array<{ type: string; timestamp: number; severity: string; suggestion: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaFileId, videoUrl, analysisType } = await req.json();
    
    if (!mediaFileId || !videoUrl) {
      throw new Error('Missing required parameters: mediaFileId and videoUrl');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Starting video analysis for:', mediaFileId, 'Type:', analysisType);

    // Step 1: Generate transcript using Lovable AI
    const transcriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a video analysis assistant. Analyze video content and provide detailed transcription and timing information.'
          },
          {
            role: 'user',
            content: `Analyze this video URL: ${videoUrl}. Provide a detailed transcript with timestamps, identify filler words (um, uh, like, you know), detect scene changes, suggest optimal ad break points, and identify quality issues.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_video',
            description: 'Analyze video content for editing purposes',
            parameters: {
              type: 'object',
              properties: {
                transcript: {
                  type: 'string',
                  description: 'Full transcript of the video'
                },
                fillerWords: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      word: { type: 'string' },
                      timestamp: { type: 'number' },
                      duration: { type: 'number' }
                    }
                  },
                  description: 'List of filler words with timestamps'
                },
                scenes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'number' },
                      end: { type: 'number' },
                      description: { type: 'string' },
                      quality: { type: 'string', enum: ['good', 'fair', 'poor'] }
                    }
                  },
                  description: 'Scene boundaries with quality assessment'
                },
                suggestedAdBreaks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'number' },
                      reason: { type: 'string' }
                    }
                  },
                  description: 'Optimal timestamps for ad insertion'
                },
                qualityIssues: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['lighting', 'audio', 'shaky', 'blur'] },
                      timestamp: { type: 'number' },
                      severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                      suggestion: { type: 'string' }
                    }
                  },
                  description: 'Quality issues identified in the video'
                }
              },
              required: ['transcript', 'fillerWords', 'scenes', 'suggestedAdBreaks', 'qualityIssues']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_video' } }
      }),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Lovable AI error:', transcriptResponse.status, errorText);
      throw new Error(`Lovable AI request failed: ${transcriptResponse.status}`);
    }

    const aiResponse = await transcriptResponse.json();
    console.log('AI Response received:', JSON.stringify(aiResponse));

    // Extract the analysis from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('No analysis data returned from AI');
    }

    const analysis: AnalysisResult = JSON.parse(toolCall.function.arguments);
    console.log('Parsed analysis:', analysis);

    // Store analysis results in media_processing_jobs
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('media_processing_jobs')
      .update({
        status: 'completed',
        output_data: analysis,
        completed_at: new Date().toISOString()
      })
      .eq('media_file_id', mediaFileId)
      .eq('status', 'processing');

    if (updateError) {
      console.error('Error updating job:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        message: 'Video analysis completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-video-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
