import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    tags?: Array<{ name: string; value: string }>;
    clicked_link?: {
      url: string;
      timestamp: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get signing secret
    const signingSecret = Deno.env.get("SIGNING_SECRET");
    if (!signingSecret) {
      console.error("SIGNING_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signature headers
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing signature headers");
      return new Response(
        JSON.stringify({ error: "Missing signature headers" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify signature
    const signedContent = `${svixId}.${svixTimestamp}.${body}`;
    const secretBytes = new TextEncoder().encode(signingSecret.split('_')[1]); // Remove 'whsec_' prefix
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Svix sends multiple signatures (v1=signature), check if any match
    const signatures = svixSignature.split(" ");
    const isValid = signatures.some(sig => {
      const [version, hash] = sig.split("=");
      return version === "v1" && hash === expectedSignature;
    });

    if (!isValid) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the verified body
    const webhookEvent: ResendWebhookEvent = JSON.parse(body);
    console.log("Received Resend webhook:", webhookEvent.type);

    // Extract user_id from tags if present
    const userId = webhookEvent.data.tags?.find(t => t.name === 'user_id')?.value;
    const emailType = webhookEvent.data.tags?.find(t => t.name === 'category')?.value;

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.bounced': 'bounced',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
    };

    const eventType = eventTypeMap[webhookEvent.type];
    
    if (!eventType) {
      console.log(`Unknown event type: ${webhookEvent.type}`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store event in email_events table
    const eventData: any = {
      event_type: eventType,
      recipient_email: webhookEvent.data.to?.[0] || null,
      email_subject: webhookEvent.data.subject || null,
      email_id: webhookEvent.data.email_id || null,
      metadata: {
        from: webhookEvent.data.from,
        tags: webhookEvent.data.tags,
        raw_event: webhookEvent,
      },
    };

    // Add user_id if available
    if (userId) {
      eventData.user_id = userId;
    }

    // Add email type if available
    if (emailType) {
      eventData.email_type = emailType;
    }

    // Add click data if it's a click event
    if (eventType === 'clicked' && webhookEvent.data.clicked_link) {
      eventData.click_url = webhookEvent.data.clicked_link.url;
    }

    const { error: insertError } = await supabase
      .from("email_events")
      .insert(eventData);

    if (insertError) {
      console.error("Error inserting email event:", insertError);
      throw insertError;
    }

    console.log(`Successfully recorded ${eventType} event for ${webhookEvent.data.to?.[0]}`);

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in resend-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
