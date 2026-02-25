import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { captureException } from "../_shared/sentry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert base64 data URL to Blob
function base64ToBlob(base64DataUrl: string): Blob {
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URL format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

interface MaterialImage {
  base64: string;
  purpose: string;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      imageBase64,
      materialImages,
      roomCategory,
      palettePromptSnippet,
      atmospherePrompt,
      quality,
      model,
    }: {
      imageBase64: string;
      materialImages: MaterialImage[];
      roomCategory: string;
      palettePromptSnippet: string;
      atmospherePrompt?: string | null;
      quality?: string;
      model?: string;
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build the material mapping instructions
    const materialInstructions = materialImages
      .map((mat, i) => `- Image ${i + 2}: Use as ${mat.purpose}. (${mat.description})`)
      .join("\n");

    const roomContext = roomCategory
      ? roomCategory.replace(/([A-Z])/g, " $1").toLowerCase().trim()
      : "interior space";

    const atmosphereSection = atmospherePrompt
      ? `\nDecor and atmosphere details: ${atmospherePrompt}\n`
      : "";

    const designPrompt = `Image 1 is a photo of a ${roomContext}. Images 2..${materialImages.length + 1} are texture/material samples.

PRESERVE the exact room layout, architecture, furniture placement, and camera angle from Image 1. Do NOT rearrange, add, or remove any furniture or architectural elements.

ONLY replace surface materials and finishes using the provided texture samples:
${materialInstructions}

Overall aesthetic: ${palettePromptSnippet}
${atmosphereSection}
Create a photorealistic result with natural lighting. The room must look identical in layout — only the materials and surface finishes should change.`;

    console.log("Generating material edit with prompt:", designPrompt);
    console.log("Material images count:", materialImages.length);
    console.log("Quality setting:", quality || "low");
    console.log("Model:", model || "gpt-image-1.5");

    // Build FormData with multiple image[] fields
    const formData = new FormData();

    // Image 1: the room photo
    const roomBlob = base64ToBlob(imageBase64);
    formData.append("image[]", roomBlob, "room.png");

    // Images 2..N: texture samples
    materialImages.forEach((mat, i) => {
      const textureBlob = base64ToBlob(mat.base64);
      formData.append("image[]", textureBlob, `texture_${i}.png`);
    });

    formData.append("prompt", designPrompt);
    formData.append("model", model || "gpt-image-1.5");
    formData.append("size", "1024x1024");
    formData.append("quality", quality || "low");

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

    // Extract the generated image
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
        message: "Material edit generated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating material edit:", error);
    await captureException(error, { functionName: "generate-material-edit" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate material edit" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
