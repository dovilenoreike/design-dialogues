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

// Strip data URL prefix, returning raw base64
function stripDataPrefix(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
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
      designPrompt,
      quality,
      model,
    }: {
      imageBase64: string;
      materialImages: MaterialImage[];
      designPrompt: string;
      quality?: string;
      model?: string;
    } = await req.json();

    const resolvedModel = model || "gpt-image-1";

    let generatedImage: string | null = null;

    if (resolvedModel.startsWith("gemini")) {
      // --- Gemini path ---
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const parts = [
        { inlineData: { mimeType: "image/png", data: stripDataPrefix(imageBase64) } },
        ...materialImages.map((mat) => ({
          inlineData: { mimeType: "image/png", data: stripDataPrefix(mat.base64) },
        })),
        { text: designPrompt },
      ];

      const body = {
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE"] },
      };

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 503) {
          return new Response(
            JSON.stringify({ error: "This model is currently experiencing high demand. Please try again later." }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 403 || response.status === 401) {
          return new Response(
            JSON.stringify({ error: "API authentication failed. Please check your Gemini API key." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const imagePart = data.candidates?.[0]?.content?.parts
        ?.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

      generatedImage = imagePart
        ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
        : null;

    } else {
      // --- OpenAI path ---
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const formData = new FormData();

      const roomBlob = base64ToBlob(imageBase64);
      formData.append("image[]", roomBlob, "room.png");

      materialImages.forEach((mat, i) => {
        const textureBlob = base64ToBlob(mat.base64);
        formData.append("image[]", textureBlob, `texture_${i}.png`);
      });

      formData.append("prompt", designPrompt);
      formData.append("model", resolvedModel);
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

      if (data.data && data.data[0]) {
        if (data.data[0].url) {
          generatedImage = data.data[0].url;
        } else if (data.data[0].b64_json) {
          generatedImage = `data:image/png;base64,${data.data[0].b64_json}`;
        }
      }
    }

    if (!generatedImage) {
      console.error("No image in response");
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
