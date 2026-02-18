import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, useMemo } from "react";
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
import { parseUrlState, buildUrl } from "@/lib/url-state";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";
import { defaultAuditVariables } from "@/data/layout-audit-rules";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { compressImage } from "@/lib/image-utils";
import { captureError, setSentryDesignContext } from "@/lib/sentry";
import { getErrorTranslationKey } from "@/lib/error-messages";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

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
  uploadedImage: string | null;
  generatedImage: string | null;
  authLoading: boolean;

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

  // Auth state - automatic anonymous auth
  const { user, loading: authLoading } = useAuth();

  // Language for translated error messages
  const { t } = useLanguage();

  // Design state - now stores URLs from Supabase instead of base64
  const [design, setDesign] = useState<DesignSelection>(initialDesignSelection);
  const [generation, setGeneration] = useState<GenerationState>(initialGenerationState);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Navigation state
  const [activeTab, setActiveTabState] = useState<BottomTab>("design");
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
  const isUrlSyncEnabled = useRef(false); // Prevent URL update during initial load
  const hasLoadedFromDB = useRef(false); // Track if design state loaded from DB

  // Track if this is a shared session view
  const isSharedSession = !!initialSharedSession;

  // Load session from shared data or Supabase on mount
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
      return;
    }

    // Apply URL params
    const urlState = parseUrlState(location.pathname, location.search);

    if (urlState.tab) {
      setActiveTabState(urlState.tab);
    }
    if (urlState.palette) {
      const palette = getPaletteById(urlState.palette);
      if (palette) {
        setDesign((prev) => ({ ...prev, selectedMaterial: urlState.palette }));
      }
    }
    if (urlState.room) {
      setDesign((prev) => ({ ...prev, selectedCategory: urlState.room }));
    }
    if (urlState.style) {
      const style = getStyleById(urlState.style);
      if (style) {
        setDesign((prev) => ({ ...prev, selectedStyle: urlState.style }));
      }
    }
    if (urlState.tier) {
      setSelectedTierState(urlState.tier);
    }

    setIsInitialized(true);
    setTimeout(() => {
      isUrlSyncEnabled.current = true;
    }, 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load design state from Supabase (after URL params have been applied)
  useEffect(() => {
    if (!user || authLoading || isSharedSession || !isInitialized || hasLoadedFromDB.current) return;

    const loadDesignState = async () => {
      try {
        const { data, error } = await supabase
          .from('user_design_state')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load design state:', error);
          return;
        }

        // Mark as loaded even if no data found (new user)
        hasLoadedFromDB.current = true;

        if (data) {
          // Check what was set via URL params
          const urlState = parseUrlState(location.pathname, location.search);

          // Restore state - URL params take precedence over saved state
          setDesign(prev => {
            const restoredRoom = urlState.room || data.selected_category || prev.selectedCategory;
            return {
              ...prev,
              selectedStyle: prev.selectedStyle || data.selected_style || null,
              selectedMaterial: prev.selectedMaterial || data.selected_material || null,
              // Only use saved room if URL didn't specify one (prev is "Kitchen" default)
              selectedCategory: restoredRoom,
              freestyleDescription: prev.freestyleDescription || data.freestyle_description || "",
              // Also restore lastSelectedRoom so the hero image shows correctly
              lastSelectedRoom: prev.lastSelectedRoom || restoredRoom,
            };
          });

          // Restore tier if not set via URL
          setSelectedTierState(prev => {
            return urlState.tier || (data.selected_tier as Tier) || prev;
          });

          // Restore form data
          if (data.form_data && !formData) {
            setFormData(data.form_data as FormData);
          }

          // Restore layout audit state
          if (data.layout_audit_responses && Object.keys(layoutAuditResponses).length === 0) {
            setLayoutAuditResponses(data.layout_audit_responses as Record<string, AuditResponse>);
          }
          if (data.layout_audit_variables) {
            const vars = data.layout_audit_variables as AuditVariables;
            if (vars.numberOfAdults !== undefined) {
              setLayoutAuditVariables(vars);
            }
          }

          // Restore timeline state
          if (data.user_move_in_date && !userMoveInDate) {
            setUserMoveInDate(new Date(data.user_move_in_date));
          }
          if (data.completed_tasks && data.completed_tasks.length > 0 && completedTasks.size === 0) {
            setCompletedTasks(new Set(data.completed_tasks));
          }
        }
      } catch (err) {
        console.error('Error loading design state:', err);
        captureError(err, { action: "loadDesignState" });
      }
    };

    loadDesignState();
  }, [user, authLoading, isSharedSession, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save design state to Supabase (debounced)
  const saveDesignStateToSupabase = useCallback(async () => {
    if (!user || isSharedSession) return;

    const state = {
      user_id: user.id,
      selected_style: design.selectedStyle,
      selected_material: design.selectedMaterial,
      selected_category: design.selectedCategory,
      freestyle_description: design.freestyleDescription,
      selected_tier: selectedTier,
      form_data: formData,
      layout_audit_responses: layoutAuditResponses,
      layout_audit_variables: layoutAuditVariables,
      user_move_in_date: userMoveInDate?.toISOString().split('T')[0] || null,
      completed_tasks: Array.from(completedTasks),
    };

    try {
      const { error } = await supabase
        .from('user_design_state')
        .upsert(state, { onConflict: 'user_id' });

      if (error) {
        console.error('Failed to save design state:', error);
      }
    } catch (err) {
      console.error('Error saving design state:', err);
      captureError(err, { action: "saveDesignState" });
    }
  }, [
    user,
    isSharedSession,
    design.selectedStyle,
    design.selectedMaterial,
    design.selectedCategory,
    design.freestyleDescription,
    selectedTier,
    formData,
    layoutAuditResponses,
    layoutAuditVariables,
    userMoveInDate,
    completedTasks,
  ]);

  // Debounced save function
  const debouncedSaveDesignState = useDebouncedCallback(saveDesignStateToSupabase, 1000);

  // Trigger save when state changes
  useEffect(() => {
    if (isInitialized && user && !isSharedSession && hasLoadedFromDB.current) {
      debouncedSaveDesignState();
    }
  }, [
    isInitialized,
    user,
    isSharedSession,
    design.selectedStyle,
    design.selectedMaterial,
    design.selectedCategory,
    design.freestyleDescription,
    selectedTier,
    formData,
    layoutAuditResponses,
    layoutAuditVariables,
    userMoveInDate,
    completedTasks,
    debouncedSaveDesignState,
  ]);

  // Load uploaded images from user_uploads table
  useEffect(() => {
    if (!user || authLoading || isSharedSession) return;

    const loadUploads = async () => {
      try {
        const { data, error } = await supabase
          .from('user_uploads')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to load uploads:', error);
          return;
        }

        if (data && data.length > 0) {
          const uploaded: Record<string, string> = {};

          data.forEach(upload => {
            const { data: urlData } = supabase.storage
              .from('user-images')
              .getPublicUrl(upload.image_path);
            uploaded[upload.room_category] = urlData.publicUrl;
          });

          setDesign(prev => ({
            ...prev,
            uploadedImages: { ...prev.uploadedImages, ...uploaded },
          }));
        }
      } catch (err) {
        console.error('Error loading uploads:', err);
      }
    };

    loadUploads();
  }, [user, authLoading, isSharedSession]);

  // Load generated image for current room+style+palette from user_generations table
  // This runs when any of these change, providing the caching behavior
  useEffect(() => {
    if (!user || authLoading || isSharedSession) return;

    const room = design.selectedCategory || "Kitchen";
    const style = design.selectedStyle;
    // Use "freestyle" as the material value when in freestyle mode
    const material = design.freestyleDescription?.trim()
      ? "freestyle"
      : design.selectedMaterial;

    // Need both style and material (or freestyle) to look up a generation
    if (!style || !material) return;

    const loadGeneration = async () => {
      try {
        const { data, error } = await supabase
          .from('user_generations')
          .select('image_path')
          .eq('user_id', user.id)
          .eq('room_category', room)
          .eq('selected_style', style)
          .eq('selected_material', material)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows found" - not an error for us
          console.error('Failed to load generation:', error);
          return;
        }

        if (data?.image_path) {
          const { data: urlData } = supabase.storage
            .from('user-images')
            .getPublicUrl(data.image_path);
          setGeneration(prev => ({
            ...prev,
            generatedImages: { ...prev.generatedImages, [room]: urlData.publicUrl },
          }));
        } else {
          // No generation for this combo - clear it
          setGeneration(prev => ({
            ...prev,
            generatedImages: { ...prev.generatedImages, [room]: null },
          }));
        }
      } catch (err) {
        console.error('Error loading generation:', err);
      }
    };

    loadGeneration();
  }, [user, authLoading, isSharedSession, design.selectedCategory, design.selectedStyle, design.selectedMaterial, design.freestyleDescription]);

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

  // Destructure for convenience
  const { uploadedImages, selectedCategory, selectedMaterial, selectedStyle, freestyleDescription } = design;

  // Get current room's uploaded and generated images (now URLs from Supabase)
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;
  const generatedImage = generation.generatedImages[selectedCategory || "Kitchen"] || null;

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

  // Image upload handler - compresses and uploads to Supabase Storage
  const handleImageUpload = useCallback(async (file: File) => {
    if (!user) {
      toast.error("Authentication required");
      return;
    }

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

    try {
      // Get existing upload to delete old file
      const { data: existing } = await supabase
        .from('user_uploads')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', currentRoom)
        .single();

      // Compress the image to 1024px max dimension
      const compressed = await compressImage(file, 1024);

      // Upload to Supabase Storage
      const path = `${user.id}/uploads/${currentRoom}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(path, compressed, { contentType: 'image/jpeg' });

      if (uploadError) {
        throw uploadError;
      }

      // Delete old file if exists
      if (existing?.image_path) {
        await supabase.storage.from('user-images').remove([existing.image_path]);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(path);

      // Upsert database record (replaces old upload for this room)
      const { error: dbError } = await supabase
        .from('user_uploads')
        .upsert({
          user_id: user.id,
          room_category: currentRoom,
          image_path: path,
        }, { onConflict: 'user_id,room_category' });

      if (dbError) {
        console.error('Failed to save upload record:', dbError);
      }

      // Update local state with the URL
      setDesign(prev => ({
        ...prev,
        uploadedImages: { ...prev.uploadedImages, [currentRoom]: urlData.publicUrl },
      }));

      // Track image upload
      trackEvent(AnalyticsEvents.IMAGE_UPLOADED, { room_type: currentRoom });
    } catch (err) {
      console.error('Image upload failed:', err);
      captureError(err, { action: "handleImageUpload" });
      toast.error(t(getErrorTranslationKey(err)));
    }
  }, [user, design.selectedCategory, generation.generatedImages]);

  // Clear uploaded image for current room to browse defaults
  const clearUploadedImage = useCallback(async () => {
    const currentRoom = design.selectedCategory || "Kitchen";

    // Clear local state
    setDesign(prev => ({
      ...prev,
      uploadedImages: { ...prev.uploadedImages, [currentRoom]: null },
    }));
    setGeneration(prev => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
    }));

    // Clear from database if user is authenticated
    if (user) {
      try {
        // Get upload to delete from storage
        const { data: upload } = await supabase
          .from('user_uploads')
          .select('image_path')
          .eq('user_id', user.id)
          .eq('room_category', currentRoom)
          .single();

        // Delete from storage
        if (upload?.image_path) {
          await supabase.storage.from('user-images').remove([upload.image_path]);
        }

        // Delete from user_uploads
        await supabase
          .from('user_uploads')
          .delete()
          .eq('user_id', user.id)
          .eq('room_category', currentRoom);

        // Also delete any generations for this room
        const { data: generations } = await supabase
          .from('user_generations')
          .select('image_path')
          .eq('user_id', user.id)
          .eq('room_category', currentRoom);

        if (generations && generations.length > 0) {
          // Delete generation files from storage
          const paths = generations.map(g => g.image_path);
          await supabase.storage.from('user-images').remove(paths);

          // Delete from user_generations
          await supabase
            .from('user_generations')
            .delete()
            .eq('user_id', user.id)
            .eq('room_category', currentRoom);
        }
      } catch (err) {
        console.error('Failed to clear images from database:', err);
        captureError(err, { action: "clearUploadedImage" });
      }
    }
  }, [design.selectedCategory, user]);

  // Save/download generated image - mobile compatible
  const handleSaveImage = useCallback(async () => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const currentGeneratedImage = generation.generatedImages[currentRoom];
    if (!currentGeneratedImage) return;

    const filename = `${design.selectedCategory}-${design.selectedStyle || 'custom'}-visualization.png`;

    try {
      // Fetch image from URL and convert to blob
      const response = await fetch(currentGeneratedImage);
      const blob = await response.blob();

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
      window.open(currentGeneratedImage, '_blank');
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

    // Track palette selection
    if (material) {
      trackEvent(AnalyticsEvents.PALETTE_SELECTED, { palette_id: material });
    }
  }, []);

  // Style selection - with two-table approach, switching styles may restore cached generations
  const handleSelectStyle = useCallback((style: string | null) => {
    // With two-table caching, we don't need confirmation dialogs for style switching
    // The generation effect will automatically load cached generation if available
    setDesign((prev) => ({ ...prev, selectedStyle: style }));

    // Track style selection
    if (style) {
      trackEvent(AnalyticsEvents.STYLE_SELECTED, { style_id: style });
    }
  }, []);

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
    if (!uploadedImage || !selectedCategory || !user) return false;

    const room = selectedCategory || "Kitchen";
    const style = design.selectedStyle;
    // Use "freestyle" as the material value when in freestyle mode
    const material = design.freestyleDescription?.trim()
      ? "freestyle"
      : design.selectedMaterial;

    if (!style) {
      toast.error("Please select a style");
      return false;
    }

    if (!material) {
      toast.error("Please select a palette or enter a freestyle description");
      return false;
    }

    // Track generation start time
    const startTime = Date.now();

    // Set Sentry context before API call
    setSentryDesignContext({
      room,
      style,
      palette: material,
      hasUploadedImage: !!uploadedImage,
    });

    try {
      const palette = design.selectedMaterial ? getPaletteById(design.selectedMaterial) : null;

      // Get combined style and derive architecture + atmosphere from config
      const styleData = design.selectedStyle ? getStyleById(design.selectedStyle) : null;
      const architecture = styleData?.config.architecture
        ? getArchitectureById(styleData.config.architecture)
        : null;
      const atmosphere = styleData?.config.atmosphere
        ? getAtmosphereById(styleData.config.atmosphere)
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

      // Fetch the image from Storage URL
      const imageResponse = await fetch(uploadedImage);
      const imageBlob = await imageResponse.blob();

      // Convert blob to base64 for the edge function (OpenAI API compatibility)
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      // Call Supabase Edge Function for secure server-side generation
      const { data, error } = await supabase.functions.invoke("generate-interior", {
        body: {
          imageBase64,
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

      const generatedImageData = data?.generatedImage;
      if (!generatedImageData) {
        throw new Error("No image returned from generation service");
      }

      // Check for existing generation with this combo to delete old file
      const { data: existing } = await supabase
        .from('user_generations')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', room)
        .eq('selected_style', style)
        .eq('selected_material', material)
        .single();

      // Store the generated image in Supabase Storage
      let generatedBlob: Blob;
      if (generatedImageData.startsWith('data:')) {
        // Base64 data URL
        const base64Response = await fetch(generatedImageData);
        generatedBlob = await base64Response.blob();
      } else {
        // URL from OpenAI
        const urlResponse = await fetch(generatedImageData);
        generatedBlob = await urlResponse.blob();
      }

      const genPath = `${user.id}/generated/${room}_${style}_${material}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(genPath, generatedBlob, { contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('Failed to upload generated image:', uploadError);
        // Fall back to using the original URL/base64
        setGeneration(prev => ({
          ...prev,
          generatedImages: { ...prev.generatedImages, [room]: generatedImageData },
          isGenerating: false,
        }));
        toast.success(t("toast.visualizationGenerated"), { position: "top-center" });

        // Track visualization completed
        trackEvent(AnalyticsEvents.VISUALIZATION_COMPLETED, {
          room,
          style,
          duration_ms: Date.now() - startTime,
        });
        return true;
      }

      // Delete old file if exists
      if (existing?.image_path) {
        await supabase.storage.from('user-images').remove([existing.image_path]);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(genPath);

      // Upsert database record (keyed by room+style+palette)
      await supabase
        .from('user_generations')
        .upsert({
          user_id: user.id,
          room_category: room,
          selected_style: style,
          selected_material: material,
          image_path: genPath,
        }, { onConflict: 'user_id,room_category,selected_style,selected_material' });

      setGeneration(prev => ({
        ...prev,
        generatedImages: { ...prev.generatedImages, [room]: urlData.publicUrl },
        isGenerating: false,
      }));

      toast.success(t("toast.visualizationGenerated"), { position: "top-center" });

      // Track visualization completed
      trackEvent(AnalyticsEvents.VISUALIZATION_COMPLETED, {
        room,
        style,
        duration_ms: Date.now() - startTime,
      });
      return true;
    } catch (err: unknown) {
      captureError(err, {
        action: "generateInteriorRender",
        room,
        style,
        palette: material,
      });
      toast.error(t(getErrorTranslationKey(err)));
      setGeneration((prev) => ({ ...prev, isGenerating: false }));

      // Track visualization failed
      trackEvent(AnalyticsEvents.VISUALIZATION_FAILED, {
        error_type: err instanceof Error ? err.message : "unknown",
      });
      return false;
    }
  }, [uploadedImage, selectedCategory, design, user]);

  // Handle generate button click - returns true if successful
  const handleGenerate = useCallback(async (): Promise<boolean> => {
    setGeneration((prev) => ({ ...prev, isProcessing: true, isGenerating: true }));

    // Track visualization started
    trackEvent(AnalyticsEvents.VISUALIZATION_STARTED, {
      room: design.selectedCategory || "Kitchen",
      style: design.selectedStyle,
      palette: design.freestyleDescription?.trim() ? "freestyle" : design.selectedMaterial,
    });

    return generateInteriorRender();
  }, [generateInteriorRender, design.selectedCategory, design.selectedStyle, design.selectedMaterial, design.freestyleDescription]);

  // Start fresh - reset all state and clear session
  const handleStartFresh = useCallback(async () => {
    setDesign(initialDesignSelection);
    setGeneration(initialGenerationState);
    setFormData(null);
    setActiveTab("design");
    setActiveMode("rooms");
    setUserMoveInDate(null);
    setCompletedTasks(new Set());
    setLayoutAuditResponses({});
    setLayoutAuditVariables(defaultAuditVariables);

    // Clear user data from Supabase
    if (user) {
      try {
        // Get all uploads and generations to delete from storage
        const [{ data: uploads }, { data: generations }] = await Promise.all([
          supabase.from('user_uploads').select('image_path').eq('user_id', user.id),
          supabase.from('user_generations').select('image_path').eq('user_id', user.id),
        ]);

        // Delete files from storage
        const pathsToDelete: string[] = [];
        if (uploads) pathsToDelete.push(...uploads.map(u => u.image_path));
        if (generations) pathsToDelete.push(...generations.map(g => g.image_path));

        if (pathsToDelete.length > 0) {
          await supabase.storage.from('user-images').remove(pathsToDelete);
        }

        // Delete database records
        await Promise.all([
          supabase.from('user_uploads').delete().eq('user_id', user.id),
          supabase.from('user_generations').delete().eq('user_id', user.id),
          supabase.from('user_design_state').delete().eq('user_id', user.id),
        ]);

        // Reset the loaded flag so next visit starts fresh
        hasLoadedFromDB.current = false;
      } catch (err) {
        console.error('Failed to clear data from database:', err);
        captureError(err, { action: "handleStartFresh" });
      }
    }
  }, [user]);

  // Share session with partner - returns share ID or null on error
  const shareSession = useCallback(async (): Promise<string | null> => {
    setIsSharing(true);
    try {
      const currentRoom = design.selectedCategory || "Kitchen";
      const currentUploadedImage = design.uploadedImages[currentRoom] || null;
      const currentGeneratedImage = generation.generatedImages[currentRoom] || null;

      const { data, error } = await supabase.functions.invoke("share-session", {
        body: {
          uploadedImage: currentUploadedImage,
          generatedImage: currentGeneratedImage,
          selectedCategory: design.selectedCategory,
          selectedMaterial: design.selectedMaterial,
          selectedStyle: design.selectedStyle,
          freestyleDescription: design.freestyleDescription,
          selectedTier,
          formData,
          userMoveInDate: userMoveInDate?.toISOString() ?? null,
          completedTasks: Array.from(completedTasks),
          layoutAuditResponses,
          layoutAuditVariables,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to share session");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Track session shared
      trackEvent(AnalyticsEvents.SESSION_SHARED, {
        has_image: !!currentGeneratedImage,
      });

      return data?.shareId || null;
    } catch (err) {
      console.error("Share session error:", err);
      captureError(err, { action: "shareSession" });
      toast.error(t(getErrorTranslationKey(err)));
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [design, generation.generatedImages, selectedTier, formData, userMoveInDate, completedTasks, layoutAuditResponses, layoutAuditVariables]);

  // Confirm room switch - optionally save image first
  const confirmRoomSwitch = useCallback((saveFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const currentGeneratedImage = generation.generatedImages[currentRoom];

    if (saveFirst && currentGeneratedImage) {
      handleSaveImage();
    }

    setGeneration((prev) => ({
      ...prev,
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
    const currentGeneratedImage = generation.generatedImages[currentRoom];

    if (saveFirst && currentGeneratedImage) {
      handleSaveImage();
    }

    // Clear generated image for current room
    setGeneration((prev) => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
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
  const confirmImageUpload = useCallback(async (clearFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const file = generation.pendingImageUpload;

    if (!file || !user) return;

    // Clear the dialog state and optionally clear generated image
    setGeneration((prev) => ({
      ...prev,
      pendingImageUpload: null,
      showUploadDialog: false,
      generatedImages: clearFirst
        ? { ...prev.generatedImages, [currentRoom]: null }
        : prev.generatedImages,
    }));

    try {
      // Get existing upload to delete old file
      const { data: existing } = await supabase
        .from('user_uploads')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', currentRoom)
        .single();

      // Compress the image to 1024px max dimension
      const compressed = await compressImage(file, 1024);

      // Upload to Supabase Storage
      const path = `${user.id}/uploads/${currentRoom}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(path, compressed, { contentType: 'image/jpeg' });

      if (uploadError) {
        throw uploadError;
      }

      // Delete old file if exists
      if (existing?.image_path) {
        await supabase.storage.from('user-images').remove([existing.image_path]);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(path);

      // Upsert database record
      await supabase
        .from('user_uploads')
        .upsert({
          user_id: user.id,
          room_category: currentRoom,
          image_path: path,
        }, { onConflict: 'user_id,room_category' });

      // If clearing, also delete generations for this room
      if (clearFirst) {
        const { data: generations } = await supabase
          .from('user_generations')
          .select('image_path')
          .eq('user_id', user.id)
          .eq('room_category', currentRoom);

        if (generations && generations.length > 0) {
          const paths = generations.map(g => g.image_path);
          await supabase.storage.from('user-images').remove(paths);
          await supabase
            .from('user_generations')
            .delete()
            .eq('user_id', user.id)
            .eq('room_category', currentRoom);
        }
      }

      // Update local state with the URL
      setDesign(prev => ({
        ...prev,
        uploadedImages: { ...prev.uploadedImages, [currentRoom]: urlData.publicUrl },
      }));

      // Track image upload
      trackEvent(AnalyticsEvents.IMAGE_UPLOADED, { room_type: currentRoom });
    } catch (err) {
      console.error('Image upload failed:', err);
      captureError(err, { action: "confirmImageUpload" });
      toast.error(t(getErrorTranslationKey(err)));
    }
  }, [design.selectedCategory, generation.pendingImageUpload, user]);

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
    uploadedImage,
    generatedImage,
    authLoading,
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
