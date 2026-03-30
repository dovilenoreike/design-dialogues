import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DesignSelection,
  GenerationState,
  initialDesignSelection,
  initialGenerationState,
  UploadType,
} from "@/types/design-state";
import { FormData } from "@/types/calculator";
import { getStyleById } from "@/data/styles";
import { getArchitectureById } from "@/data/architectures";
import { getAtmosphereById } from "@/data/atmospheres";
import { buildDetailedMaterialPromptWithOverrides, loadMaterialImagesWithOverrides } from "@/lib/palette-utils";
import { supabase } from "@/integrations/supabase/client";
import { parseUrlState, buildUrl } from "@/lib/url-state";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";
import { defaultAuditVariables } from "@/data/layout-audit-rules";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useMaterialOverrides } from "@/hooks/useMaterialOverrides";
import { useGenerationState } from "@/hooks/useGenerationState";
import { compressImage } from "@/lib/image-utils";
import { captureError, setSentryDesignContext } from "@/lib/sentry";
import { getErrorTranslationKey } from "@/lib/error-messages";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import type { VibeTag } from "@/data/collections/types";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getMaterialById, getMaterialsByCategory } from "@/data/materials";
import { getRoomByName } from "@/data/rooms";
import type { SurfaceCategory } from "@/data/materials/types";

