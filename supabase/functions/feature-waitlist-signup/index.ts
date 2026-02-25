import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../_shared/sentry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { featureId, email, name } = await req.json();

    // Validate inputs
    if (!featureId || typeof featureId !== "string") {
      throw new Error("featureId is required");
    }

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      throw new Error("Valid email is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into waitlist (ON CONFLICT DO NOTHING is handled by UNIQUE constraint)
    const { error: insertError } = await supabase
      .from("feature_waitlist")
      .insert({
        feature_id: featureId,
        email: email.toLowerCase().trim(),
        name: name || null,
      });

    // If error is not a duplicate constraint violation, throw it
    if (insertError && !insertError.message.includes("duplicate")) {
      throw insertError;
    }

    // Send admin notification email
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: "feature-waitlist",
          data: {
            featureId,
            email: email.toLowerCase().trim(),
            name: name || "Not provided",
          },
        }),
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send notification email:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    await captureException(error, { functionName: "feature-waitlist-signup" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to join waitlist" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
