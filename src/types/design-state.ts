/**
 * Design state type definitions for Index page
 * Groups related state for cleaner component structure
 */

export interface DesignSelection {
  uploadedImages: Record<string, string | null>;  // Per-room uploaded images, keyed by room name
  selectedCategory: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  freestyleDescription: string;
}

export interface GenerationState {
  isProcessing: boolean;
  isGenerating: boolean;
  showResults: boolean;
  generatedImage: string | null;
  pendingRoomSwitch: string | null;
  showRoomSwitchDialog: boolean;
  pendingStyleSwitch: string | null;
  showStyleSwitchDialog: boolean;
}

export const initialDesignSelection: DesignSelection = {
  uploadedImages: {},  // Empty - no uploads initially
  selectedCategory: "Kitchen",
  selectedMaterial: "fog-in-the-forest",
  selectedStyle: "minimalist",
  freestyleDescription: "",
};

export const initialGenerationState: GenerationState = {
  isProcessing: false,
  isGenerating: false,
  showResults: false,
  generatedImage: null,
  pendingRoomSwitch: null,
  showRoomSwitchDialog: false,
  pendingStyleSwitch: null,
  showStyleSwitchDialog: false,
};
