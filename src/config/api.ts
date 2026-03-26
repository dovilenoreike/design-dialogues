/**
 * API configuration - centralized API settings
 */

export const API_CONFIG = {
  /**
   * GPT-4 Vision settings for image analysis
   */
  vision: {
    model: "gpt-4o",
    maxTokens: 500,  // Reduced from 1000 (shorter analysis)
    temperature: 0.7,
  },

  /**
   * 
   * Image generation settings
   */
  imageGeneration: {
    modelCreative: "gemini-3.1-flash-image-preview", // "gemini-2.5-flash-image" floorplans, sketches — create interior using material refs
    modelAccurate: "gemini-3.1-flash-image-preview",   // photos — preserve layout, replace textures only
    size: "512x512" as const,
    quality: "low",
  },

  /**
   * API endpointsß
   */
  endpoints: {
    chat: "https://api.openai.com/v1/chat/completions",
    imageEdits: "https://api.openai.com/v1/images/edits",
  },
} as const;
