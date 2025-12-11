import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  inviterUserId: string;
  inviteeName: string;
  inviteeEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviterUserId, inviteeName, inviteeEmail }: NotifyRequest = await req.json();
    
    console.log(`[notify-board-invite-accepted] Processing notification for inviter: ${inviterUserId}`);
    console.log(`[notify-board-invite-accepted] New board member: ${inviteeName} (${inviteeEmail})`);

    // Get the inviter's email from auth.users
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: inviterData, error: inviterError } = await supabase.auth.admin.getUserById(inviterUserId);
    
    if (inviterError || !inviterData?.user?.email) {
      console.error("[notify-board-invite-accepted] Failed to get inviter email:", inviterError);
      throw new Error("Could not find inviter email");
    }

    const inviterEmail = inviterData.user.email;
    console.log(`[notify-board-invite-accepted] Sending notification to: ${inviterEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Seeksy <hello@seeksy.io>",
      to: [inviterEmail],
      subject: `🎉 ${inviteeName} accepted your Board Portal invite!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <img src="https://seeksy.io/lovable-uploads/7d6a5e00-1d47-49a4-891e-a6b6afb24977.png" alt="Seeksy" style="height: 40px; margin-bottom: 16px;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Board Member Joined!</h1>
            </div>
            
            <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! <strong>${inviteeName}</strong> has accepted your invitation to join the Seeksy Board Portal.
              </p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #2C6BED; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0;">
                  <strong>Email:</strong> ${inviteeEmail}
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                They now have access to the Board Portal where they can view business metrics, forecasts, and company updates.
              </p>
              
              <div style="text-align: center;">
                <a href="https://seeksy.io/admin/team-members" style="display: inline-block; background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View Team Members
                </a>
              </div>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} Seeksy. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[notify-board-invite-accepted] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[notify-board-invite-accepted] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
