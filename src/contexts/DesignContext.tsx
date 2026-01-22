import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import {
  DesignSelection,
  GenerationState,
  initialDesignSelection,
  initialGenerationState,
} from "@/types/design-state";
import { FormData } from "@/types/calculator";
import { getPaletteById } from "@/data/palettes";
import { getStyleById } from "@/data/styles";
import { buildDetailedMaterialPrompt } from "@/lib/palette-utils";
import { generateInteriorDesign } from "@/lib/openai-api";

export type BottomTab = "design" | "specs" | "budget" | "plan";
export type ControlMode = "rooms" | "palettes" | "styles";
export type Tier = "Budget" | "Standard" | "Premium";

interface DesignContextValue {
  // Design selections
  design: DesignSelection;
  generation: GenerationState;
  formData: FormData | null;

  // Navigation state
  activeTab: BottomTab;
  activeMode: ControlMode;
  selectedTier: Tier;

  // Plan state
  userMoveInDate: Date | null;

  // Computed values
  canGenerate: boolean;

  // Setters
  setActiveTab: (tab: BottomTab) => void;
  setActiveMode: (mode: ControlMode) => void;
  setSelectedTier: (tier: Tier) => void;
  setUserMoveInDate: (date: Date | null) => void;

  // Design actions
  handleImageUpload: (file: File) => void;
  clearUploadedImage: () => void;
  handleSelectCategory: (category: string | null) => void;
  handleSelectMaterial: (material: string | null) => void;
  handleSelectStyle: (style: string | null) => void;
  handleFreestyleChange: (description: string) => void;

  // Generation actions
  handleGenerate: () => void;
  handleStartFresh: () => void;

  // Room switch dialog actions
  confirmRoomSwitch: (saveFirst: boolean) => void;
  cancelRoomSwitch: () => void;

  // Style switch dialog actions
  confirmStyleSwitch: (saveFirst: boolean) => void;
  cancelStyleSwitch: () => void;

  // Save action
  handleSaveImage: () => void;

  // Form actions
  setFormData: (data: FormData | null) => void;
}

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

interface DesignProviderProps {
  children: ReactNode;
}

