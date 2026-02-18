import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No signature provided");
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      // Use async version for Deno compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      console.error("Signature received:", signature?.substring(0, 50) + "...");
      console.error("Body length:", body.length);
      return new Response(
        JSON.stringify({ error: "Invalid signature", details: err instanceof Error ? err.message : "Unknown" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const creditsToAdd = parseInt(session.metadata?.credits_to_add || "10", 10);

      if (!userId) {
        console.error("No user_id in session metadata");
        return new Response(
          JSON.stringify({ error: "No user_id in metadata" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Adding ${creditsToAdd} credits to user: ${userId}`);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get current credits and add new ones
      const { data: currentData, error: fetchError } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code === "PGRST116") {
        // User doesn't exist, create with purchased credits
        const { error: insertError } = await supabase
          .from("user_credits")
          .insert({ user_id: userId, credits: creditsToAdd });

        if (insertError) {
          throw insertError;
        }
      } else if (fetchError) {
        throw fetchError;
      } else {
        // Update existing user
        const { error: updateError } = await supabase
          .from("user_credits")
          .update({ credits: currentData.credits + creditsToAdd })
          .eq("user_id", userId);

        if (updateError) {
          throw updateError;
        }
      }

      console.log("Credits added successfully");
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
