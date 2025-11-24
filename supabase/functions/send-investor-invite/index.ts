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
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .code-box { background: #f3f4f6; border: 2px dashed #9ca3af; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
            .access-code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; font-family: 'Courier New', monospace; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .instructions { background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Financial Forecast Access</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to view financial models</p>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>${senderName ? `<strong>${senderName}</strong> has` : 'You have been'} invited you to access their financial forecasts and models on Seeksy.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your Access Code</p>
              <div class="access-code">${accessCode}</div>
            </div>
            
            <div style="text-align: center;">
              <a href="${investorLink}" class="button">Access Financial Models</a>
            </div>
            
            <div class="instructions">
              <strong>How to Access:</strong>
              <ul>
                <li>Click the button above to visit the investor portal</li>
                <li>Enter the access code: <strong>${accessCode}</strong></li>
                <li>View read-only financial forecasts and models</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
              <strong>Note:</strong> This access code expires in 30 days. The link provides read-only access to financial data.
            </p>
          </div>
          
          <div class="footer">
            <p>Sent via Seeksy Financial Platform</p>
            <p style="font-size: 12px; color: #9ca3af;">If you didn't expect this email, you can safely ignore it.</p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${senderEmail}>`,
      to: [investorEmail],
      subject: `Financial Forecast Access - Code: ${accessCode}`,
      html: emailHtml,
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
