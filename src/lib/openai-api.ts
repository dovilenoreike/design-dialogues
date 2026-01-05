/**
 * OpenAI GPT-4 Vision API utility functions
 */

import { API_CONFIG } from "@/config/api";

interface VisionMessage {
  role: "user" | "assistant" | "system";
  content: Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
      detail?: "low" | "high" | "auto";
    };
  }>;
}

interface VisionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

/**
 * Calls GPT-4 Vision API to process an image and generate a design
 */
export async function callGPT4Vision(
  imageBase64: string,
  prompt: string,
  referenceImages?: string[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.");
  }

  // Remove data URL prefix if present
  const base64Image = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64;

  // Build content array with text prompt and images
  const content: VisionMessage["content"] = [
    {
      type: "text",
      text: prompt,
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
        detail: "high",
      },
    },
  ];

  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((refImage) => {
      const base64Ref = refImage.includes(",") 
        ? refImage.split(",")[1] 
        : refImage;
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Ref}`,
          detail: "low",
        },
      });
    });
  }

  const messages: VisionMessage[] = [
    {
      role: "user",
      content,
    },
  ];

  try {
    const response = await fetch(API_CONFIG.endpoints.chat, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.vision.model,
        messages,
        max_tokens: API_CONFIG.vision.maxTokens,
        temperature: API_CONFIG.vision.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API request failed: ${response.statusText}`
      );
    }

    const data: VisionResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from API");
    }

    return data.choices[0].message.content;
  } catch (error) {
    throw error;
  }
}

/**
 * Generates an interior design image using GPT-4 Vision analysis + gpt-image-1.5 generation
 */
export async function generateInteriorDesign(
  imageBase64: string,
  roomCategory: string,
  materialPrompt?: string | null,
  materialImages?: string[] | null,
  stylePrompt?: string | null,
  freestyleDescription?: string | null
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.");
  }

  // Step 1: Use GPT-4 Vision to analyze the uploaded image and create a detailed prompt
  let analysisPrompt = `You are an expert interior designer. Analyze this ${roomCategory} image and create a detailed, specific prompt for generating a new interior design visualization.

Current room analysis:
- Describe the room layout, dimensions, architectural features, and current style
- Note lighting conditions, window placement, and spatial flow

Design transformation requirements:`;

  if (materialPrompt) {
    analysisPrompt += `\n- Material palette: ${materialPrompt}`;
  }

  if (stylePrompt) {
    analysisPrompt += `\n- Architectural style: ${stylePrompt}`;
  }

  if (freestyleDescription) {
    analysisPrompt += `\n- Custom requirements: ${freestyleDescription}`;
  }

  analysisPrompt += `\n\nCreate a detailed, specific prompt (200-300 words) for image generation that describes:
- The transformed room with exact material specifications
- Furniture placement and styles
- Color palette and finishes
- Lighting design and ambiance
- Decorative elements and accessories
- Professional photography style (interior design photography, natural lighting, wide angle)

Format: Return ONLY the image generation prompt, nothing else. Make it vivid, specific, and suitable for image generation.`;

  // Log the analysis prompt for debugging
  console.log("=== STEP 1: GPT-4 Vision Analysis Prompt ===");
  console.log(analysisPrompt);
  console.log("\n");

  // Analyze image with GPT-4 Vision
  const imageGenerationPrompt = await callGPT4Vision(
    imageBase64,
    analysisPrompt,
    materialImages || undefined
  );

  // Log the generated image prompt
  console.log("=== STEP 2: Generated Image Prompt (from GPT-4 Vision) ===");
  console.log(imageGenerationPrompt);
  console.log("\n");

  // Step 2: Use gpt-image-1.5 (or gpt-image-1) to generate the new interior design image
  const generatedImageUrl = await generateImageWithGPTImage(imageGenerationPrompt, apiKey, false);

  return generatedImageUrl;
}

/**
 * Generates an image using gpt-image-1.5 API (or gpt-image-1 as fallback)
 */
async function generateImageWithGPTImage(
  prompt: string,
  apiKey: string,
  usePrimaryModel: boolean = true
): Promise<string> {
  const { primaryModel, fallbackModel, quality, size } = API_CONFIG.imageGeneration;
  const model = usePrimaryModel ? primaryModel : fallbackModel;

  try {
    const response = await fetch(API_CONFIG.endpoints.images, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        quality,
        n: 1,
        size,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If primary model fails, try fallback model
      if (usePrimaryModel && response.status === 400) {
        return generateImageWithGPTImage(prompt, apiKey, false);
      }
      
      throw new Error(
        errorData.error?.message || `GPT-Image API request failed: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      // If primary model fails, try fallback model
      if (usePrimaryModel && data.error.message?.includes("model")) {
        return generateImageWithGPTImage(prompt, apiKey, false);
      }
      throw new Error(data.error.message);
    }

    // gpt-image models return base64-encoded images, not URLs
    if (!data.data || data.data.length === 0) {
      throw new Error("No image data returned from GPT-Image API");
    }

    const imageData = data.data[0];
    
    // Handle base64 response (gpt-image models return b64_json)
    if (imageData.b64_json) {
      return `data:image/png;base64,${imageData.b64_json}`;
    }
    
    // Fallback: handle URL response (if supported)
    if (imageData.url) {
      const imageResponse = await fetch(imageData.url);
      const blob = await imageResponse.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    
    throw new Error("No image data (b64_json or url) returned from GPT-Image API");
  } catch (error) {
    throw error;
  }
}

