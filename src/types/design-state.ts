/**
 * Design state type definitions for Index page
 * Groups related state for cleaner component structure
 */

import { DEFAULT_STYLE, DEFAULT_ROOM } from "@/data/visualisations";

export type UploadType = "photo" | "sketch" | "floorplan";

export interface DesignSelection {
  uploadedImages: Record<string, string | null>;  // Per-room uploaded images, keyed by room name
  uploadTypes: Record<string, UploadType>;  // Per-room upload type, keyed by room name
  selectedCategory: string | null;
  selectedStyle: string | null;  // Combined style ID (architecture + atmosphere)
  freestyleDescription: string;
  lastSelectedRoom: string | null;  // Last room user selected/interacted with (for Hero display)
}

export interface GenerationState {
  isProcessing: boolean;
  isGenerating: boolean;
  showResults: boolean;
  generatedImages: Record<string, string | null>;
  clayRenderImages: Record<string, string | null>;  // base64, in-memory only
  pendingRoomSwitch: string | null;
  showRoomSwitchDialog: boolean;
  pendingStyleSwitch: string | null;
  showStyleSwitchDialog: boolean;
  pendingImageUpload: File | null;
  showUploadDialog: boolean;
}

export const initialDesignSelection: DesignSelection = {
  uploadedImages: {},  // Empty - no uploads initially
  uploadTypes: {},  // Empty - no upload types initially
  selectedCategory: DEFAULT_ROOM,
  selectedStyle: DEFAULT_STYLE,
  freestyleDescription: "",
  lastSelectedRoom: null,  // No room selected initially
};

export const initialGenerationState: GenerationState = {
  isProcessing: false,
  isGenerating: false,
  showResults: false,
  generatedImages: {},
  clayRenderImages: {},
  pendingRoomSwitch: null,
  showRoomSwitchDialog: false,
  pendingStyleSwitch: null,
  showStyleSwitchDialog: false,
  pendingImageUpload: null,
  showUploadDialog: false,
};
