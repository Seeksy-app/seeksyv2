import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;

    const { activityType, description, metadata } = await req.json();
    const creditsToDeduct = 1; // Everything costs 1 credit

    console.log("Deduct credit request:", { userId: user.id, activityType });

    // Get current balance
    const { data: userCredit, error: fetchError } = await supabaseClient
      .from("user_credits")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching user credits:", fetchError);
      throw fetchError;
    }

    const currentBalance = userCredit?.balance || 0;

    if (currentBalance < creditsToDeduct) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          balance: currentBalance,
          required: creditsToDeduct
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402, // Payment Required
        }
      );
    }

    const newBalance = currentBalance - creditsToDeduct;
    const newTotalSpent = (userCredit?.total_spent || 0) + creditsToDeduct;

    // Update user credits
    const { error: updateError } = await supabaseClient
      .from("user_credits")
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating user credits:", updateError);
      throw updateError;
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -creditsToDeduct,
        transaction_type: "spend",
        activity_type: activityType,
        description: description || `Used 1 credit for ${activityType}`,
        balance_after: newBalance,
        metadata: metadata || {},
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      throw transactionError;
    }

    // Check if user is eligible for spin wheel (every 20 credits spent)
    const totalSpentSinceLastSpin = newTotalSpent % 20;
    const isEligibleForSpin = totalSpentSinceLastSpin === 0 && newTotalSpent > 0;

    console.log("Credit deducted successfully:", { 
      userId: user.id, 
      newBalance,
      isEligibleForSpin 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        balance: newBalance,
        isEligibleForSpin
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in deduct-credit:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});