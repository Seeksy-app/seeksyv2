import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
  role: string;
  team_id: string | null;
}

const generateTeamInviteHTML = (inviterName: string, role: string, dashboardUrl: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Seeksy Team</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header with gradient -->
            <tr>
              <td style="background: linear-gradient(135deg, hsl(207, 100%, 50%) 0%, hsl(45, 100%, 60%) 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Seeksy</h1>
                <p style="margin: 0; color: #ffffff; font-size: 20px; opacity: 0.95;">🎉 Welcome to the Team!</p>
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Hey there!</p>
                <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
                  <strong>${inviterName}</strong> just added you to their Seeksy team as a <strong style="color: hsl(207, 100%, 50%);">${role}</strong>. Let's get you set up! 🚀
                </p>

                <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
                  Click below to jump into your dashboard, update your password, and customize your settings.
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${dashboardUrl}" style="display: inline-block; background-color: hsl(207, 100%, 50%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);">Let's Go! →</a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 24px 0 0 0; font-size: 15px; color: #6b7280; text-align: center;">
                  Excited to have you on board! 🎊
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; text-align: center; background-color: #f9fafb;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; font-weight: 600;">Seeksy</p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Your all-in-one platform for creators and teams</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { email, name, role, team_id }: InviteRequest = await req.json();
    
    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    // Get or create team_id
    let actualTeamId = team_id;
    if (!actualTeamId) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      if (team) {
        actualTeamId = team.id;
      }
    }

    // Check if user exists with this email using admin API
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const invitedUser = users?.find((u: any) => u.email === email);

    if (invitedUser) {
      // User exists, add to team_members table
      if (actualTeamId) {
        const { error: memberError } = await supabaseAdmin
          .from("team_members")
          .insert({
            team_id: actualTeamId,
            user_id: invitedUser.id,
            role: role,
          });

        // Ignore conflict errors if already a member
        if (memberError && !memberError.message.includes("duplicate")) {
          throw memberError;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User added to team as ${role}`,
          user_exists: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // User doesn't exist - invite them to sign up via magic link
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      // Get inviter's name
      const { data: inviterProfile } = await supabaseAdmin
        .from("profiles")
        .select("account_full_name, username")
        .eq("id", user.id)
        .single();
      
      const inviterName = inviterProfile?.account_full_name || inviterProfile?.username || "A team member";
      
      // Generate invite token for tracking
      const inviteToken = crypto.randomUUID();
      
      // Track invitation in database first
      const { data: inviteRecord, error: inviteError } = await supabaseAdmin
        .from("team_invitations")
        .insert({
          inviter_id: user.id,
          team_id: actualTeamId,
          invitee_email: email,
          invitee_name: name,
          role: role,
          status: "pending",
        })
        .select()
        .single();
      
      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
      }
      
      // Use magic link / invite user via Supabase Auth
      const siteUrl = Deno.env.get("SITE_URL") || "https://seeksy.io";
      const redirectUrl = `${siteUrl}/auth?invited=true&role=${role}`;
      
      // Invite the user - this sends a Supabase Auth invite email
      const { data: inviteData, error: authInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
          full_name: name,
          invited_role: role,
          inviter_id: user.id,
        }
      });
      
      if (authInviteError) {
        console.error("Auth invite error:", authInviteError);
        // Fall back to sending a manual email if auth invite fails
      }
      
      // Also send a friendly welcome email via Resend
      const dashboardUrl = `${siteUrl}/auth?email=${encodeURIComponent(email)}`;
      const emailHTML = generateTeamInviteHTML(inviterName, role, dashboardUrl);
      const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>";
      
      console.log("Attempting to send team invitation email:", {
        from: senderEmail,
        to: email,
        inviterName,
        role,
      });

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: senderEmail,
        to: [email],
        subject: "🎉 You're Invited to Join Seeksy!",
        html: emailHTML,
      });

      if (emailError) {
        console.error("❌ Resend email error:", emailError);
        throw new Error(`Failed to send email: ${emailError.message || JSON.stringify(emailError)}`);
      }
      
      console.log("✅ Team invitation email sent successfully:", emailData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation email sent to " + email,
          user_exists: false,
          invite_sent: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-team-invitation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});