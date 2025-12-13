import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignWellRecipient {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface SignWellRequest {
  documentBase64: string;
  documentName: string;
  recipients: SignWellRecipient[];
  subject?: string;
  message?: string;
  instanceId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SIGNWELL_API_KEY = Deno.env.get("SIGNWELL_API_KEY");
    
    if (!SIGNWELL_API_KEY) {
      console.error("SIGNWELL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "SignWell API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SignWellRequest = await req.json();
    const { documentBase64, documentName, recipients, subject, message, instanceId } = body;

    console.log("Creating SignWell document:", documentName);
    console.log("Recipients:", recipients.map(r => r.email));

    // Create document in SignWell with sequential 3-party signing
    // Order: 1) Seller -> 2) Purchaser -> 3) Chairman
    // Note: We use text_tags=true so SignWell looks for [[signature_seller]] etc. in the document
    // Or we define fields explicitly with page/coordinates
    
    const signWellPayload = {
      test_mode: false,
      files: [
        {
          name: documentName,
          file_base64: documentBase64,
        }
      ],
      name: documentName,
      subject: subject || `Please sign: ${documentName}`,
      message: message || "Please review and sign this document at your earliest convenience.",
      recipients: recipients.map((r, index) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        placeholder_name: r.role || `Signer ${index + 1}`,
        signing_order: index + 1, // Sequential: Seller=1, Purchaser=2, Chairman=3
      })),
      fields: [
        // Signature fields for each recipient - positioned on the last page
        // Seller signature (first signer)
        recipients[0] ? [
          {
            type: "signature",
            required: true,
            recipient_id: recipients[0].id,
            page: -1, // Last page
            x: 10,
            y: 70,
            width: 30,
            height: 5,
          },
          {
            type: "date",
            required: true,
            recipient_id: recipients[0].id,
            page: -1,
            x: 45,
            y: 70,
            width: 15,
            height: 3,
          }
        ] : [],
        // Purchaser signature (second signer)
        recipients[1] ? [
          {
            type: "signature",
            required: true,
            recipient_id: recipients[1].id,
            page: -1,
            x: 10,
            y: 80,
            width: 30,
            height: 5,
          },
          {
            type: "date",
            required: true,
            recipient_id: recipients[1].id,
            page: -1,
            x: 45,
            y: 80,
            width: 15,
            height: 3,
          }
        ] : [],
        // Chairman signature (third signer)
        recipients[2] ? [
          {
            type: "signature",
            required: true,
            recipient_id: recipients[2].id,
            page: -1,
            x: 10,
            y: 90,
            width: 30,
            height: 5,
          },
          {
            type: "date",
            required: true,
            recipient_id: recipients[2].id,
            page: -1,
            x: 45,
            y: 90,
            width: 15,
            height: 3,
          }
        ] : [],
      ].flat(),
      apply_signing_order: true, // Enforce sequential signing
      custom_requester_name: "Seeksy Legal",
      custom_requester_email: "legal@seeksy.io",
      redirect_url: `${Deno.env.get("SITE_URL") || "https://seeksy.io"}/legal/signed?instance=${instanceId || ""}`,
      decline_redirect_url: `${Deno.env.get("SITE_URL") || "https://seeksy.io"}/legal/declined?instance=${instanceId || ""}`,
      expires_in: 30,
      reminders: true,
      allow_decline: true,
      allow_reassign: false,
      metadata: instanceId ? { instanceId } : undefined,
    };

    console.log("Sending to SignWell API...");

    const signWellResponse = await fetch("https://www.signwell.com/api/v1/documents/", {
      method: "POST",
      headers: {
        "X-Api-Key": SIGNWELL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signWellPayload),
    });

    const responseText = await signWellResponse.text();
    console.log("SignWell response status:", signWellResponse.status);
    console.log("SignWell response:", responseText);

    if (!signWellResponse.ok) {
      console.error("SignWell API error:", responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create SignWell document", 
          details: responseText 
        }),
        { status: signWellResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signWellData = JSON.parse(responseText);

    console.log("SignWell document created:", signWellData.id);

    return new Response(
      JSON.stringify({
        success: true,
        documentId: signWellData.id,
        status: signWellData.status,
        recipients: signWellData.recipients,
        embeddedSigningUrl: signWellData.embedded_signing_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in signwell-send-document:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
