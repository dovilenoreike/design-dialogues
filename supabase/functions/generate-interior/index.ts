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
    const { imageBase64, roomCategory, materialPrompt, stylePrompt, freestyleDescription } = await req.json();
    
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
      designPrompt += ` Apply this material palette: ${materialPrompt}.`;
    }
    
    if (stylePrompt) {
      designPrompt += ` Design style characteristics: ${stylePrompt}.`;
    } else {
      designPrompt += ` Style: modern contemporary interior, balanced proportions, quality materials, cohesive design.`;
    }
    
    designPrompt += " Create a photorealistic interior render with natural lighting, high-end finishes, and professional photography quality. Maintain the room's architecture and layout.";

    console.log("Generating interior with prompt:", designPrompt);

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
            content: [
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
            ]
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
