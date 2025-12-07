import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-resend-signature',
};

interface ResendInboundEmail {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== resend-inbound-email webhook received ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ResendInboundEmail = await req.json();
    console.log('Inbound email from:', payload.from);
    console.log('To:', payload.to);
    console.log('Subject:', payload.subject);

    // Extract the original message ID from headers (In-Reply-To or References)
    const inReplyTo = payload.headers?.['in-reply-to'] || payload.headers?.['In-Reply-To'];
    const references = payload.headers?.['references'] || payload.headers?.['References'];
    const messageIdToMatch = inReplyTo || references?.split(/\s+/)[0];

    console.log('Looking for original message:', messageIdToMatch);

    // Find the original email event by message_id
    let originalEmail = null;
    if (messageIdToMatch) {
      const { data: emailEvent } = await supabase
        .from('email_events')
        .select('*, profiles:user_id(id, full_name, email)')
        .eq('message_id', messageIdToMatch.replace(/[<>]/g, ''))
        .single();
      
      originalEmail = emailEvent;
    }

    // If not found by message_id, try matching by subject line
    if (!originalEmail && payload.subject) {
      // Remove Re: / Fwd: prefixes for matching
      const cleanSubject = payload.subject.replace(/^(Re:|Fwd:|RE:|FWD:)\s*/gi, '').trim();
      
      const { data: emailEvents } = await supabase
        .from('email_events')
        .select('*, profiles:user_id(id, full_name, email)')
        .ilike('subject', `%${cleanSubject}%`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Find the most likely match (to the same recipient)
      const fromEmail = payload.from.match(/<([^>]+)>$/)?.[1] || payload.from;
      originalEmail = emailEvents?.find(e => 
        e.recipient_email?.toLowerCase() === fromEmail.toLowerCase()
      ) || emailEvents?.[0];
    }

    if (originalEmail) {
      console.log('Found original email:', originalEmail.id, 'from user:', originalEmail.user_id);
      
      // Parse sender info
      const fromMatch = payload.from.match(/^(.+?)\s*<([^>]+)>$/);
      const fromName = fromMatch ? fromMatch[1].trim() : payload.from;
      const fromAddress = fromMatch ? fromMatch[2] : payload.from;
      
      // Store the reply in email_replies table
      const { data: reply, error: insertError } = await supabase
        .from('email_replies')
        .insert({
          email_event_id: originalEmail.id,
          from_address: fromAddress,
          from_name: fromName,
          subject: payload.subject,
          snippet: (payload.text || payload.html?.replace(/<[^>]*>/g, '') || '').substring(0, 500),
          body_text: payload.text,
          body_html: payload.html,
          received_at: new Date().toISOString(),
          source: 'resend_inbound',
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting reply:', insertError);
      } else {
        console.log('Reply stored successfully:', reply?.id);
        
        // Update the email_event reply count
        await supabase
          .from('email_events')
          .update({ 
            reply_count: (originalEmail.reply_count || 0) + 1 
          })
          .eq('id', originalEmail.id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          matched: true,
          original_email_id: originalEmail.id,
          reply_id: reply?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No matching original email found - storing as orphan');
      
      // Store as an unmatched inbound email for manual review
      const fromMatch = payload.from.match(/^(.+?)\s*<([^>]+)>$/);
      const fromName = fromMatch ? fromMatch[1].trim() : payload.from;
      const fromAddress = fromMatch ? fromMatch[2] : payload.from;
      
      // Could create a separate table for unmatched inbound emails
      // For now, just log it
      console.log('Orphan email from:', fromAddress, 'Subject:', payload.subject);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          matched: false,
          message: 'No matching original email found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error processing inbound email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
