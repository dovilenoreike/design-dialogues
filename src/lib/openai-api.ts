/**
 * OpenAI GPT-4 Vision API utility functions
 */

import { API_CONFIG } from "@/config/api";

/**
 * Default architectural style guidance used when no specific style is selected
 * Provides contemporary aesthetic baseline
 */
const DEFAULT_STYLE_PROMPT = `Contemporary interior design with clean lines and balanced proportions. Embrace a modern aesthetic that feels current yet timeless, avoiding trends in favor of enduring design principles. Focus on spatial clarity, natural light, and thoughtful material combinations. Create spaces that are comfortable and livable while maintaining visual sophistication. Allow the materials to speak for themselves without over-styling or excessive decoration.`;

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
 * Builds transformation prompt directly from user selections
 */
function buildTransformationPrompt(
  roomCategory: string,
  materialPrompt?: string,
  stylePrompt?: string,
  freestyleDescription?: string
): string {
  let prompt = `Create an interior design visualisation for this ${roomCategory}.\n\n`;

  // Use provided style or default to contemporary aesthetic
  const effectiveStylePrompt = stylePrompt || DEFAULT_STYLE_PROMPT;

  // THE ARCHITECTURE section (now always included)
  prompt += `THE ARCHITECTURE: ${effectiveStylePrompt}\n\n`;

  // Add material descriptions (pass through unchanged)
  if (materialPrompt) {
    prompt += `THE MATERIALITY: ${materialPrompt}\n\n`;
  }

  // Add freestyle description
  if (freestyleDescription) {
    prompt += `THE MATERIALITY: ${freestyleDescription}\n\n`;
  }

  // THE SYNTHESIS section (now always included)
  prompt += `THE SYNTHESIS: Create a fusion where the architecture and materiality harmoniously blend together. The design should reflect the chosen style while showcasing the specified materials in a cohesive and visually appealing manner. Focus on balance, contrast, and how the materials enhance the overall architectural concept.`;

  return prompt.trim();
}

/**
 * Edits an image using the /v1/images/edits endpoint
 */
async function editImageWithGPTImage(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  // Convert base64 data URL to Blob
  const response = await fetch(imageBase64);
  const blob = await response.blob();

  // Create File from Blob (required by API)
  const imageFile = new File([blob], 'room.png', { type: 'image/png' });

  // Build multipart form data
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('prompt', prompt);
  formData.append('model', API_CONFIG.imageGeneration.model);
  formData.append('size', API_CONFIG.imageGeneration.size);
  formData.append('quality', API_CONFIG.imageGeneration.quality);
  formData.append('n', '1');

  try {
    const apiResponse = await fetch(API_CONFIG.endpoints.imageEdits, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Note: Don't set Content-Type - browser sets it with multipart boundary
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Image edits API failed: ${apiResponse.statusText}`
      );
    }

    const data = await apiResponse.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.data || data.data.length === 0) {
      throw new Error("No image data returned from API");
    }

    const imageData = data.data[0];

    // Handle base64 response (gpt-image models return b64_json)
    if (imageData.b64_json) {
      return `data:image/png;base64,${imageData.b64_json}`;
    }

    // Handle URL response (if API returns URL instead)
    if (imageData.url) {
      const imageResponse = await fetch(imageData.url);
      const imageBlob = await imageResponse.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
    }

    throw new Error("No image data (b64_json or url) in API response");
  } catch (error) {
    console.error("Image edit failed:", error);
    throw error;
  }
}

/**
 * Generates an interior design using direct prompt + image edits
 */
export async function generateInteriorDesign(
  imageBase64: string,
  roomCategory: string,
  materialPrompt?: string | null,
  materialImages?: string[] | null,  // DEPRECATED - no longer used
  stylePrompt?: string | null,
  freestyleDescription?: string | null
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.");
  }

  // Build transformation prompt directly from user selections
  console.log("=== Building Transformation Prompt ===");
  const transformPrompt = buildTransformationPrompt(
    roomCategory,
    materialPrompt || undefined,
    stylePrompt || undefined,
    freestyleDescription || undefined
  );
  console.log(transformPrompt);
  console.log("");

  // Edit image using GPT-Image API
  console.log("=== Editing Image ===");
  const editedImage = await editImageWithGPTImage(
    imageBase64,
    transformPrompt,
    apiKey
  );

  console.log("Image edit completed successfully");
  return editedImage;
}

