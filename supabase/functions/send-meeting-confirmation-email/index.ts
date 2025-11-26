import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { meetingConfirmationSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getClientIP, sanitizeHtml } from '../_shared/security.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(supabase, clientIP, 'send-meeting-confirmation-email');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = validateInput(meetingConfirmationSchema, body);
    
    const { 
      attendeeName, 
      attendeeEmail, 
      meetingTitle, 
      startTime, 
      endTime, 
      locationType, 
      locationDetails,
      description,
      userId,
      meetingId
    } = validatedData;

    console.log("Sending meeting confirmation email to:", attendeeEmail);
    
    const subject = `Meeting Confirmed: ${meetingTitle}`;

    const formattedStartTime = new Date(startTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const formattedEndTime = new Date(endTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const locationLabel = {
      'phone': 'Phone Call',
      'zoom': 'Zoom',
      'teams': 'Microsoft Teams',
      'meet': 'Google Meet',
      'in-person': 'In Person',
      'custom': 'Custom Location',
      'seeksy_studio': 'Seeksy Studio'
    }[locationType] || locationType;

    // Sanitize user-provided content to prevent XSS
    const safeMeetingTitle = sanitizeHtml(meetingTitle);
    const safeAttendeeName = sanitizeHtml(attendeeName);
    const safeLocationDetails = locationDetails ? sanitizeHtml(locationDetails) : '';
    const safeDescription = description ? sanitizeHtml(description) : '';

    // Create iCalendar (.ics) content for calendar invitation
    const formatDateForICS = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Seeksy//Meeting Scheduler//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${meetingId}@seeksy.io`,
      `DTSTAMP:${formatDateForICS(new Date().toISOString())}`,
      `DTSTART:${formatDateForICS(startTime)}`,
      `DTEND:${formatDateForICS(endTime)}`,
      `SUMMARY:${meetingTitle}`,
      `DESCRIPTION:${description || 'Meeting scheduled via Seeksy'}`,
      `LOCATION:${safeLocationDetails || locationLabel}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      `ORGANIZER;CN=Seeksy:mailto:hello@seeksy.io`,
      `ATTENDEE;CN=${attendeeName};RSVP=TRUE:mailto:${attendeeEmail}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
      to: [attendeeEmail],
      subject: subject,
      tags: [
        { name: 'category', value: 'meeting_confirmation' },
        { name: 'user_id', value: userId },
        { name: 'meeting_id', value: meetingId },
      ],
      attachments: [
        {
          filename: 'meeting-invite.ics',
          content: btoa(icsContent),
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Meeting Confirmed!</h1>
          <p>Hi ${safeAttendeeName},</p>
          <p>Your meeting has been successfully scheduled.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Meeting Details</h2>
            <p><strong>Title:</strong> ${safeMeetingTitle}</p>
            <p><strong>Start:</strong> ${formattedStartTime}</p>
            <p><strong>End:</strong> ${formattedEndTime}</p>
            <p><strong>Location:</strong> ${locationLabel}</p>
            ${safeLocationDetails ? `<p><strong>Details:</strong> ${safeLocationDetails}</p>` : ''}
            ${safeDescription ? `<p><strong>Description:</strong> ${safeDescription}</p>` : ''}
          </div>
          
          <p>We look forward to speaking with you!</p>
          <p style="margin: 20px 0;">
            <strong>📅 Add to Calendar:</strong> A calendar invitation (.ics file) is attached to this email. 
            Click on the attachment to add this meeting to your calendar app.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was sent by Seeksy.io
          </p>
        </div>
      `,
    });

    console.log("Meeting confirmation email sent successfully:", emailResponse);

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: 'meeting_confirmation',
      recipient_email: attendeeEmail,
      recipient_name: attendeeName,
      subject: subject,
      status: 'sent',
      related_id: meetingId,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending meeting confirmation email:", error);
    
    // Return generic error to avoid leaking information
    return new Response(
      JSON.stringify({ error: 'Failed to send meeting confirmation email' }),
      { 
        status: error.name === 'ZodError' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
