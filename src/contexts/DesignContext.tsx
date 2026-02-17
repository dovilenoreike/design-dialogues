import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { getArchitectureById } from "@/data/architectures";
import { getAtmosphereById } from "@/data/atmospheres";
import { buildDetailedMaterialPrompt } from "@/lib/palette-utils";
import { supabase } from "@/integrations/supabase/client";
import { saveSession, loadSession, clearSession, SessionData } from "@/lib/session-storage";
import { parseUrlState, buildUrl } from "@/lib/url-state";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";
import { defaultAuditVariables } from "@/data/layout-audit-rules";
import { API_CONFIG } from "@/config/api";

export type BottomTab = "thread" | "design" | "specs" | "budget" | "plan";
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
  completedTasks: Set<string>;

  // Layout audit state
  layoutAuditResponses: Record<string, AuditResponse>;
  layoutAuditVariables: AuditVariables;

  // Computed values
  canGenerate: boolean;

  // Setters
  setActiveTab: (tab: BottomTab) => void;
  setActiveMode: (mode: ControlMode) => void;
  setSelectedTier: (tier: Tier) => void;
  setUserMoveInDate: (date: Date | null) => void;
  toggleTask: (taskId: string) => void;
  setLayoutAuditResponse: (itemId: string, response: AuditResponse | undefined) => void;
  setLayoutAuditAdults: (count: number) => void;
  setLayoutAuditChildren: (count: number) => void;
  setLayoutAuditWorkFromHome: (value: boolean) => void;

  // Design actions
  handleImageUpload: (file: File) => void;
  clearUploadedImage: () => void;
  handleSelectCategory: (category: string | null) => void;
  handleSelectMaterial: (material: string | null) => void;
  handleSelectStyle: (style: string | null) => void;
  handleFreestyleChange: (description: string) => void;

  // Generation actions
  handleGenerate: () => Promise<boolean>;
  handleStartFresh: () => void;

  // Room switch dialog actions
  confirmRoomSwitch: (saveFirst: boolean) => void;
  cancelRoomSwitch: () => void;

  // Style switch dialog actions
  confirmStyleSwitch: (saveFirst: boolean) => void;
  cancelStyleSwitch: () => void;

  // Upload dialog actions
  confirmImageUpload: (clearFirst: boolean) => void;
  cancelImageUpload: () => void;

  // Save action
  handleSaveImage: () => void;

  // Form actions
  setFormData: (data: FormData | null) => void;

  // Sharing
  shareSession: () => Promise<string | null>;
  isSharing: boolean;
  isSharedSession: boolean;
}

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

interface SharedSessionData {
  uploadedImage: string | null;
  generatedImage: string | null;
  selectedCategory: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  freestyleDescription: string;
  selectedTier: Tier;
  formData: FormData | null;
  userMoveInDate: string | null;
  completedTasks: string[];
  layoutAuditResponses?: Record<string, AuditResponse>;
  layoutAuditVariables?: AuditVariables;
}

interface DesignProviderProps {
  children: ReactNode;
  initialSharedSession?: SharedSessionData;
}

