import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*, email_accounts(*), contact_lists(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    // Get contacts from list or filter
    let contactsQuery = supabase.from('contacts').select('*');
    
    if (campaign.recipient_list_id) {
      const { data: listMembers } = await supabase
        .from('contact_list_members')
        .select('contact_id')
        .eq('list_id', campaign.recipient_list_id);
      
      const contactIds = listMembers?.map(m => m.contact_id) || [];
      contactsQuery = contactsQuery.in('id', contactIds);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) throw contactsError;

    // Filter contacts by preferences
    const eligibleContacts = [];
    for (const contact of contacts || []) {
      const { data: prefs } = await supabase
        .from('contact_preferences')
        .select('*')
        .eq('contact_id', contact.id)
        .single();

      if (!prefs?.global_unsubscribe && prefs?.newsletter) {
        eligibleContacts.push(contact);
      }
    }

    console.log(`Sending to ${eligibleContacts.length} contacts`);

    // Send emails via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let successCount = 0;
    let failCount = 0;

    for (const contact of eligibleContacts) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: campaign.email_accounts?.email_address || 'noreply@seeksy.io',
            to: [contact.email],
            subject: campaign.subject,
            html: campaign.html_content,
            text: campaign.plain_content,
            tags: [
              { name: 'campaign_id', value: campaignId },
              { name: 'contact_id', value: contact.id },
            ],
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Log the send event
          await supabase.from('email_events').insert({
            resend_email_id: result.id,
            campaign_id: campaignId,
            contact_id: contact.id,
            event_type: 'sent',
            email_subject: campaign.subject,
            from_email: campaign.email_accounts?.email_address,
            to_email: contact.email,
            occurred_at: new Date().toISOString(),
          });

          successCount++;
        } else {
          failCount++;
          console.error(`Failed to send to ${contact.email}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error sending to ${contact.email}:`, error);
      }
    }

    // Update campaign stats
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: eligibleContacts.length,
        total_sent: successCount,
      })
      .eq('id', campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: eligibleContacts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-campaign-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});