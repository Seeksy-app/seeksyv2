import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  invitee_email: string;
  role: string;
  team_id: string;
}

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

    const { invitee_email, role, team_id }: InviteRequest = await req.json();

    // Check if user exists with this email using admin API
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const invitedUser = users?.find((u: any) => u.email === invitee_email);

    if (invitedUser) {
      // User exists, add to team_members table
      const { error: memberError } = await supabaseAdmin
        .from("team_members")
        .insert({
          team_id: team_id,
          user_id: invitedUser.id,
          role: role,
        });

      // Ignore conflict errors if already a member
      if (memberError && !memberError.message.includes("duplicate")) {
        throw memberError;
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
      // User doesn't exist, send invitation email
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      // Get inviter's name
      const { data: inviterProfile } = await supabaseAdmin
        .from("profiles")
        .select("account_full_name, username")
        .eq("id", user.id)
        .single();
      
      const inviterName = inviterProfile?.account_full_name || inviterProfile?.username || "A team member";
      
      // Construct proper app URL for signup
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      const signupUrl = projectId 
        ? `https://${projectId}.lovableproject.com/auth`
        : `${supabaseUrl}/auth`;
      
      try {
        await resend.emails.send({
          from: Deno.env.get("SENDER_EMAIL") || "Seeksy <noreply@seeksy.app>",
          to: [invitee_email],
          subject: `${inviterName} invited you to join their team on Seeksy`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited to Seeksy!</h1>
              </div>
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="font-size: 18px; color: #111827; margin-bottom: 20px;">
                  Hi there! 👋
                </p>
                <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  <strong>${inviterName}</strong> has invited you to join their team on Seeksy as a <strong style="color: #667eea;">${role}</strong>.
                </p>
                <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 30px;">
                  Seeksy helps creators manage content, collaborate with teams, and grow their audience—all in one place.
                </p>
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${signupUrl}" style="background-color: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                    Accept Invitation
                  </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin-top: 30px;">
                  If you have any questions, our support team is here to help.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="font-size: 13px; color: #9ca3af; margin: 0;">
                  Best regards,<br>
                  <strong>The Seeksy Team</strong>
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        // Continue even if email fails
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation email sent to " + invitee_email,
          user_exists: false 
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