export function DesignProvider({ children }: DesignProviderProps) {
  // Design state
  const [design, setDesign] = useState<DesignSelection>(initialDesignSelection);
  const [generation, setGeneration] = useState<GenerationState>(initialGenerationState);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<BottomTab>("design");
  const [activeMode, setActiveMode] = useState<ControlMode>("rooms");
  const [selectedTier, setSelectedTier] = useState<Tier>("Standard");

  // Plan state
  const [userMoveInDate, setUserMoveInDate] = useState<Date | null>(null);

  // Destructure for convenience
  const { uploadedImages, selectedCategory, selectedMaterial, freestyleDescription } = design;

  // Get current room's uploaded image
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;

  // Computed: can generate if material selected OR freestyle description provided
  const canGenerate = !!(selectedMaterial || freestyleDescription.trim().length > 0);

  // Image upload handler - saves per room
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const currentRoom = design.selectedCategory || "Kitchen";
      setDesign((prev) => ({
        ...prev,
        uploadedImages: {
          ...prev.uploadedImages,
          [currentRoom]: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }, [design.selectedCategory]);

  // Clear uploaded image for current room to browse defaults
  const clearUploadedImage = useCallback(() => {
    const currentRoom = design.selectedCategory || "Kitchen";
    setDesign((prev) => ({
      ...prev,
      uploadedImages: {
        ...prev.uploadedImages,
        [currentRoom]: null,
      },
    }));
    setGeneration((prev) => ({ ...prev, generatedImage: null }));
  }, [design.selectedCategory]);

  // Save/download generated image
  const handleSaveImage = useCallback(() => {
    if (generation.generatedImage) {
      const link = document.createElement("a");
      link.href = generation.generatedImage;
      link.download = `${design.selectedCategory}-${design.selectedStyle || 'custom'}-visualization.png`;
      link.click();
    }
  }, [generation.generatedImage, design.selectedCategory, design.selectedStyle]);

  // Category selection - show confirmation if there's a generated image
  const handleSelectCategory = useCallback((category: string | null) => {
    if (generation.generatedImage && category !== design.selectedCategory) {
      setGeneration((prev) => ({
        ...prev,
        pendingRoomSwitch: category,
        showRoomSwitchDialog: true,
      }));
      return;
    }
    setDesign((prev) => ({ ...prev, selectedCategory: category }));
  }, [generation.generatedImage, design.selectedCategory]);

  // Material selection
  const handleSelectMaterial = useCallback((material: string | null) => {
    setDesign((prev) => ({
      ...prev,
      selectedMaterial: material,
      freestyleDescription: material ? "" : prev.freestyleDescription, // Clear freestyle if selecting curated
    }));
  }, []);

  // Style selection - show confirmation if there's a generated image
  const handleSelectStyle = useCallback((style: string | null) => {
    if (generation.generatedImage && style !== design.selectedStyle) {
      setGeneration((prev) => ({
        ...prev,
        pendingStyleSwitch: style,
        showStyleSwitchDialog: true,
      }));
      return;
    }
    setDesign((prev) => ({ ...prev, selectedStyle: style }));
  }, [generation.generatedImage, design.selectedStyle]);

  // Freestyle description change
  const handleFreestyleChange = useCallback((description: string) => {
    setDesign((prev) => ({
      ...prev,
      freestyleDescription: description,
      selectedMaterial: description ? null : prev.selectedMaterial, // Clear curated if typing freestyle
    }));
  }, []);

  // Generate interior render
  const generateInteriorRender = useCallback(async () => {
    if (!uploadedImage || !selectedCategory) return;

    try {
      const palette = design.selectedMaterial ? getPaletteById(design.selectedMaterial) : null;
      const style = design.selectedStyle ? getStyleById(design.selectedStyle) : null;

      // Build detailed material prompt with room-specific purposes
      let materialPrompt = "";
      if (palette) {
        materialPrompt = buildDetailedMaterialPrompt(palette, selectedCategory);
      }

      // Call image generation
      const generatedImageBase64 = await generateInteriorDesign(
        uploadedImage,
        selectedCategory,
        materialPrompt || null,
        null,
        style?.promptSnippet || null,
        design.freestyleDescription.trim() || null
      );

      setGeneration((prev) => ({
        ...prev,
        generatedImage: generatedImageBase64,
        isGenerating: false,
      }));
      toast.success("Interior visualization generated!", { position: "top-center" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      toast.error(errorMessage);
      setGeneration((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [uploadedImage, selectedCategory, design.selectedMaterial, design.selectedStyle, design.freestyleDescription]);

  // Handle generate button click
  const handleGenerate = useCallback(() => {
    setGeneration((prev) => ({ ...prev, isProcessing: true, isGenerating: true }));
    generateInteriorRender();
  }, [generateInteriorRender]);

  // Start fresh - reset all state
  const handleStartFresh = useCallback(() => {
    setDesign(initialDesignSelection);
    setGeneration(initialGenerationState);
    setFormData(null);
    setActiveTab("design");
    setActiveMode("rooms");
    setUserMoveInDate(null);
  }, []);

  // Confirm room switch - optionally save image first
  const confirmRoomSwitch = useCallback((saveFirst: boolean) => {
    if (saveFirst && generation.generatedImage) {
      handleSaveImage();
    }
    const newRoom = generation.pendingRoomSwitch;
    setGeneration((prev) => ({
      ...prev,
      generatedImage: null,
      pendingRoomSwitch: null,
      showRoomSwitchDialog: false,
    }));
    setDesign((prev) => ({
      ...prev,
      selectedCategory: newRoom,
      // uploadedImages stays intact - per-room storage
    }));
  }, [generation.generatedImage, generation.pendingRoomSwitch, handleSaveImage]);

  // Cancel room switch
  const cancelRoomSwitch = useCallback(() => {
    setGeneration((prev) => ({
      ...prev,
      pendingRoomSwitch: null,
      showRoomSwitchDialog: false,
    }));
  }, []);

  // Confirm style switch - optionally save image first
  const confirmStyleSwitch = useCallback((saveFirst: boolean) => {
    if (saveFirst && generation.generatedImage) {
      handleSaveImage();
    }
    const newStyle = generation.pendingStyleSwitch;
    setGeneration((prev) => ({
      ...prev,
      generatedImage: null,
      pendingStyleSwitch: null,
      showStyleSwitchDialog: false,
    }));
    setDesign((prev) => ({ ...prev, selectedStyle: newStyle }));
  }, [generation.generatedImage, generation.pendingStyleSwitch, handleSaveImage]);

  // Cancel style switch
  const cancelStyleSwitch = useCallback(() => {
    setGeneration((prev) => ({
      ...prev,
      pendingStyleSwitch: null,
      showStyleSwitchDialog: false,
    }));
  }, []);

  const value: DesignContextValue = {
    design,
    generation,
    formData,
    activeTab,
    activeMode,
    selectedTier,
    userMoveInDate,
    canGenerate,
    setActiveTab,
    setActiveMode,
    setSelectedTier,
    setUserMoveInDate,
    handleImageUpload,
    clearUploadedImage,
    handleSelectCategory,
    handleSelectMaterial,
    handleSelectStyle,
    handleFreestyleChange,
    handleGenerate,
    handleStartFresh,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    handleSaveImage,
    setFormData,
  };

  return (
    <DesignContext.Provider value={value}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error("useDesign must be used within a DesignProvider");
  }
  return context;
}
