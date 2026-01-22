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

    // Try to get existing credits
    let { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("device_id", device_id)
      .single();

    // If no record exists, create one with 3 free credits
    if (error && error.code === "PGRST116") {
      const { data: newData, error: insertError } = await supabase
        .from("user_credits")
        .insert({ device_id, credits: 3 })
        .select("credits")
        .single();

      if (insertError) {
        throw insertError;
      }
      data = newData;
    } else if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ credits: data?.credits ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to get credits" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
