import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { DesignSelection, GenerationState, UploadType } from "@/types/design-state";
import { initialGenerationState } from "@/types/design-state";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getStyleById } from "@/data/styles";
import { getArchitectureById } from "@/data/architectures";
import { getAtmosphereById } from "@/data/atmospheres";
import { buildDetailedMaterialPromptWithOverrides, loadMaterialImagesWithOverrides } from "@/lib/palette-utils";
import { supabase } from "@/integrations/supabase/client";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import { compressImage, resizeBlobToBase64 } from "@/lib/image-utils";
import { captureError } from "@/lib/sentry";
import { getErrorTranslationKey } from "@/lib/error-messages";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

export interface UseGenerationStateParams {
  design: DesignSelection;
  setDesign: React.Dispatch<React.SetStateAction<DesignSelection>>;
  materialOverrides: Record<string, string>;
  excludedSlots: Set<string>;
  isSharedSession: boolean;
  initialGeneratedImages?: Record<string, string | null>;
}

export function useGenerationState({
  design,
  setDesign,
  materialOverrides,
  excludedSlots,
  isSharedSession,
  initialGeneratedImages,
}: UseGenerationStateParams) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [generation, setGeneration] = useState<GenerationState>(() => {
    if (initialGeneratedImages) {
      return { ...initialGenerationState, generatedImages: initialGeneratedImages };
    }
    return initialGenerationState;
  });

  const pendingUploadTypeRef = useRef<UploadType>("photo");

  // Load uploaded images from user_uploads table
  useEffect(() => {
    if (!user || isSharedSession) return;

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
          const uploadTypes: Record<string, string> = {};
          data.forEach(upload => {
            const { data: urlData } = supabase.storage
              .from('user-images')
              .getPublicUrl(upload.image_path);
            uploaded[upload.room_category] = urlData.publicUrl;
            uploadTypes[upload.room_category] = upload.upload_type || 'photo';
          });
          setDesign(prev => ({
            ...prev,
            uploadedImages: { ...prev.uploadedImages, ...uploaded },
            uploadTypes: { ...prev.uploadTypes, ...uploadTypes },
          }));
        }
      } catch (err) {
        console.error('Error loading uploads:', err);
      }
    };

    loadUploads();
  }, [user, isSharedSession, setDesign]);

  // Load generated image for current room+style+palette from user_generations table
  useEffect(() => {
    if (!user || isSharedSession) return;

    const room = design.selectedCategory || "Kitchen";
    const style = design.selectedStyle;
    const material = design.freestyleDescription?.trim() ? "freestyle" : design.selectedMaterial;

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
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
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
  }, [user, isSharedSession, design.selectedCategory, design.selectedStyle, design.selectedMaterial, design.freestyleDescription]);

  // Save/download generated image - mobile compatible
  const handleSaveImage = useCallback(async () => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const currentGeneratedImage = generation.generatedImages[currentRoom];
    if (!currentGeneratedImage) return;

    const filename = `${design.selectedCategory}-${design.selectedStyle || 'custom'}-visualization.png`;

    try {
      const response = await fetch(currentGeneratedImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        window.open(blobUrl, '_blank');
        toast.info("Long-press the image to save it to your device", { position: "top-center" });
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image saved!", { position: "top-center" });
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Failed to save image:", error);
      window.open(currentGeneratedImage, '_blank');
      toast.info("Image opened in new tab - save from there", { position: "top-center" });
    }
  }, [generation.generatedImages, design.selectedCategory, design.selectedStyle]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File, uploadType: UploadType = "photo") => {
    if (!user) {
      toast.error("Authentication required");
      return;
    }

    const currentRoom = design.selectedCategory || "Kitchen";
    const hasGeneratedImage = generation.generatedImages[currentRoom];

    if (hasGeneratedImage) {
      pendingUploadTypeRef.current = uploadType;
      setGeneration((prev) => ({
        ...prev,
        pendingImageUpload: file,
        showUploadDialog: true,
      }));
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('user_uploads')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', currentRoom)
        .single();

      const compressed = await compressImage(file, 1024);
      const path = `${user.id}/uploads/${currentRoom}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(path, compressed, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      if (existing?.image_path) {
        await supabase.storage.from('user-images').remove([existing.image_path]);
      }

      const { data: urlData } = supabase.storage.from('user-images').getPublicUrl(path);

      await supabase
        .from('user_uploads')
        .upsert({
          user_id: user.id,
          room_category: currentRoom,
          image_path: path,
          upload_type: uploadType,
        }, { onConflict: 'user_id,room_category' });

      setDesign(prev => ({
        ...prev,
        uploadedImages: { ...prev.uploadedImages, [currentRoom]: urlData.publicUrl },
        uploadTypes: { ...prev.uploadTypes, [currentRoom]: uploadType },
      }));

      trackEvent(AnalyticsEvents.IMAGE_UPLOADED, { room_type: currentRoom, upload_type: uploadType, tab: "design" });
    } catch (err) {
      console.error('Image upload failed:', err);
      captureError(err, { action: "handleImageUpload" });
      toast.error(t(getErrorTranslationKey(err)));
    }
  }, [user, design.selectedCategory, generation.generatedImages, setDesign, t]);

  // Clear uploaded image for current room
  const clearUploadedImage = useCallback(async () => {
    const currentRoom = design.selectedCategory || "Kitchen";

    setDesign(prev => ({
      ...prev,
      uploadedImages: { ...prev.uploadedImages, [currentRoom]: null },
    }));
    setGeneration(prev => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
    }));

    if (user) {
      try {
        const { data: upload } = await supabase
          .from('user_uploads')
          .select('image_path')
          .eq('user_id', user.id)
          .eq('room_category', currentRoom)
          .single();

        if (upload?.image_path) {
          await supabase.storage.from('user-images').remove([upload.image_path]);
        }

        await supabase
          .from('user_uploads')
          .delete()
          .eq('user_id', user.id)
          .eq('room_category', currentRoom);

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
      } catch (err) {
        console.error('Failed to clear images from database:', err);
        captureError(err, { action: "clearUploadedImage" });
      }
    }
  }, [design.selectedCategory, user, setDesign]);

  // Store generated image to Supabase
  const storeGeneratedImage = useCallback(async (
    generatedImageData: string,
    room: string,
    style: string,
    material: string,
    startTime: number,
  ): Promise<boolean> => {
    const { data: existing } = await supabase
      .from('user_generations')
      .select('image_path')
      .eq('user_id', user!.id)
      .eq('room_category', room)
      .eq('selected_style', style)
      .eq('selected_material', material)
      .single();

    let generatedBlob: Blob;
    if (generatedImageData.startsWith('data:')) {
      const base64Response = await fetch(generatedImageData);
      generatedBlob = await base64Response.blob();
    } else {
      const urlResponse = await fetch(generatedImageData);
      generatedBlob = await urlResponse.blob();
    }

    const genPath = `${user!.id}/generated/${room}_${style}_${material}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('user-images')
      .upload(genPath, generatedBlob, { contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('Failed to upload generated image:', uploadError);
      setGeneration(prev => ({
        ...prev,
        generatedImages: { ...prev.generatedImages, [room]: generatedImageData },
        isGenerating: false,
      }));
      toast.success(t("toast.visualizationGenerated"), { position: "top-center" });
      trackEvent(AnalyticsEvents.VISUALIZATION_COMPLETED, {
        room, style, duration_ms: Date.now() - startTime, tab: "design",
      });
      return true;
    }

    if (existing?.image_path) {
      await supabase.storage.from('user-images').remove([existing.image_path]);
    }

    const { data: urlData } = supabase.storage.from('user-images').getPublicUrl(genPath);

    await supabase
      .from('user_generations')
      .upsert({
        user_id: user!.id,
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
    trackEvent(AnalyticsEvents.VISUALIZATION_COMPLETED, {
      room, style, duration_ms: Date.now() - startTime, tab: "design",
    });
    return true;
  }, [user, t]);

  // Generate interior render
  const generateInteriorRender = useCallback(async (): Promise<boolean> => {
    const uploadedImage = design.uploadedImages[design.selectedCategory || "Kitchen"] || null;
    if (!uploadedImage || !design.selectedCategory || !user) return false;

    const room = design.selectedCategory;
    const style = design.selectedStyle;
    const material = design.freestyleDescription?.trim() ? "freestyle" : design.selectedMaterial;

    if (!style) { toast.error("Please select a style"); return false; }
    if (!material) { toast.error("Please select a palette or enter a freestyle description"); return false; }

    const startTime = Date.now();

    try {
      const collection = design.selectedMaterial ? collectionsV2.find((c) => c.id === design.selectedMaterial) ?? null : null;

      const imageResponse = await fetch(uploadedImage);
      const imageBlob = await imageResponse.blob();
      const imageBase64 = await resizeBlobToBase64(imageBlob, 512);

      const uploadType = design.uploadTypes[room] || "photo";
      const isGeminiPath = (
        (uploadType === "photo" && !!collection && !design.freestyleDescription?.trim()) ||
        ((uploadType === "floorplan" || uploadType === "sketch") && !!collection)
      );
      const geminiModel = uploadType === "photo"
        ? API_CONFIG.imageGeneration.modelAccurate
        : API_CONFIG.imageGeneration.modelCreative;

      console.log("[generate] routing:", { uploadType, isGeminiPath, geminiModel, hasCollection: !!collection, hasFreestyle: !!design.freestyleDescription?.trim() });

      let generatedImageData: string;

      if (isGeminiPath) {
        const materialImagesWithMeta = await loadMaterialImagesWithOverrides(design.selectedMaterial!, design.selectedCategory, materialOverrides, excludedSlots);

        const styleData = design.selectedStyle ? getStyleById(design.selectedStyle) : null;
        const atmosphere = styleData?.config.atmosphere ? getAtmosphereById(styleData.config.atmosphere) : null;
        const atmospherePrompt = atmosphere?.promptSnippet ?? null;
        const architecture = styleData?.config.architecture ? getArchitectureById(styleData.config.architecture) : null;
        const architecturePrompt = architecture?.promptSnippet ?? null;

        {
          const rc = design.selectedCategory.replace(/([A-Z])/g, " $1").toLowerCase().trim();
          const matInstr = materialImagesWithMeta
            .map((m, i) => `- Image ${i + 2}: Use as ${m.purpose}.`)
            .join("\n");
          const atmosphereSection = atmospherePrompt ? "":"";//`\nDecor: ${atmospherePrompt}\n` : "";
          const architectureSection = architecturePrompt ? `\nInterior base style: ${architecturePrompt}\n` : "";
          let p: string;
          if (uploadType === "floorplan") {
            p = `Image 1 is a 2D floor plan of a ${rc}. Images 2..${materialImagesWithMeta.length + 1} are texture/material samples.\n\nCreate a photorealistic 3D interior visualization of this space based on the floor plan layout.\n\nApply the following materials and finishes to the appropriate surfaces:\n${matInstr}\n\n${architectureSection}${atmosphereSection}\nProduce a realistic interior render with accurate floorplan, materials, and professional photography quality. Do not add clutter.`;
          } else if (uploadType === "sketch") {
            p = `Image 1 is a rough sketch or concept drawing of a ${rc}. Images 2..${materialImagesWithMeta.length + 1} are texture/material samples.\n\nCreate a photorealistic interior visualization based on this sketch.\n\nApply the following materials and finishes:\n${matInstr}\n\n${architectureSection}${atmosphereSection}\nProduce a realistic interior render with natural lighting and professional photography quality.`;
          } else {
            p = `Image 1 is a photo of a ${rc}. Images 2..${materialImagesWithMeta.length + 1} are texture/material samples.\n\nPRESERVE the exact room layout, architecture, furniture placement, and camera angle from Image 1. Do NOT rearrange, add, or remove any furniture or architectural elements.\n\nONLY replace surface materials and finishes using the provided texture samples:\n${matInstr}\n\n\nCreate a photorealistic result with natural lighting. The room must look identical in layout — only the materials and surface finishes should change.`;
          }
          console.log(`[AI Prompt] generate-material-edit (${uploadType}) → model: ${geminiModel}\n` + p);
        }

        console.log("[generate] Calling generate-material-edit with model:", geminiModel, "uploadType:", uploadType);
        const { data, error } = await supabase.functions.invoke("generate-material-edit", {
          body: {
            imageBase64,
            materialImages: materialImagesWithMeta,
            roomCategory: design.selectedCategory,
            palettePromptSnippet: collection!.promptBase,
            atmospherePrompt,
            architecturePrompt,
            quality: API_CONFIG.imageGeneration.quality,
            model: geminiModel,
            uploadType,
          },
        });
        const errorBody = error ? await (error as any).context?.json?.().catch(() => null) : null;
        console.log("[generate] generate-material-edit response:", { error: error?.message, errorBody, hasImage: !!data?.generatedImage, dataKeys: data ? Object.keys(data) : null });

        if (error) throw new Error(errorBody?.error || error.message || "Failed to generate material edit");
        generatedImageData = data?.generatedImage;
        if (!generatedImageData) throw new Error("No image returned from material edit service");
      } else {
        const styleData = design.selectedStyle ? getStyleById(design.selectedStyle) : null;
        const architecture = styleData?.config.architecture ? getArchitectureById(styleData.config.architecture) : null;
        const atmosphere = styleData?.config.atmosphere ? getAtmosphereById(styleData.config.atmosphere) : null;

        let materialPrompt = "";
        if (collection) {
          materialPrompt = buildDetailedMaterialPromptWithOverrides(design.selectedMaterial!, design.selectedCategory, materialOverrides, collection.promptBase, excludedSlots);
        }

        const stylePrompt = [architecture?.promptSnippet, atmosphere?.promptSnippet].filter(Boolean).join(" ") || null;

        {
          const rc = design.selectedCategory ? `a ${design.selectedCategory.replace(/([A-Z])/g, " $1").toLowerCase().trim()}` : "an interior space";
          const fd = design.freestyleDescription.trim() || null;
          let p = `Make visualisation of ${rc} with professional interior design. You must maintain the room's architecture and layout.`;
          if (fd) p += ` Use these materials and finishes: ${fd}.`;
          else if (materialPrompt) p += ` Apply this material palette and finishes: ${materialPrompt}.`;
          if (stylePrompt) p += ` Design style characteristics: ${stylePrompt}.`;
          else p += ` Style: modern contemporary interior, balanced proportions, quality materials, cohesive design.`;
          p += " Create a photorealistic interior render with natural lighting and professional photography quality.";
          console.log("[AI Prompt] generate-interior (creative) →\n" + p);
        }

        const { data, error } = await supabase.functions.invoke("generate-interior", {
          body: {
            imageBase64,
            roomCategory: design.selectedCategory,
            materialPrompt: materialPrompt || null,
            stylePrompt,
            freestyleDescription: design.freestyleDescription.trim() || null,
            quality: API_CONFIG.imageGeneration.quality,
            model: API_CONFIG.imageGeneration.modelCreative,
          },
        });

        if (error) throw new Error(error.message || "Failed to generate interior");
        generatedImageData = data?.generatedImage;
        if (!generatedImageData) throw new Error("No image returned from generation service");
      }

      return await storeGeneratedImage(generatedImageData, room, style, material, startTime);
    } catch (err: unknown) {
      captureError(err, {
        action: "generateInteriorRender",
        edgeFunction: "generate-interior",
        room,
        style,
        palette: material,
      });
      toast.error(t(getErrorTranslationKey(err)));
      setGeneration((prev) => ({ ...prev, isGenerating: false }));
      trackEvent(AnalyticsEvents.VISUALIZATION_FAILED, {
        error_type: err instanceof Error ? err.message : "unknown",
        tab: "design",
      });
      return false;
    }
  }, [design, user, storeGeneratedImage, materialOverrides, excludedSlots, t]);

  // Handle generate button click
  const handleGenerate = useCallback(async (): Promise<boolean> => {
    setGeneration((prev) => ({ ...prev, isProcessing: true, isGenerating: true }));
    trackEvent(AnalyticsEvents.VISUALIZATION_STARTED, {
      room: design.selectedCategory || "Kitchen",
      style: design.selectedStyle,
      palette: design.freestyleDescription?.trim() ? "freestyle" : design.selectedMaterial,
      tab: "design",
    });
    return generateInteriorRender();
  }, [generateInteriorRender, design.selectedCategory, design.selectedStyle, design.selectedMaterial, design.freestyleDescription]);

  // Dialog confirmation functions
  const confirmRoomSwitch = useCallback((saveFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const currentGeneratedImage = generation.generatedImages[currentRoom];

    if (saveFirst && currentGeneratedImage) handleSaveImage();

    setGeneration((prev) => ({ ...prev, pendingRoomSwitch: null, showRoomSwitchDialog: false }));
    setDesign((prev) => ({
      ...prev,
      selectedCategory: generation.pendingRoomSwitch,
      lastSelectedRoom: generation.pendingRoomSwitch,
    }));
  }, [generation.generatedImages, generation.pendingRoomSwitch, handleSaveImage, design.selectedCategory, setDesign]);

  const cancelRoomSwitch = useCallback(() => {
    setGeneration((prev) => ({ ...prev, pendingRoomSwitch: null, showRoomSwitchDialog: false }));
  }, []);

  const confirmStyleSwitch = useCallback((saveFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const currentGeneratedImage = generation.generatedImages[currentRoom];

    if (saveFirst && currentGeneratedImage) handleSaveImage();

    setGeneration((prev) => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
      pendingStyleSwitch: null,
      showStyleSwitchDialog: false,
    }));
    setDesign((prev) => ({ ...prev, selectedStyle: generation.pendingStyleSwitch }));
  }, [generation.generatedImages, generation.pendingStyleSwitch, handleSaveImage, design.selectedCategory, setDesign]);

  const cancelStyleSwitch = useCallback(() => {
    setGeneration((prev) => ({ ...prev, pendingStyleSwitch: null, showStyleSwitchDialog: false }));
  }, []);

  const confirmImageUpload = useCallback(async (clearFirst: boolean) => {
    const currentRoom = design.selectedCategory || "Kitchen";
    const file = generation.pendingImageUpload;
    if (!file || !user) return;

    setGeneration((prev) => ({
      ...prev,
      pendingImageUpload: null,
      showUploadDialog: false,
      generatedImages: clearFirst
        ? { ...prev.generatedImages, [currentRoom]: null }
        : prev.generatedImages,
    }));

    try {
      const { data: existing } = await supabase
        .from('user_uploads')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', currentRoom)
        .single();

      const compressed = await compressImage(file, 1024);
      const path = `${user.id}/uploads/${currentRoom}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(path, compressed, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      if (existing?.image_path) {
        await supabase.storage.from('user-images').remove([existing.image_path]);
      }

      const { data: urlData } = supabase.storage.from('user-images').getPublicUrl(path);

      await supabase
        .from('user_uploads')
        .upsert({
          user_id: user.id,
          room_category: currentRoom,
          image_path: path,
          upload_type: pendingUploadTypeRef.current,
        }, { onConflict: 'user_id,room_category' });

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

      setDesign(prev => ({
        ...prev,
        uploadedImages: { ...prev.uploadedImages, [currentRoom]: urlData.publicUrl },
        uploadTypes: { ...prev.uploadTypes, [currentRoom]: pendingUploadTypeRef.current },
      }));

      trackEvent(AnalyticsEvents.IMAGE_UPLOADED, { room_type: currentRoom, upload_type: pendingUploadTypeRef.current, tab: "design" });
    } catch (err) {
      console.error('Image upload failed:', err);
      captureError(err, { action: "confirmImageUpload" });
      toast.error(t(getErrorTranslationKey(err)));
    }
  }, [design.selectedCategory, generation.pendingImageUpload, user, setDesign, t]);

  const cancelImageUpload = useCallback(() => {
    setGeneration((prev) => ({ ...prev, pendingImageUpload: null, showUploadDialog: false }));
  }, []);

  return {
    generation,
    setGeneration,
    pendingUploadTypeRef,
    handleSaveImage,
    handleImageUpload,
    clearUploadedImage,
    storeGeneratedImage,
    handleGenerate,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    confirmImageUpload,
    cancelImageUpload,
  };
}
