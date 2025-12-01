import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { trigger, contactId, eventData } = await req.json();

    console.log(`🤖 Automation trigger: ${trigger} for contact ${contactId}`);

    // Find active automations matching this trigger
    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select("*, automation_actions(*)")
      .eq("trigger_type", trigger)
      .eq("is_active", true);

    if (automationsError) throw automationsError;

    if (!automations || automations.length === 0) {
      console.log("⚠️ No active automations found for this trigger");
      return new Response(
        JSON.stringify({ message: "No automations triggered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const results = [];

    // Execute each automation
    for (const automation of automations) {
      try {
        // Create automation run
        const { data: run, error: runError } = await supabase
          .from("automation_runs")
          .insert({
            automation_id: automation.id,
            contact_id: contactId,
            status: "started",
            started_at: new Date().toISOString(),
            trigger_data: eventData,
          })
          .select()
          .single();

        if (runError) {
          console.error("❌ Failed to create automation run:", runError);
          continue;
        }

        // Get contact details
        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .select("*, contact_preferences(*)")
          .eq("id", contactId)
          .single();

        if (contactError || !contact) {
          console.error("❌ Contact not found");
          await supabase
            .from("automation_runs")
            .update({
              status: "failed",
              error_message: "Contact not found",
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
          continue;
        }

        // Check if contact is unsubscribed
        if (contact.contact_preferences?.global_unsubscribe === true) {
          console.log(`⚠️ Skipping contact ${contact.email} - unsubscribed`);
          await supabase
            .from("automation_runs")
            .update({
              status: "skipped",
              error_message: "Contact is unsubscribed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
          continue;
        }

        // Execute actions in order
        const actions = automation.automation_actions || [];
        actions.sort((a: any, b: any) => (a.action_order || 0) - (b.action_order || 0));

        for (const action of actions) {
          // Apply delay if specified
          if (action.delay_minutes && action.delay_minutes > 0) {
            console.log(`⏰ Delaying ${action.delay_minutes} minutes...`);
            // In production, this should be handled by a queue system
            // For now, we'll just log it
          }

          if (action.action_type === "send_email") {
            const config = action.action_config as any;
            
            // Get template if specified
            let htmlContent = config.html_content || "";
            let subject = config.subject || "Automated Email";

            if (config.template_id) {
              const { data: template } = await supabase
                .from("email_templates")
                .select("*")
                .eq("id", config.template_id)
                .single();

              if (template) {
                htmlContent = template.html_content || htmlContent;
                subject = template.subject || subject;
              }
            }

            // Replace merge tags
            htmlContent = htmlContent.replace(/{{name}}/gi, contact.name || contact.email);
            htmlContent = htmlContent.replace(/{{email}}/gi, contact.email);

            // Get from email
            let fromEmail = "onboarding@resend.dev";
            if (config.from_email_account_id) {
              const { data: emailAccount } = await supabase
                .from("email_accounts")
                .select("email_address")
                .eq("id", config.from_email_account_id)
                .single();
              
              if (emailAccount) {
                fromEmail = emailAccount.email_address;
              }
            }

            // Send email
            const { data: emailData, error: sendError } = await resend.emails.send({
              from: fromEmail,
              to: [contact.email],
              subject,
              html: htmlContent,
            });

            if (sendError) {
              console.error(`❌ Failed to send automation email:`, sendError);
              await supabase
                .from("automation_runs")
                .update({
                  status: "failed",
                  error_message: sendError.message,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", run.id);
              break;
            }

            // Track sent event
            await supabase.from("email_events").insert({
              event_type: "email.sent",
              to_email: contact.email,
              from_email: fromEmail,
              email_subject: subject,
              contact_id: contactId,
              user_id: automation.user_id,
              resend_email_id: emailData?.id,
              occurred_at: new Date().toISOString(),
            });

            console.log(`✅ Automation email sent to ${contact.email}`);
          }
        }

        // Mark run as completed
        await supabase
          .from("automation_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        results.push({ automation: automation.name, status: "success" });
      } catch (err) {
        console.error(`❌ Automation error:`, err);
        results.push({
          automation: automation.name,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    console.log(`✅ Automation engine completed: ${results.length} automations processed`);

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Automation engine error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
