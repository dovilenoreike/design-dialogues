import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a short unique ID
function generateShareId(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      uploadedImage,
      generatedImage,
      selectedCategory,
      selectedMaterial,
      selectedStyle,
      freestyleDescription,
      selectedTier,
      formData,
      userMoveInDate,
      completedTasks,
      layoutAuditResponses,
      layoutAuditVariables,
    } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique share ID (retry if collision)
    let shareId = generateShareId();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      // Check if ID already exists (use maybeSingle to avoid error when not found)
      const { data: existing } = await supabase
        .from("shared_sessions")
        .select("id")
        .eq("id", shareId)
        .maybeSingle();

      if (!existing) {
        break; // ID is unique
      }

      // Generate new ID and retry
      shareId = generateShareId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique share ID");
    }

    // Insert shared session
    const { error: insertError } = await supabase
      .from("shared_sessions")
      .insert({
        id: shareId,
        uploaded_image: uploadedImage || null,
        generated_image: generatedImage || null,
        selected_category: selectedCategory || null,
        selected_material: selectedMaterial || null,
        selected_style: selectedStyle || null,
        freestyle_description: freestyleDescription || null,
        selected_tier: selectedTier || "Standard",
        form_data: formData || null,
        user_move_in_date: userMoveInDate || null,
        completed_tasks: completedTasks || [],
        layout_audit_responses: layoutAuditResponses || null,
        layout_audit_variables: layoutAuditVariables || null,
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ shareId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to share session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