export function DesignProvider({ children, initialSharedSession }: DesignProviderProps) {
  // Router hooks for URL sync
  const location = useLocation();
  const navigate = useNavigate();

  // Design state
  const [design, setDesign] = useState<DesignSelection>(initialDesignSelection);
  const [generation, setGeneration] = useState<GenerationState>(initialGenerationState);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Navigation state
  const [activeTab, setActiveTabState] = useState<BottomTab>("thread");
  const [activeMode, setActiveMode] = useState<ControlMode>("rooms");
  const [selectedTier, setSelectedTierState] = useState<Tier>("Standard");

  // Plan state
  const [userMoveInDate, setUserMoveInDate] = useState<Date | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Layout audit state
  const [layoutAuditResponses, setLayoutAuditResponses] = useState<Record<string, AuditResponse>>({});
  const [layoutAuditVariables, setLayoutAuditVariables] = useState<AuditVariables>(defaultAuditVariables);

  // Session persistence
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUrlSyncEnabled = useRef(false); // Prevent URL update during initial load

  // Track if this is a shared session view
  const isSharedSession = !!initialSharedSession;

  // Load session from shared data, localStorage, or URL on mount
  useEffect(() => {
    // If we have a shared session, use that as initial state
    if (initialSharedSession) {
      const currentRoom = initialSharedSession.selectedCategory || "Kitchen";
      setDesign({
        uploadedImages: initialSharedSession.uploadedImage
          ? { [currentRoom]: initialSharedSession.uploadedImage }
          : {},
        selectedCategory: initialSharedSession.selectedCategory,
        selectedMaterial: initialSharedSession.selectedMaterial,
        selectedStyle: initialSharedSession.selectedStyle,
        freestyleDescription: initialSharedSession.freestyleDescription || "",
        lastSelectedRoom: initialSharedSession.selectedCategory,
      });
      if (initialSharedSession.generatedImage) {
        const currentRoom = initialSharedSession.selectedCategory || "Kitchen";
        setGeneration((prev) => ({
          ...prev,
          generatedImages: { [currentRoom]: initialSharedSession.generatedImage },
        }));
      }
      setFormData(initialSharedSession.formData);
      setSelectedTierState(initialSharedSession.selectedTier);
      if (initialSharedSession.userMoveInDate) {
        setUserMoveInDate(new Date(initialSharedSession.userMoveInDate));
      }
      if (initialSharedSession.completedTasks?.length) {
        setCompletedTasks(new Set(initialSharedSession.completedTasks));
      }
      if (initialSharedSession.layoutAuditResponses) {
        setLayoutAuditResponses(initialSharedSession.layoutAuditResponses);
      }
      if (initialSharedSession.layoutAuditVariables) {
        // Migrate old format (only numberOfPeople) to new format (adults + children)
        const vars = initialSharedSession.layoutAuditVariables;
        if (vars.numberOfAdults === undefined || vars.numberOfChildren === undefined) {
          setLayoutAuditVariables({
            numberOfAdults: vars.numberOfPeople || 2,
            numberOfChildren: 0,
            numberOfPeople: vars.numberOfPeople || 2,
            workFromHome: vars.workFromHome ?? false,
          });
        } else {
          setLayoutAuditVariables(vars);
        }
      }
      setIsInitialized(true);
      return; // Don't load from localStorage or URL for shared sessions
    }

    // First load from localStorage
    const session = loadSession();
    if (session) {
      setDesign(session.design);
      if (session.generatedImages) {
        setGeneration((prev) => ({ ...prev, generatedImages: session.generatedImages }));
      }
      setFormData(session.formData);
      setSelectedTierState(session.selectedTier);
      setActiveTabState(session.activeTab);
      setActiveMode(session.activeMode);
      if (session.userMoveInDate) {
        setUserMoveInDate(new Date(session.userMoveInDate));
      }
      if (session.completedTasks?.length) {
        setCompletedTasks(new Set(session.completedTasks));
      }
      if (session.layoutAuditResponses) {
        setLayoutAuditResponses(session.layoutAuditResponses);
      }
      if (session.layoutAuditVariables) {
        // Migrate old format (only numberOfPeople) to new format (adults + children)
        const vars = session.layoutAuditVariables;
        if (vars.numberOfAdults === undefined || vars.numberOfChildren === undefined) {
          // Old format - convert numberOfPeople to adults, assume 0 children
          setLayoutAuditVariables({
            numberOfAdults: vars.numberOfPeople || 2,
            numberOfChildren: 0,
            numberOfPeople: vars.numberOfPeople || 2,
            workFromHome: vars.workFromHome ?? false,
          });
        } else {
          setLayoutAuditVariables(vars);
        }
      }
    }

    // Then apply URL params (URL overrides localStorage for shared links)
    const urlState = parseUrlState(location.pathname, location.search);

    if (urlState.tab) {
      setActiveTabState(urlState.tab);
    }
    if (urlState.palette) {
      // Validate palette exists
      const palette = getPaletteById(urlState.palette);
      if (palette) {
        setDesign((prev) => ({ ...prev, selectedMaterial: urlState.palette }));
      }
    }
    if (urlState.room) {
      setDesign((prev) => ({ ...prev, selectedCategory: urlState.room }));
    }
    if (urlState.style) {
      // Validate style exists
      const style = getStyleById(urlState.style);
      if (style) {
        setDesign((prev) => ({ ...prev, selectedStyle: urlState.style }));
      }
    }
    if (urlState.tier) {
      setSelectedTierState(urlState.tier);
    }

    setIsInitialized(true);
    // Enable URL sync after initial load completes
    setTimeout(() => {
      isUrlSyncEnabled.current = true;
    }, 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when state changes (after initialization)
  useEffect(() => {
    if (!isUrlSyncEnabled.current) return;

    const newUrl = buildUrl(
      activeTab,
      design.selectedMaterial,
      design.selectedCategory,
      design.selectedStyle,
      selectedTier
    );

    // Only update if URL actually changed
    const currentUrl = location.pathname + location.search;
    if (newUrl !== currentUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [activeTab, design.selectedMaterial, design.selectedCategory, design.selectedStyle, selectedTier, navigate, location.pathname, location.search]);

  // Wrapped setters that update both state and trigger URL sync
  const setActiveTab = useCallback((tab: BottomTab) => {
    setActiveTabState(tab);
  }, []);

  const setSelectedTier = useCallback((tier: Tier) => {
    setSelectedTierState(tier);
  }, []);

  // Track latest state in a ref for beforeunload handler
  const latestStateRef = useRef({
    design,
    generatedImages: generation.generatedImages,
    formData,
    selectedTier,
    activeTab,
    activeMode,
    userMoveInDate,
    completedTasks,
    layoutAuditResponses,
    layoutAuditVariables,
  });

  // Keep ref updated
  useEffect(() => {
    latestStateRef.current = {
      design,
      generatedImages: generation.generatedImages,
      formData,
      selectedTier,
      activeTab,
      activeMode,
      userMoveInDate,
      completedTasks,
      layoutAuditResponses,
      layoutAuditVariables,
    };
  }, [design, generation.generatedImages, formData, selectedTier, activeTab, activeMode, userMoveInDate, completedTasks, layoutAuditResponses, layoutAuditVariables]);

  // Save immediately when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = latestStateRef.current;
      saveSession({
        design: state.design,
        generatedImages: state.generatedImages,
        formData: state.formData,
        selectedTier: state.selectedTier,
        activeTab: state.activeTab,
        activeMode: state.activeMode,
        userMoveInDate: state.userMoveInDate?.toISOString() ?? null,
        completedTasks: Array.from(state.completedTasks),
        layoutAuditResponses: state.layoutAuditResponses,
        layoutAuditVariables: state.layoutAuditVariables,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Debounced save to localStorage on state changes
  useEffect(() => {
    // Don't save until we've loaded the initial session
    if (!isInitialized) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentState = {
      design,
      generatedImages: generation.generatedImages,
      formData,
      selectedTier,
      activeTab,
      activeMode,
      userMoveInDate: userMoveInDate?.toISOString() ?? null,
      completedTasks: Array.from(completedTasks),
      layoutAuditResponses,
      layoutAuditVariables,
    };

    // Debounce save by 1 second (reduced from 2 for better UX)
    saveTimeoutRef.current = setTimeout(() => {
      saveSession(currentState);
    }, 1000);

    // On cleanup, save immediately if there's a pending save
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save the current state immediately on cleanup
        saveSession(currentState);
      }
    };
  }, [isInitialized, design, generation.generatedImages, formData, selectedTier, activeTab, activeMode, userMoveInDate, completedTasks, layoutAuditResponses, layoutAuditVariables]);

  // Destructure for convenience
  const { uploadedImages, selectedCategory, selectedMaterial, selectedStyle, freestyleDescription } = design;

  // Get current room's uploaded image
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;

  // Computed: can generate if (style selected AND material selected) OR freestyle description provided
  const canGenerate = !!((selectedStyle && selectedMaterial) || freestyleDescription.trim().length > 0);

  // Toggle task completion status
  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Layout audit setters
  const setLayoutAuditResponse = useCallback((itemId: string, response: AuditResponse | undefined) => {
    setLayoutAuditResponses((prev) => {
      if (response === undefined) {
        // Remove the response (for undo/clear)
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [itemId]: response,
      };
    });
  }, []);

  const setLayoutAuditAdults = useCallback((count: number) => {
    setLayoutAuditVariables((prev) => ({
      ...prev,
      numberOfAdults: count,
      numberOfPeople: count + prev.numberOfChildren,
    }));
    // Sync with formData
    setFormData((prev) => prev ? { ...prev, numberOfAdults: count } : prev);
  }, []);

  const setLayoutAuditChildren = useCallback((count: number) => {
    setLayoutAuditVariables((prev) => ({
      ...prev,
      numberOfChildren: count,
      numberOfPeople: prev.numberOfAdults + count,
    }));
    // Sync with formData
    setFormData((prev) => prev ? { ...prev, numberOfChildren: count } : prev);
  }, []);

  const setLayoutAuditWorkFromHome = useCallback((value: boolean) => {
    setLayoutAuditVariables((prev) => ({
      ...prev,
      workFromHome: value,
    }));
  }, []);

  // Image upload handler - saves per room
  const handleImageUpload = useCallback((file: File) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const hasGeneratedImage = generation.generatedImages[currentRoom];

    // If there's a generated image, show confirmation dialog
    if (hasGeneratedImage) {
      setGeneration((prev) => ({
        ...prev,
        pendingImageUpload: file,
        showUploadDialog: true,
      }));
      return;
    }

    // No generated image - upload directly
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesign((prev) => ({
        ...prev,
        uploadedImages: {
          ...prev.uploadedImages,
          [currentRoom]: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }, [design.selectedCategory, generation.generatedImages]);

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
    setGeneration((prev) => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
    }));
  }, [design.selectedCategory]);

  // Save/download generated image - mobile compatible
  const handleSaveImage = useCallback(async () => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const generatedImage = generation.generatedImages[currentRoom];
    if (!generatedImage) return;

    const filename = `${design.selectedCategory}-${design.selectedStyle || 'custom'}-visualization.png`;

    try {
      // Check if it's a data URL or a remote URL
      const isDataUrl = generatedImage.startsWith('data:');

      let blob: Blob;

      if (isDataUrl) {
        // Convert base64 data URL to blob
        const response = await fetch(generatedImage);
        blob = await response.blob();
      } else {
        // Fetch remote URL and convert to blob
        const response = await fetch(generatedImage);
        blob = await response.blob();
      }

      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);

      // Check if it's iOS (Safari on iOS doesn't support download attribute)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // On iOS, open image in new tab - user can long-press to save
        window.open(blobUrl, '_blank');
        toast.info("Long-press the image to save it to your device", { position: "top-center" });
      } else {
        // Standard download for other browsers
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image saved!", { position: "top-center" });
      }

      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Failed to save image:", error);
      // Fallback: open image in new tab
      window.open(generatedImage, '_blank');
      toast.info("Image opened in new tab - save from there", { position: "top-center" });
    }
  }, [generation.generatedImages, design.selectedCategory, design.selectedStyle]);

  // Category selection - show confirmation if there's a generated image
  const handleSelectCategory = useCallback((category: string | null) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const hasGeneratedImage = generation.generatedImages[currentRoom];
    if (hasGeneratedImage && category !== design.selectedCategory) {
      setGeneration((prev) => ({
        ...prev,
        pendingRoomSwitch: category,
        showRoomSwitchDialog: true,
      }));
      return;
    }
    setDesign((prev) => ({
      ...prev,
      selectedCategory: category,
      lastSelectedRoom: category,
    }));
  }, [generation.generatedImages, design.selectedCategory]);

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
    const currentRoom = design.selectedCategory || "Kitchen";
    const generatedImage = generation.generatedImages[currentRoom];
    if (generatedImage && style !== design.selectedStyle) {
      setGeneration((prev) => ({
        ...prev,
        pendingStyleSwitch: style,
        showStyleSwitchDialog: true,
      }));
      return;
    }
    setDesign((prev) => ({ ...prev, selectedStyle: style }));
  }, [generation.generatedImages, design.selectedStyle, design.selectedCategory]);

  // Freestyle description change
  const handleFreestyleChange = useCallback((description: string) => {
    setDesign((prev) => ({
      ...prev,
      freestyleDescription: description,
      selectedMaterial: description ? null : prev.selectedMaterial, // Clear curated if typing freestyle
    }));
  }, []);

  // Generate interior render - returns true if successful
  const generateInteriorRender = useCallback(async (): Promise<boolean> => {
    if (!uploadedImage || !selectedCategory) return false;

    try {
      const palette = design.selectedMaterial ? getPaletteById(design.selectedMaterial) : null;

      // Get combined style and derive architecture + atmosphere from config
      const style = design.selectedStyle ? getStyleById(design.selectedStyle) : null;
      const architecture = style?.config.architecture
        ? getArchitectureById(style.config.architecture)
        : null;
      const atmosphere = style?.config.atmosphere
        ? getAtmosphereById(style.config.atmosphere)
        : null;

      // Build detailed material prompt with room-specific purposes
      let materialPrompt = "";
      if (palette) {
        materialPrompt = buildDetailedMaterialPrompt(palette, selectedCategory);
      }

      // Get architecture and atmosphere prompts separately
      const architecturePrompt = architecture?.promptSnippet || null;
      const atmospherePrompt = atmosphere?.promptSnippet || null;

      // Combine style prompts for the Supabase function
      const stylePrompt = [architecturePrompt, atmospherePrompt]
        .filter(Boolean)
        .join(" ") || null;

      // Call Supabase Edge Function for secure server-side generation
      const { data, error } = await supabase.functions.invoke("generate-interior", {
        body: {
          imageBase64: uploadedImage,
          roomCategory: selectedCategory,
          materialPrompt: materialPrompt || null,
          stylePrompt,
          freestyleDescription: design.freestyleDescription.trim() || null,
          quality: API_CONFIG.imageGeneration.quality,
          model: API_CONFIG.imageGeneration.model,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate interior");
      }

      const generatedImageBase64 = data?.generatedImage;
      if (!generatedImageBase64) {
        throw new Error("No image returned from generation service");
      }

      const currentRoom = selectedCategory || "Kitchen";
      setGeneration((prev) => ({
        ...prev,
        generatedImages: {
          ...prev.generatedImages,
          [currentRoom]: generatedImageBase64,
        },
        isGenerating: false,
      }));

      // Save session immediately after successful generation
      const updatedGeneratedImages = {
        ...generation.generatedImages,
        [currentRoom]: generatedImageBase64,
      };
      saveSession({
        design,
        generatedImages: updatedGeneratedImages,
        formData,
        selectedTier,
        activeTab,
        activeMode,
        userMoveInDate: userMoveInDate?.toISOString() ?? null,
        completedTasks: Array.from(completedTasks),
        layoutAuditResponses,
        layoutAuditVariables,
      });

      toast.success("Interior visualization generated!", { position: "top-center" });
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      toast.error(errorMessage);
      setGeneration((prev) => ({ ...prev, isGenerating: false }));
      return false;
    }
  }, [uploadedImage, selectedCategory, design, generation.generatedImages, formData, selectedTier, activeTab, activeMode, userMoveInDate, completedTasks, layoutAuditResponses, layoutAuditVariables]);

  // Handle generate button click - returns true if successful
  const handleGenerate = useCallback(async (): Promise<boolean> => {
    setGeneration((prev) => ({ ...prev, isProcessing: true, isGenerating: true }));
    return generateInteriorRender();
  }, [generateInteriorRender]);

  // Start fresh - reset all state and clear session
  const handleStartFresh = useCallback(() => {
    setDesign(initialDesignSelection);
    setGeneration(initialGenerationState);
    setFormData(null);
    setActiveTab("thread");
    setActiveMode("rooms");
    setUserMoveInDate(null);
    setCompletedTasks(new Set());
    setLayoutAuditResponses({});
    setLayoutAuditVariables(defaultAuditVariables);
    clearSession();
  }, []);

  // Share session with partner - returns share ID or null on error
  const shareSession = useCallback(async (): Promise<string | null> => {
    setIsSharing(true);
    try {
      const currentRoom = design.selectedCategory || "Kitchen";
      const uploadedImage = design.uploadedImages[currentRoom] || null;
      const generatedImage = generation.generatedImages[currentRoom] || null;

      const { data, error } = await supabase.functions.invoke("share-session", {
        body: {
          uploadedImage,
          generatedImage: generatedImage,
          selectedCategory: design.selectedCategory,
          selectedMaterial: design.selectedMaterial,
          selectedStyle: design.selectedStyle,
          freestyleDescription: design.freestyleDescription,
          selectedTier,
          formData,
          userMoveInDate: userMoveInDate?.toISOString() ?? null,
          completedTasks: Array.from(completedTasks),
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to share session");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.shareId || null;
    } catch (err) {
      console.error("Share session error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to share design");
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [design, generation.generatedImages, selectedTier, formData, userMoveInDate, completedTasks]);

  // Confirm room switch - optionally save image first
  const confirmRoomSwitch = useCallback((saveFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const generatedImage = generation.generatedImages[currentRoom];

    if (saveFirst && generatedImage) {
      handleSaveImage();
    }

    setGeneration((prev) => ({
      ...prev,
      // Keep generatedImages intact - don't clear on room switch!
      pendingRoomSwitch: null,
      showRoomSwitchDialog: false,
    }));

    setDesign((prev) => ({
      ...prev,
      selectedCategory: generation.pendingRoomSwitch,
      lastSelectedRoom: generation.pendingRoomSwitch,
    }));
  }, [generation.generatedImages, generation.pendingRoomSwitch, handleSaveImage, design.selectedCategory]);

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
    const currentRoom = design.selectedCategory || "Kitchen";
    const generatedImage = generation.generatedImages[currentRoom];

    if (saveFirst && generatedImage) {
      handleSaveImage();
    }

    setGeneration((prev) => ({
      ...prev,
      generatedImages: {
        ...prev.generatedImages,
        [currentRoom]: null,  // Clear only current room
      },
      pendingStyleSwitch: null,
      showStyleSwitchDialog: false,
    }));
    setDesign((prev) => ({ ...prev, selectedStyle: generation.pendingStyleSwitch }));
  }, [generation.generatedImages, generation.pendingStyleSwitch, handleSaveImage, design.selectedCategory]);

  // Cancel style switch
  const cancelStyleSwitch = useCallback(() => {
    setGeneration((prev) => ({
      ...prev,
      pendingStyleSwitch: null,
      showStyleSwitchDialog: false,
    }));
  }, []);

  // Confirm image upload - optionally clear generated image first
  const confirmImageUpload = useCallback((clearFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const file = generation.pendingImageUpload;

    if (!file) return;

    // Clear the dialog state
    setGeneration((prev) => ({
      ...prev,
      pendingImageUpload: null,
      showUploadDialog: false,
      // Clear generated image if user confirmed
      generatedImages: clearFirst
        ? { ...prev.generatedImages, [currentRoom]: null }
        : prev.generatedImages,
    }));

    // Process the upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesign((prev) => ({
        ...prev,
        uploadedImages: {
          ...prev.uploadedImages,
          [currentRoom]: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }, [design.selectedCategory, generation.pendingImageUpload]);

  // Cancel image upload
  const cancelImageUpload = useCallback(() => {
    setGeneration((prev) => ({
      ...prev,
      pendingImageUpload: null,
      showUploadDialog: false,
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
    completedTasks,
    layoutAuditResponses,
    layoutAuditVariables,
    canGenerate,
    setActiveTab,
    setActiveMode,
    setSelectedTier,
    setUserMoveInDate,
    toggleTask,
    setLayoutAuditResponse,
    setLayoutAuditAdults,
    setLayoutAuditChildren,
    setLayoutAuditWorkFromHome,
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
    confirmImageUpload,
    cancelImageUpload,
    handleSaveImage,
    setFormData,
    shareSession,
    isSharing,
    isSharedSession,
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

// Optional hook that returns null if not inside DesignProvider (for use in Header on static pages)
export function useDesignOptional() {
  return useContext(DesignContext);
}
