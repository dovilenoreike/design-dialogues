// @ts-nocheck - Deno imports not recognized by local TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse FormData instead of JSON (binary image, no base64 conversion needed)
    const formData = await req.formData();

    const imageFile = formData.get('image') as File;
    const roomCategory = formData.get('roomCategory') as string;
    const materialPrompt = formData.get('materialPrompt') as string | null;
    const stylePrompt = formData.get('stylePrompt') as string | null;
    const freestyleDescription = formData.get('freestyleDescription') as string | null;
    const quality = formData.get('quality') as string || 'low';
    const model = formData.get('model') as string || 'gpt-image-1';

    if (!imageFile) {
      throw new Error("No image file provided");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build the prompt combining all elements
    const roomContext = roomCategory ? `a ${roomCategory.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}` : "an interior space";

    let designPrompt = `Transform this room into ${roomContext} with professional interior design.`;

    if (freestyleDescription) {
      designPrompt += ` Use these materials and finishes: ${freestyleDescription}.`;
    } else if (materialPrompt) {
      designPrompt += ` Apply this material palette and finishes: ${materialPrompt}.`;
    }

    if (stylePrompt) {
      designPrompt += ` Design style characteristics: ${stylePrompt}.`;
    } else {
      designPrompt += ` Style: modern contemporary interior, balanced proportions, quality materials, cohesive design.`;
    }

    designPrompt += " Create a photorealistic interior render with natural lighting, high-end finishes, and professional photography quality. Maintain the room's architecture and layout.";

    console.log("Generating interior with prompt:", designPrompt);
    console.log("Quality setting:", quality);

    // Build FormData for images/edits endpoint (pass File directly, no base64 conversion!)
    const openaiFormData = new FormData();
    openaiFormData.append("image", imageFile, "room.png");
    openaiFormData.append("prompt", designPrompt);
    openaiFormData.append("model", model);
    openaiFormData.append("size", "1024x1024");
    openaiFormData.append("quality", quality);

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: "API authentication failed. Please check your API key." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI response received");

    // Extract the generated image from images/edits response format
    // Response format: { data: [{ url: "..." } or { b64_json: "..." }] }
    let generatedImage = null;

    if (data.data && data.data[0]) {
      if (data.data[0].url) {
        generatedImage = data.data[0].url;
      } else if (data.data[0].b64_json) {
        generatedImage = `data:image/png;base64,${data.data[0].b64_json}`;
      }
    }

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated in response");
    }

    return new Response(
      JSON.stringify({
        generatedImage,
        message: "Interior design generated successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating interior:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate interior" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
