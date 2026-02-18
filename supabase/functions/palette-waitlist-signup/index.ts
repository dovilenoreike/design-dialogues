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
    const { paletteId, email, name, budgetTier } = await req.json();

    // Validate inputs
    if (!paletteId || typeof paletteId !== "string") {
      throw new Error("paletteId is required");
    }

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      throw new Error("Valid email is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into waitlist (ON CONFLICT DO NOTHING is handled by UNIQUE constraint)
    const { error: insertError } = await supabase
      .from("palette_waitlist")
      .insert({
        palette_id: paletteId,
        email: email.toLowerCase().trim(),
        name: name || null,
        budget_tier: budgetTier || null,
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
          type: "palette-waitlist",
          data: {
            paletteId,
            email: email.toLowerCase().trim(),
            name: name || "Not provided",
            budgetTier: budgetTier || "Not provided",
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
    await captureException(error, { functionName: "palette-waitlist-signup" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to join waitlist" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
