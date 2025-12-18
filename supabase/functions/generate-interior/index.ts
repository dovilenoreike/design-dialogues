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
    const { imageBase64, roomCategory, materialPrompt, materialImages, stylePrompt, freestyleDescription } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
    
    // Add instruction about reference images if provided
    if (materialImages && materialImages.length > 0) {
      designPrompt += ` CRITICAL: The attached material reference images show the EXACT textures, colors, and finishes to use. Replicate these materials precisely - match the exact color tones, grain patterns, surface textures, and material characteristics shown in each reference image. The flooring, cabinetry, countertops, and backsplash must visually match the provided material samples.`;
    }
    
    designPrompt += " Create a photorealistic interior render with natural lighting and professional photography quality. Maintain the room's existing architecture, windows, and spatial layout while transforming the finishes and materials.";

    console.log("Generating interior with prompt:", designPrompt);
    console.log("Number of material reference images:", materialImages?.length || 0);

    // Build content array with room image and optional material reference images
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: designPrompt
      },
      {
        type: "image_url",
        image_url: {
          url: imageBase64
        }
      }
    ];
    
    // Add material reference images if provided (limit to 4 to avoid token limits)
    if (materialImages && Array.isArray(materialImages)) {
      const limitedImages = materialImages.slice(0, 4);
      for (const materialImage of limitedImages) {
        contentArray.push({
          type: "image_url",
          image_url: {
            url: materialImage
          }
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: contentArray
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the generated image
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ 
        generatedImage,
        message: data.choices?.[0]?.message?.content || "Interior design generated successfully"
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
