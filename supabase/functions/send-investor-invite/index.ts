import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  investorEmail: string;
  accessCode: string;
  investorLink: string;
  senderName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { investorEmail, accessCode, investorLink, senderName }: InviteRequest = await req.json();

    if (!investorEmail || !accessCode || !investorLink) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
            .container { background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, hsl(207, 100%, 50%) 0%, hsl(45, 100%, 60%) 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #ffffff; padding: 30px; }
            .code-box { background: #f3f4f6; border: 2px dashed #9ca3af; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
            .access-code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: hsl(207, 100%, 50%); font-family: 'Courier New', monospace; }
            .button { display: inline-block; background: hsl(207, 100%, 50%); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .instructions { background: #f9fafb; border-left: 4px solid hsl(207, 100%, 50%); padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .link-text { color: hsl(207, 100%, 50%); word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Financial Forecast Access</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to view financial models</p>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>${senderName ? `${senderName} has` : 'You have been'} invited you to access financial forecasts and models.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your Access Code</p>
                <div class="access-code">${accessCode}</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${investorLink}" class="button" style="color: #ffffff;">Access Financial Models</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link in your browser:</p>
              <p class="link-text" style="font-size: 12px; padding: 10px; background: #f9fafb; border-radius: 4px; margin: 10px 0;">${investorLink}</p>
              
              <div class="instructions">
                <strong>How to Access:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li style="margin: 8px 0;">Click the button above</li>
                  <li style="margin: 8px 0;">Enter the access code: <strong>${accessCode}</strong></li>
                  <li style="margin: 8px 0;">View read-only financial forecasts</li>
                </ol>
              </div>
              
              <p style="color: #6b7280; font-size: 13px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Security Note:</strong> This access code expires in 30 days and provides read-only access to financial data.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 5px 0;">Seeksy Financial Platform</p>
              <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">Questions? Reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Financial Forecast Access

Hello,

${senderName ? `${senderName} has` : 'You have been'} invited you to access financial forecasts and models.

YOUR ACCESS CODE: ${accessCode}

To access the financial portal:
1. Visit: ${investorLink}
2. Enter the access code: ${accessCode}
3. View read-only financial forecasts and models

Security Note: This access code expires in 30 days and provides read-only access to financial data.

---
Seeksy Financial Platform
Questions? Reply to this email.
    `.trim();

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${senderEmail}>`,
      to: [investorEmail],
      replyTo: senderEmail,
      subject: `Financial Forecast Access`,
      html: emailHtml,
      text: emailText,
    });

    console.log("Investor invite email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-investor-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
