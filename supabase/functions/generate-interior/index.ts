import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert base64 data URL to Blob
function base64ToBlob(base64DataUrl: string): Blob {
  // Extract the base64 content and mime type
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URL format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, roomCategory, materialPrompt, stylePrompt, freestyleDescription, quality } = await req.json();

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
    console.log("Quality setting:", quality || "low");

    // Convert base64 image to Blob for FormData
    const imageBlob = base64ToBlob(imageBase64);

    // Build FormData for images/edits endpoint
    const formData = new FormData();
    formData.append("image", imageBlob, "room.png");
    formData.append("prompt", designPrompt);
    formData.append("model", "gpt-image-1");
    formData.append("size", "1024x1024");
    formData.append("quality", quality || "low");  // Use client quality or default to low

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
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
