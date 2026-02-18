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
    const { shareId } = await req.json();

    if (!shareId) {
      throw new Error("shareId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get shared session
    const { data, error } = await supabase
      .from("shared_sessions")
      .select("*")
      .eq("id", shareId)
      .gt("expires_at", new Date().toISOString()) // Not expired
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Session not found or expired" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // Increment view count (fire and forget)
    supabase
      .from("shared_sessions")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", shareId)
      .then(() => {});

    // Map database columns to frontend format
    const session = {
      uploadedImage: data.uploaded_image,
      generatedImage: data.generated_image,
      selectedCategory: data.selected_category,
      selectedMaterial: data.selected_material,
      selectedStyle: data.selected_style,
      freestyleDescription: data.freestyle_description || "",
      selectedTier: data.selected_tier || "Standard",
      formData: data.form_data,
      userMoveInDate: data.user_move_in_date,
      completedTasks: data.completed_tasks || [],
      layoutAuditResponses: data.layout_audit_responses || {},
      layoutAuditVariables: data.layout_audit_variables || null,
    };

    return new Response(
      JSON.stringify({ session }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    await captureException(error, { functionName: "get-shared-session" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to get shared session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
