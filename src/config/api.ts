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
    models: {
      photo:      "gemini-3.1-flash-image-preview",
      empty_room: "gemini-3.1-flash-image-preview",
      sketch:     "gemini-3.1-flash-image-preview",
      floorplan:  "gpt-image-2",
      noUpload:   "gpt-image-2",
    },
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
