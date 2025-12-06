import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent PNG as base64
const TRANSPARENT_PIXEL_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Expected path: /signature-tracking-pixel/{signatureId}.png
    // or /signature-tracking-pixel/{signatureId}/{messageKey}.png
    let signatureId: string | null = null;
    let messageKey: string | null = null;

    if (pathParts.length >= 2) {
      const lastPart = pathParts[pathParts.length - 1];
      signatureId = lastPart.replace(".png", "");
      
      // Check if there's a message key
      if (pathParts.length >= 3) {
        signatureId = pathParts[pathParts.length - 2];
        messageKey = lastPart.replace(".png", "");
      }
    }

    console.log("[Tracking Pixel] Request received:", { signatureId, messageKey });

    if (!signatureId) {
      console.log("[Tracking Pixel] Missing signature ID");
      // Still return the pixel even if no signature ID
      const pixelBuffer = Uint8Array.from(atob(TRANSPARENT_PIXEL_BASE64), c => c.charCodeAt(0));
      return new Response(pixelBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }

    // Parse user agent for device info
    const userAgent = req.headers.get("user-agent") || "";
    const deviceType = detectDeviceType(userAgent);
    const emailClient = detectEmailClient(userAgent);
    
    // Get IP address
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("cf-connecting-ip") || 
                      "unknown";

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get signature details to find user_id and workspace_id
    const { data: signature } = await supabase
      .from("email_signatures")
      .select("id, user_id, workspace_id")
      .eq("id", signatureId)
      .single();

    // Log the open event
    const { data: insertedEvent, error } = await supabase
      .from("signature_tracking_events")
      .insert({
        signature_id: signatureId,
        user_id: signature?.user_id || null,
        workspace_id: signature?.workspace_id || null,
        event_type: "open",
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        email_client: emailClient,
        message_key: messageKey,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Tracking Pixel] Failed to log event:", error);
    } else {
      console.log("[Tracking Pixel] Open event logged successfully:", insertedEvent?.id);
      
      // Send notification email if user has it enabled
      if (signature?.user_id) {
        try {
          const notificationUrl = `${supabaseUrl}/functions/v1/signature-notification`;
          await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              userId: signature.user_id,
              signatureId: signatureId,
              eventId: insertedEvent?.id,
              eventType: "open",
              deviceType: deviceType,
              emailClient: emailClient,
            }),
          });
        } catch (notifError) {
          console.error("[Tracking Pixel] Failed to send notification:", notifError);
        }
      }
    }

    // Return the transparent pixel
    const pixelBuffer = Uint8Array.from(atob(TRANSPARENT_PIXEL_BASE64), c => c.charCodeAt(0));
    return new Response(pixelBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Tracking Pixel] Error:", error);
    // Still return pixel even on error
    const pixelBuffer = Uint8Array.from(atob(TRANSPARENT_PIXEL_BASE64), c => c.charCodeAt(0));
    return new Response(pixelBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
      },
    });
  }
};

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}

function detectEmailClient(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("googleimageproxy") || ua.includes("gmail")) return "gmail";
  if (ua.includes("outlook") || ua.includes("microsoft")) return "outlook";
  if (ua.includes("apple") || ua.includes("webkit")) return "apple_mail";
  if (ua.includes("yahoo")) return "yahoo";
  if (ua.includes("thunderbird")) return "thunderbird";
  return "unknown";
}

serve(handler);