export type BottomTab = "moodboard" | "design" | "specs" | "budget" | "plan";
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
  moodboardFilled: boolean;
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
  handleImageUpload: (file: File, uploadType?: UploadType) => void;
  clearUploadedImage: () => void;
  handleSelectCategory: (category: string | null) => void;
  handleSelectMaterial: (material: string | null) => void;
  setActivePalette: (paletteId: string | null) => void;
  handleSelectStyle: (style: string | null) => void;
  handleFreestyleChange: (description: string) => void;

  // Generation actions
  handleGenerate: () => Promise<boolean>;
  generateClayRender: () => Promise<void>;
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

  // Material swap overrides (slotKey → materialId)
  materialOverrides: Record<string, string>;
  setMaterialOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // Excluded material slots (slotKeys to skip in prompt/images)
  excludedSlots: Set<string>;
  setExcludedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Moodboard vibe (Layer 1) — null until user picks a vibe
  vibeTag: VibeTag | null;
  vibeChosen: boolean;
  setVibeTag: (vibe: VibeTag) => void;
  clearVibeTag: () => void;
  skipVibePicker: () => void;
  resetVibeChoice: () => void;

  selectCollection: (id: string) => void;

  // Sharing
  shareSession: () => Promise<string | null>;
  isSharing: boolean;
  isSharedSession: boolean;
  sharedMoodboardSlots: Record<string, string | null> | null;
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
  vibeTag?: string | null;
  moodboardSlots?: Record<string, string | null> | null;
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

  // Showroom mode — used to filter default material selections
  const { activeShowroom } = useShowroom();

  // Design state - now stores URLs from Supabase instead of base64
  const [design, setDesign] = useState<DesignSelection>(initialDesignSelection);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Material swap overrides and excluded slots
  const { materialOverrides, setMaterialOverrides, excludedSlots, setExcludedSlots } = useMaterialOverrides();

  // Navigation state
  const [activeTab, setActiveTabState] = useState<BottomTab>("moodboard");
  const [activeMode, setActiveMode] = useState<ControlMode>("rooms");
  const [selectedTier, setSelectedTierState] = useState<Tier>("Standard");

  // Plan state
  const [userMoveInDate, setUserMoveInDate] = useState<Date | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Layout audit state
  const [layoutAuditResponses, setLayoutAuditResponses] = useState<Record<string, AuditResponse>>({});
  const [layoutAuditVariables, setLayoutAuditVariables] = useState<AuditVariables>(defaultAuditVariables);

  // Moodboard vibe (Layer 1) — persisted so it survives refresh; shared session takes priority
  const [vibeTag, setVibeTagState] = useState<VibeTag | null>(() => {
    if (initialSharedSession?.vibeTag) return initialSharedSession.vibeTag as VibeTag;
    try {
      const saved = localStorage.getItem("moodboard-vibe");
      if (saved === "light-and-airy" || saved === "warm-and-grounded" || saved === "bold-and-moody") {
        return saved;
      }
    } catch {}
    return null;
  });

  // vibeChosen: true once the user has made a deliberate choice (pick a vibe OR skip to see all)
  const [vibeChosen, setVibeChosenState] = useState<boolean>(() => {
    // Existing users who have a vibeTag already chose
    if (initialSharedSession?.vibeTag) return true;
    try {
      if (localStorage.getItem("moodboard-vibe-chosen")) return true;
      // Also treat a persisted vibe as chosen
      const saved = localStorage.getItem("moodboard-vibe");
      if (saved === "light-and-airy" || saved === "warm-and-grounded" || saved === "bold-and-moody") return true;
    } catch {}
    return false;
  });

  // Moodboard slot selections from a shared session (archetype IDs, read-only after mount)
  const sharedMoodboardSlots = useState<Record<string, string | null> | null>(
    initialSharedSession?.moodboardSlots ?? null
  )[0];

  const setVibeTag = useCallback((vibe: VibeTag) => {
    setVibeTagState(vibe);
    setVibeChosenState(true);
    try {
      localStorage.setItem("moodboard-vibe", vibe);
      localStorage.setItem("moodboard-vibe-chosen", "1");
    } catch {}
  }, []);

  // Clear active filter but stay in moodboard (vibeChosen remains true)
  const clearVibeTag = useCallback(() => {
    setVibeTagState(null);
    try { localStorage.removeItem("moodboard-vibe"); } catch {}
  }, []);

  // Skip picker entirely — show all materials with no vibe filter
  const skipVibePicker = useCallback(() => {
    setVibeChosenState(true);
    try { localStorage.setItem("moodboard-vibe-chosen", "1"); } catch {}
  }, []);

  // Go back to picker — clears both vibeTag and vibeChosen
  const resetVibeChoice = useCallback(() => {
    setVibeTagState(null);
    setVibeChosenState(false);
    try {
      localStorage.removeItem("moodboard-vibe");
      localStorage.removeItem("moodboard-vibe-chosen");
    } catch {}
  }, []);

  const selectCollection = useCallback((collectionId: string) => {
    const col = collectionsV2.find((c) => c.id === collectionId);
    if (!col) return;

    // Derive slot selections from the collection pool (first archetype per slot)
    const pool = col.pool;
    const newSelections = {
      floor:            pool["flooring"]?.[0]                                             ?? null,
      mainFronts:       pool["cabinet-fronts"]?.[0]                                       ?? null,
      additionalFronts: pool["cabinet-fronts"]?.[1] ?? pool["cabinet-fronts"]?.[0]        ?? null,
      worktops:         pool["worktops-and-backsplashes"]?.[0]                            ?? null,
      accents:          pool["accents"]?.[0]                                              ?? null,
      mainTiles:        pool["tiles"]?.[0]                                                ?? null,
      additionalTiles:  pool["tiles"]?.[1] ?? pool["tiles"]?.[0]                          ?? null,
    };

    // Persist so MoodboardView reads the right state when it next mounts
    try { localStorage.setItem("moodboard-slot-selections", JSON.stringify(newSelections)); } catch {}

    // Map moodboard slot keys to palette override keys used in materialOverrides
    const SLOT_TO_PK: Record<string, string | null> = {
      floor: "floor", mainFronts: "bottomCabinets", additionalFronts: "topCabinets",
      worktops: "worktops", accents: "accents", mainTiles: "tiles", additionalTiles: "additionalTiles",
    };

    // Map moodboard slot keys to collection category keys
    const SLOT_TO_CATEGORY: Record<string, string> = {
      floor: "flooring", mainFronts: "cabinet-fronts", additionalFronts: "cabinet-fronts",
      worktops: "worktops-and-backsplashes", accents: "accents",
      mainTiles: "tiles", additionalTiles: "tiles",
    };

    // Resolve archetype IDs → actual material IDs from collection products
    // If in showroom mode, prefer a showroom-compatible material for filtered categories
    setMaterialOverrides(() => {
      const next: Record<string, string> = {};
      Object.entries(newSelections).forEach(([k, aId]) => {
        const pk = SLOT_TO_PK[k];
        if (!pk || !aId) return;
        const category = SLOT_TO_CATEGORY[k];
        if (!category) return;

        let materialId: string | undefined;

        // If active showroom filters this category, find first compatible material
        if (
          activeShowroom &&
          (activeShowroom.surfaceCategories as string[]).includes(category)
        ) {
          // First try the collection pool
          const poolMaterials = Object.values(col.products[category] ?? {}).flat();
          materialId = poolMaterials.find(
            (id) => getMaterialById(id)?.showroomIds.includes(activeShowroom.id)
          );
          // If nothing in the pool matches, pick the first showroom material from the database
          if (!materialId) {
            materialId = getMaterialsByCategory(category as SurfaceCategory)
              .find((m) => m.showroomIds.includes(activeShowroom.id))?.id;
          }
        }

        // Fall back to collection default (only when no showroom filter active)
        if (!materialId) {
          materialId = col.products[category]?.[aId]?.[0];
        }

        if (materialId) next[pk] = materialId;
      });
      return next;
    });

    // Sync vibe only if a vibe filter was already active (don't impose one when user had none)
    if (vibeTag !== null && col.vibe !== vibeTag) setVibeTag(col.vibe);
  }, [setMaterialOverrides, vibeTag, setVibeTag, activeShowroom]);

  // Session persistence
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isUrlSyncEnabled = useRef(false); // Prevent URL update during initial load
  const hasLoadedFromDB = useRef(false); // Track if design state loaded from DB

  // Track if this is a shared session view
  const isSharedSession = !!initialSharedSession;

  // Generation state and image operations
  const {
    generation,
    setGeneration,
    pendingUploadTypeRef,
    handleSaveImage,
    handleImageUpload,
    clearUploadedImage,
    handleGenerate,
    generateClayRender,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    confirmImageUpload,
    cancelImageUpload,
  } = useGenerationState({
    design,
    setDesign,
    materialOverrides,
    excludedSlots,
    isSharedSession,
    initialGeneratedImages: initialSharedSession?.generatedImage
      ? { [initialSharedSession.selectedCategory || "Kitchen"]: initialSharedSession.generatedImage }
      : undefined,
  });

  // Load session from shared data or Supabase on mount
  useEffect(() => {
    // If we have a shared session, use that as initial state
    if (initialSharedSession) {
      const currentRoom = initialSharedSession.selectedCategory || "Kitchen";
      setDesign({
        uploadedImages: initialSharedSession.uploadedImage
          ? { [currentRoom]: initialSharedSession.uploadedImage }
          : {},
        uploadTypes: {},
        selectedCategory: initialSharedSession.selectedCategory,
        selectedMaterial: initialSharedSession.selectedMaterial,
        selectedStyle: initialSharedSession.selectedStyle,
        freestyleDescription: initialSharedSession.freestyleDescription || "",
        lastSelectedRoom: initialSharedSession.selectedCategory,
      });
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
    if (urlState.room) {
      setDesign((prev) => ({ ...prev, selectedCategory: urlState.room }));
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
            const savedRoom = data.selected_category && getRoomByName(data.selected_category) ? data.selected_category : null;
            const restoredRoom = urlState.room || savedRoom || prev.selectedCategory;
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

  // Update URL when state changes (after initialization)
  useEffect(() => {
    if (!isUrlSyncEnabled.current) return;

    const newUrl = buildUrl(
      activeTab,
      design.selectedCategory,
      selectedTier
    );

    // Only update if URL actually changed
    const currentUrl = location.pathname + location.search;
    if (newUrl !== currentUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [activeTab, design.selectedCategory, selectedTier, navigate, location.pathname, location.search]);

  // Wrapped setters that update both state and trigger URL sync
  const setActiveTab = useCallback((tab: BottomTab) => {
    setActiveTabState(tab);
    trackEvent(AnalyticsEvents.TAB_VIEWED, { tab });
  }, []);

  const setSelectedTier = useCallback((tier: Tier) => {
    setSelectedTierState(tier);
  }, []);

  // Wrapped setter for move-in date with tracking
  const setUserMoveInDateWithTracking = useCallback((date: Date | null) => {
    setUserMoveInDate(date);
    if (date) {
      trackEvent(AnalyticsEvents.MOVE_IN_DATE_SET, {
        date: date.toISOString().split('T')[0],
        tab: "plan",
      });
    }
  }, []);

  // Destructure for convenience
  const { uploadedImages, selectedCategory, selectedMaterial, selectedStyle, freestyleDescription } = design;

  // Get current room's uploaded and generated images (now URLs from Supabase)
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;
  const generatedImage = generation.generatedImages[selectedCategory || "Kitchen"] || null;

  // Computed: can generate if freestyle description provided, OR (style + material selected AND materials have been mapped via moodboard)
  const canGenerate = !!(freestyleDescription.trim().length > 0 || (selectedStyle && selectedMaterial && Object.keys(materialOverrides).length > 0));

  // All 5 primary moodboard slots have been picked (floor, fronts ×2, worktops, accents)
  const REQUIRED_OVERRIDE_KEYS = ["floor", "bottomCabinets", "topCabinets", "worktops", "accents"];
  const moodboardFilled = REQUIRED_OVERRIDE_KEYS.every((k) => !!materialOverrides[k]);

  // Toggle task completion status
  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      const wasCompleted = next.has(taskId);
      if (wasCompleted) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      // Track the toggle
      trackEvent(AnalyticsEvents.TIMELINE_TASK_TOGGLED, {
        task_id: taskId,
        completed: !wasCompleted,
        tab: "plan",
      });
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
      // Track the response
      trackEvent(AnalyticsEvents.AUDIT_RESPONSE_GIVEN, {
        item_id: itemId,
        response,
        tab: "plan",
      });
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

  // Material selection — collectionId is now stored as selectedMaterial
  const handleSelectMaterial = useCallback((material: string | null) => {
    setDesign((prev) => ({
      ...prev,
      selectedMaterial: material,
      freestyleDescription: material ? "" : prev.freestyleDescription, // Clear freestyle if selecting curated
    }));
    if (material) {
      selectCollection(material); // populates materialOverrides from collection defaults
      trackEvent(AnalyticsEvents.PALETTE_SELECTED, { palette_id: material, tab: "design" });
    }
  }, [selectCollection]);

  const setActivePalette = useCallback((paletteId: string | null) => {
    setDesign((prev) => ({ ...prev, selectedMaterial: paletteId }));
  }, []);

  // Style selection - with two-table approach, switching styles may restore cached generations
  const handleSelectStyle = useCallback((style: string | null) => {
    // With two-table caching, we don't need confirmation dialogs for style switching
    // The generation effect will automatically load cached generation if available
    setDesign((prev) => ({ ...prev, selectedStyle: style }));

    // Track style selection
    if (style) {
      trackEvent(AnalyticsEvents.STYLE_SELECTED, { style_id: style, tab: "design" });
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
          vibeTag,
          moodboardSlots: (() => {
            try {
              const raw = localStorage.getItem("moodboard-slot-selections");
              return raw ? JSON.parse(raw) : null;
            } catch { return null; }
          })(),
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
      captureError(err, { action: "shareSession", edgeFunction: "share-session" });
      toast.error(t(getErrorTranslationKey(err)));
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [design, generation.generatedImages, selectedTier, formData, userMoveInDate, completedTasks, layoutAuditResponses, layoutAuditVariables]);


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
    moodboardFilled,
    uploadedImage,
    generatedImage,
    authLoading,
    setActiveTab,
    setActiveMode,
    setSelectedTier,
    setUserMoveInDate: setUserMoveInDateWithTracking,
    toggleTask,
    setLayoutAuditResponse,
    setLayoutAuditAdults,
    setLayoutAuditChildren,
    setLayoutAuditWorkFromHome,
    handleImageUpload,
    clearUploadedImage,
    handleSelectCategory,
    handleSelectMaterial,
    setActivePalette,
    handleSelectStyle,
    handleFreestyleChange,
    handleGenerate,
    generateClayRender,
    handleStartFresh,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    confirmImageUpload,
    cancelImageUpload,
    handleSaveImage,
    setFormData,
    materialOverrides,
    setMaterialOverrides,
    excludedSlots,
    setExcludedSlots,
    vibeTag,
    vibeChosen,
    setVibeTag,
    clearVibeTag,
    skipVibePicker,
    resetVibeChoice,
    selectCollection,
    shareSession,
    isSharing,
    isSharedSession,
    sharedMoodboardSlots,
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
