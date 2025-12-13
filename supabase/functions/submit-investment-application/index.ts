import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvestmentApplication {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  numberOfShares: number;
  pricePerShare: number;
  totalAmount: number;
  investmentMode: "shares" | "amount";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: InvestmentApplication = await req.json();
    const { name, email, street, city, state, zip, numberOfShares, pricePerShare, totalAmount } = body;

    console.log("Received investment application:", { name, email, numberOfShares, totalAmount });

    // Basic validation
    if (!name || !email || !street || !city || !state || !zip) {
      return new Response(
        JSON.stringify({ success: false, error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (numberOfShares <= 0 || totalAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid investment amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format address for storage
    const fullAddress = `${street}, ${city}, ${state} ${zip}`;

    // Create legal_doc_instance with status "pending" for admin review
    const { data: instance, error: insertError } = await supabase
      .from("legal_doc_instances")
      .insert({
        template_id: "3369d427-1854-4a8d-986d-7c8d64a3b2e5", // Common Stock Purchase Agreement template ID
        status: "pending",
        purchaser_email: email.toLowerCase(),
        recipient_name: name,
        recipient_email: email.toLowerCase(),
        document_type: "stock_purchase_agreement",
        field_values_json: {
          purchaser_name: name,
          purchaser_email: email.toLowerCase(),
          purchaser_street: street,
          purchaser_city: city,
          purchaser_state: state,
          purchaser_zip: zip,
          purchaser_address: fullAddress,
          numberOfShares: numberOfShares.toString(),
          pricePerShare: pricePerShare.toString(),
        },
        computed_values_json: {
          totalAmount: totalAmount.toFixed(2),
          numberOfShares: numberOfShares,
          pricePerShare: pricePerShare,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save application" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Investment application saved:", instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        applicationId: instance.id,
        message: "Application submitted successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in submit-investment-application:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
