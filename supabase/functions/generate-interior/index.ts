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

    // Add instruction about reference images if provided
    if (materialImages && materialImages.length > 0) {
      designPrompt += ` Use the provided material reference images as exact visual guides for textures, colors, and finishes. Match these materials precisely in the generated interior.`;
    }

    designPrompt += " Create a photorealistic interior render with natural lighting, high-end finishes, and professional photography quality. Maintain the room's architecture and layout. Generate an image of the redesigned room.";

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: contentArray
          }
        ],
        modalities: ["text", "image"],
        max_tokens: 4096
      }),
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

    // Extract the generated image from OpenAI's response format
    const messageContent = data.choices?.[0]?.message?.content;
    let generatedImage = null;

    // Check for image in the content array (OpenAI's image generation format)
    if (Array.isArray(messageContent)) {
      for (const item of messageContent) {
        if (item.type === "image_url" && item.image_url?.url) {
          generatedImage = item.image_url.url;
          break;
        }
      }
    }

    // Also check for images in the message directly
    if (!generatedImage && data.choices?.[0]?.message?.images?.[0]) {
      generatedImage = data.choices[0].message.images[0].url || data.choices[0].message.images[0].image_url?.url;
    }

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated. The AI model may not support image generation.");
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
