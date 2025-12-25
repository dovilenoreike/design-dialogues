/**
 * Design state type definitions for Index page
 * Groups related state for cleaner component structure
 */

export interface DesignSelection {
  uploadedImage: string | null;
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
}

export const initialDesignSelection: DesignSelection = {
  uploadedImage: null,
  selectedCategory: null,
  selectedMaterial: null,
  selectedStyle: null,
  freestyleDescription: "",
};

export const initialGenerationState: GenerationState = {
  isProcessing: false,
  isGenerating: false,
  showResults: false,
  generatedImage: null,
};
