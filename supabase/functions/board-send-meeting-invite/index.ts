import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  meeting_id: string;
  invitee_email: string;
  invitee_name?: string;
}

// Generate ICS calendar file content with proper timezone
function generateICS(meeting: any, joinUrl: string): string {
  // Parse meeting date/time as Eastern Time
  const meetingDateStr = meeting.meeting_date;
  const startTimeStr = meeting.start_time || '10:00:00';
  const durationMinutes = meeting.duration_minutes || 60;
  
  // Format for TZID usage (YYYYMMDDTHHMMSS without Z)
  const formatLocalDate = (dateStr: string, timeStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes, seconds] = timeStr.split(':');
    return `${year}${month}${day}T${hours}${minutes}${seconds || '00'}`;
  };
  
  // Calculate end time
  const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
  const totalMinutes = startHours * 60 + startMinutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  
  const uid = `${meeting.id}@seeksy.io`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const startFormatted = formatLocalDate(meetingDateStr, startTimeStr);
  const endFormatted = formatLocalDate(meetingDateStr, endTimeStr);
  
  // Escape description for ICS (newlines as \n, commas and semicolons escaped)
  const description = `Join the meeting: ${joinUrl}\\n\\nClick the link to join when the meeting starts.`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Seeksy//Board Meeting//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZNAME:EDT
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZNAME:EST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;TZID=America/New_York:${startFormatted}
DTEND;TZID=America/New_York:${endFormatted}
SUMMARY:${meeting.title || 'Board Meeting'}
DESCRIPTION:${description}
URL:${joinUrl}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

serve(async (req: Request): Promise<Response> => {
  console.log("board-send-meeting-invite called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin/board_member
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const allowedRoles = ['admin', 'super_admin', 'board_member'];
    const hasPermission = roles?.some(r => allowedRoles.includes(r.role));
    
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { meeting_id, invitee_email, invitee_name }: InviteRequest = await req.json();
    console.log("Sending invite for meeting:", meeting_id, "to:", invitee_email);

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from("board_meeting_notes")
      .select("*")
      .eq("id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      console.error("Meeting not found:", meetingError);
      return new Response(JSON.stringify({ error: "Meeting not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from("board_meeting_invites")
      .select("id, invite_token")
      .eq("meeting_id", meeting_id)
      .eq("invitee_email", invitee_email)
      .maybeSingle();

    let invite_token: string;
    let inviteId: string;

    if (existingInvite) {
      // Resend existing invite
      invite_token = existingInvite.invite_token;
      inviteId = existingInvite.id;
      
      await supabase
        .from("board_meeting_invites")
        .update({ sent_at: new Date().toISOString(), status: 'sent' })
        .eq("id", existingInvite.id);
    } else {
      // Create new invite
      const { data: newInvite, error: inviteError } = await supabase
        .from("board_meeting_invites")
        .insert({
          meeting_id,
          invitee_email,
          invitee_name,
          role: 'board_member',
        })
        .select()
        .single();

      if (inviteError || !newInvite) {
        console.error("Failed to create invite:", inviteError);
        return new Response(JSON.stringify({ error: "Failed to create invite" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      invite_token = newInvite.invite_token;
      inviteId = newInvite.id;
    }

    // Generate join URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://seeksy.io";
    const joinUrl = `${baseUrl}/board/meetings/join/${invite_token}`;

    // Generate ICS content
    const icsContent = generateICS(meeting, joinUrl);
    const icsBase64 = btoa(icsContent);

    // Format meeting date
    const meetingDate = new Date(`${meeting.meeting_date}T${meeting.start_time || '10:00:00'}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Send email with ICS attachment
    const { error: emailError } = await resend.emails.send({
      from: Deno.env.get("SENDER_EMAIL") || "Seeksy Board <noreply@seeksy.io>",
      to: [invitee_email],
      subject: `Board Meeting Invitation: ${meeting.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #053877; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2C6BED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Board Meeting Invitation</h1>
            </div>
            <div class="content">
              <p>Hello${invitee_name ? ` ${invitee_name}` : ''},</p>
              <p>You have been invited to a board meeting.</p>
              
              <div class="details">
                <h3 style="margin-top: 0;">${meeting.title}</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formattedTime}</p>
                <p><strong>Duration:</strong> ${meeting.duration_minutes || 60} minutes</p>
              </div>
              
              <p>
                <a href="${joinUrl}" class="button">Join Meeting</a>
              </p>
              
              <p style="font-size: 14px; color: #666;">
                The meeting link will become active when the host starts the meeting.
                You can add pre-meeting questions before the meeting begins.
              </p>
              
              <div class="footer">
                <p>This invitation was sent by Seeksy Board Portal</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: "board-meeting.ics",
          content: icsBase64,
        },
      ],
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send email", details: emailError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invite sent successfully to:", invitee_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite_id: inviteId,
        invite_token,
        join_url: joinUrl 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in board-send-meeting-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
