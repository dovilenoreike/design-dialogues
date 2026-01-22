import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { device_id } = await req.json();

    if (!device_id) {
      throw new Error("device_id is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current credits
    const { data: currentData, error: fetchError } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("device_id", device_id)
      .single();

    if (fetchError) {
      throw new Error("User not found");
    }

    if (currentData.credits <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No credits remaining", credits: 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct 1 credit
    const { data, error } = await supabase
      .from("user_credits")
      .update({ credits: currentData.credits - 1 })
      .eq("device_id", device_id)
      .select("credits")
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, credits: data.credits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to use credit" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
