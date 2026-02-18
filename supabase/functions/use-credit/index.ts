import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../_shared/sentry.ts";

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
    console.log("use-credit: Auth header present:", !!authHeader);

    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("use-credit: No token found");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("use-credit: Auth result - user:", user?.id, "error:", authError?.message);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user_id = user.id;

    // Get current credits
    const { data: currentData, error: fetchError } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", user_id)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      .eq("user_id", user_id)
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
    await captureException(error, { functionName: "use-credit" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to use credit" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
