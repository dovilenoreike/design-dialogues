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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    console.log("Auth header value:", authHeader?.substring(0, 20) + "...");

    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("No token found in Authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("Auth result - user:", user?.id, "error:", authError?.message);

    if (authError || !user) {
      console.log("Auth failed:", authError?.message || "No user");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user_id = user.id;

    // Try to get existing credits
    let { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", user_id)
      .single();

    // If no record exists, create one with 3 free credits
    if (error && error.code === "PGRST116") {
      const { data: newData, error: insertError } = await supabase
        .from("user_credits")
        .insert({ user_id, credits: 3 })
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
