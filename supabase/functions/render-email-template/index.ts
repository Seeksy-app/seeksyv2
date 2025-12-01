import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

// Import all templates
import { WelcomeEmail } from "../_shared/email/templates/welcome.tsx";
import { VerifyEmail } from "../_shared/email/templates/verify-email.tsx";
import { PasswordReset } from "../_shared/email/templates/password-reset.tsx";
import { MeetingInvitation } from "../_shared/email/templates/meeting-invitation.tsx";
import { EventRegistration } from "../_shared/email/templates/event-registration.tsx";
import { PodcastPublished } from "../_shared/email/templates/podcast-published.tsx";
import { AIProductionReady } from "../_shared/email/templates/ai-production-ready.tsx";
import { NewSubscriber } from "../_shared/email/templates/new-subscriber.tsx";
import { CampaignEmail } from "../_shared/email/templates/campaign-email.tsx";
import { IdentityVerified } from "../_shared/email/templates/identity-verified.tsx";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const templateMap: Record<string, any> = {
  "welcome": WelcomeEmail,
  "verify-email": VerifyEmail,
  "password-reset": PasswordReset,
  "meeting-invitation": MeetingInvitation,
  "event-registration": EventRegistration,
  "podcast-published": PodcastPublished,
  "ai-production-ready": AIProductionReady,
  "new-subscriber": NewSubscriber,
  "campaign-email": CampaignEmail,
  "identity-verified": IdentityVerified,
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateKey, variables, recipientEmail } = await req.json();

    if (!templateKey || !variables) {
      throw new Error("Missing templateKey or variables");
    }

    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Get the React component
    const TemplateComponent = templateMap[templateKey];
    if (!TemplateComponent) {
      throw new Error(`Template component not implemented: ${templateKey}`);
    }

    // Render the template with variables
    const html = await renderAsync(
      React.createElement(TemplateComponent, variables)
    );

    // Replace placeholder variables in the rendered HTML
    let finalHtml = html;
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://seeksy.io";
    
    // Replace common placeholders
    finalHtml = finalHtml.replace(/\{\{BASE_URL\}\}/g, baseUrl);
    finalHtml = finalHtml.replace(/\{\{EMAIL\}\}/g, recipientEmail || "");
    finalHtml = finalHtml.replace(/\{\{LOGO_URL\}\}/g, `${baseUrl}/storage/v1/object/public/logos/main_logo`);
    finalHtml = finalHtml.replace(/\{\{LOGO_DARK_URL\}\}/g, `${baseUrl}/storage/v1/object/public/logos/dark_logo`);
    finalHtml = finalHtml.replace(/\{\{MASCOT_URL\}\}/g, `${baseUrl}/storage/v1/object/public/logos/mascots/default`);

    // Replace template-specific variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key.toUpperCase()}\\}\\}`, 'g');
      finalHtml = finalHtml.replace(placeholder, String(value));
    });

    return new Response(
      JSON.stringify({
        success: true,
        html: finalHtml,
        template: {
          id: template.id,
          name: template.template_name,
          key: template.template_key,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error rendering email template:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
