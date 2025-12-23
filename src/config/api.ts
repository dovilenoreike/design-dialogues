/**
 * API configuration - centralized API settings
 */

export const API_CONFIG = {
  /**
   * GPT-4 Vision settings for image analysis
   */
  vision: {
    model: "gpt-4o",
    maxTokens: 1000,
    temperature: 0.7,
  },

  /**
   * Image generation settings
   */
  imageGeneration: {
    primaryModel: "gpt-image-1.5",
    fallbackModel: "gpt-image-1",
    quality: "low" as const,
    size: "1536x1024" as const,
  },

  /**
   * API endpoints
   */
  endpoints: {
    chat: "https://api.openai.com/v1/chat/completions",
    images: "https://api.openai.com/v1/images/generations",
  },
} as const;
