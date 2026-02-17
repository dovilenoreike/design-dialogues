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
    model: "gpt-image-1",  // User's tested model
    size: "1024x1024" as const,
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
