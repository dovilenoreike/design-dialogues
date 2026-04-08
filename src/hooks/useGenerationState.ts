import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { DesignSelection, GenerationState, UploadType } from "@/types/design-state";
import { initialGenerationState } from "@/types/design-state";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { buildDetailedMaterialPromptWithOverrides, loadMaterialImagesWithOverrides, type MaterialImageWithMeta } from "@/lib/material-generation-utils";
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

  // Ref to access clayRenderImages inside callbacks without stale closure
  const clayRenderImagesRef = useRef<Record<string, string | null>>({});

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
          const uploadTypes: Record<string, UploadType> = {};
          const floorplanRooms: string[] = [];
          data.forEach(upload => {
            const { data: urlData } = supabase.storage
              .from('user-images')
              .getPublicUrl(upload.image_path);
            uploaded[upload.room_category] = urlData.publicUrl;
            const ut = (upload.upload_type as UploadType) || 'photo';
            uploadTypes[upload.room_category] = ut;
            if (ut === 'floorplan') floorplanRooms.push(upload.room_category);
          });
          setDesign(prev => ({
            ...prev,
            uploadedImages: { ...prev.uploadedImages, ...uploaded },
            uploadTypes: { ...prev.uploadTypes, ...uploadTypes },
          }));

          // Reload persisted clay renders for floorplan rooms
          if (floorplanRooms.length > 0) {
            const { data: clayFiles } = await supabase.storage
              .from('user-images')
              .list(user.id + '/clay');
            if (clayFiles) {
              const clayImages: Record<string, string> = {};
              for (const room of floorplanRooms) {
                if (clayFiles.some(f => f.name === room + '.jpg')) {
                  const { data: urlData } = supabase.storage
                    .from('user-images')
                    .getPublicUrl(user.id + '/clay/' + room + '.jpg');
                  const clayUrl = urlData.publicUrl + `?t=${Date.now()}`;
                  clayImages[room] = clayUrl;
                  clayRenderImagesRef.current[room] = clayUrl;
                }
              }
              if (Object.keys(clayImages).length > 0) {
                setGeneration(prev => ({
                  ...prev,
                  clayRenderImages: { ...prev.clayRenderImages, ...clayImages },
                }));
              }
            }
          }
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
    const hasClayRender = !!(clayRenderImagesRef.current[currentRoom]);

    if (hasGeneratedImage || hasClayRender) {
      pendingUploadTypeRef.current = uploadType;
      setGeneration((prev) => ({
        ...prev,
        pendingImageUpload: file,
        showUploadDialog: true,
      }));
      return;
    }

    // Clear any stale visualisation immediately so the UI shows the new upload once ready
    clayRenderImagesRef.current = { ...clayRenderImagesRef.current, [currentRoom]: null };
    setGeneration((prev) => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
      clayRenderImages: { ...prev.clayRenderImages, [currentRoom]: null },
    }));

    try {
      const { data: existing } = await supabase
        .from('user_uploads')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', currentRoom)
        .maybeSingle();

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
    clayRenderImagesRef.current = { ...clayRenderImagesRef.current, [currentRoom]: null };
    setGeneration(prev => ({
      ...prev,
      generatedImages: { ...prev.generatedImages, [currentRoom]: null },
      clayRenderImages: { ...prev.clayRenderImages, [currentRoom]: null },
    }));

    if (user) {
      try {
        const { data: upload } = await supabase
          .from('user_uploads')
          .select('image_path')
          .eq('user_id', user.id)
          .eq('room_category', currentRoom)
          .maybeSingle();

        if (upload?.image_path) {
          await supabase.storage.from('user-images').remove([upload.image_path]);
        }

        // Remove persisted clay render if it exists
        await supabase.storage.from('user-images').remove([`${user.id}/clay/${currentRoom}.jpg`]);

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
      .maybeSingle();

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
    const startTime = Date.now();

    try {
      const collection = design.selectedMaterial ? collectionsV2.find((c) => c.id === design.selectedMaterial) ?? null : null;

      const uploadType = design.uploadTypes[room] || "photo";

      const imageResponse = await fetch(uploadedImage);
      const imageBlob = await imageResponse.blob();
      const imageBase64 = await resizeBlobToBase64(imageBlob, 512);

      const hasOverrides = Object.keys(materialOverrides).length > 0;
      const isGeminiPath = (uploadType === "photo" || uploadType === "sketch") && (!!design.selectedMaterial || hasOverrides);
      const geminiModel = uploadType === "photo"
        ? API_CONFIG.imageGeneration.modelAccurate
        : API_CONFIG.imageGeneration.modelCreative;

      let generatedImageData: string;

      if (uploadType === "floorplan") {
        const fd = design.freestyleDescription?.trim() || null;

        // Load texture images — same dedup logic as sketch/photo path
        const materialImagesWithMeta = fd ? [] : await loadMaterialImagesWithOverrides(materialOverrides, excludedSlots);
        type FpDedupEntry = MaterialImageWithMeta & { surfaces: string[] };
        const fpDedupMap: Record<string, FpDedupEntry> = {};
        for (const m of materialImagesWithMeta) {
          if (fpDedupMap[m.matId]) { fpDedupMap[m.matId].surfaces.push(m.purpose); }
          else { fpDedupMap[m.matId] = { ...m, surfaces: [m.purpose] }; }
        }
        const dedupedMaterials = Object.values(fpDedupMap);

        let materialSection = "";
        if (fd) {
          materialSection = `\nApply these surface materials and finishes: ${fd}`;
        } else if (dedupedMaterials.length > 0) {
          const matInstr = dedupedMaterials
            .map((m, i) => {
              const texture = m.texturePrompt || m.description;
              return m.surfaces.length === 1
                ? `- Image ${i + 2} (${texture}): apply to ${m.surfaces[0]}.`
                : `- Image ${i + 2} (${texture}): apply this SAME texture to ALL of these surfaces: ${m.surfaces.join(", ")}.`;
            })
            .join("\n");
          materialSection = `\nImages 2..${dedupedMaterials.length + 1} are texture/material samples. Apply the following materials:\n${matInstr}`;
        }

        const designPrompt = `Image 1 is a 2D kitchen floor plan. Convert it into a single photorealistic perspective render as if standing in the kitchen looking toward the main wall (NOT A 3D MODEL render).

Preserve: the layout, number of windows, door positions.
Assume: standard 2.4m ceiling height, neutral white walls.
${materialSection}
Output a clean, minimalist, well-lit render suitable for interior material selection.`;

        const { data, error } = await supabase.functions.invoke("generate-material-edit", {
          body: {
            imageBase64,
            materialImages: dedupedMaterials,
            designPrompt,
            model: API_CONFIG.imageGeneration.modelCreative,
          },
        });
        const errorBody = error ? await (error as any).context?.json?.().catch(() => null) : null;
        if (error) throw new Error(errorBody?.error || error.message || "Failed to generate render");
        generatedImageData = data?.generatedImage;
        if (!generatedImageData) throw new Error("No image returned from render service");
      } else if (isGeminiPath) {
        const materialImagesWithMeta = await loadMaterialImagesWithOverrides(materialOverrides, excludedSlots);

        // Deduplicate by material ID, tracking all surfaces each material covers
        type DedupEntry = MaterialImageWithMeta & { surfaces: string[] };
        const dedupMap: Record<string, DedupEntry> = {};
        for (const m of materialImagesWithMeta) {
          if (dedupMap[m.matId]) {
            dedupMap[m.matId].surfaces.push(m.purpose);
          } else {
            dedupMap[m.matId] = { ...m, surfaces: [m.purpose] };
          }
        }
        const dedupedMaterials = Object.values(dedupMap);

        const matInstr = dedupedMaterials
          .map((m, i) => {
            const texture = m.texturePrompt || m.description;
            if (m.surfaces.length === 1) {
              return `- Image ${i + 2} (${texture}): apply to ${m.surfaces[0]}.`;
            }
            return `- Image ${i + 2} (${texture}): apply this SAME texture to ALL of these surfaces: ${m.surfaces.join(", ")}.`;
          })
          .join("\n");
        let designPrompt: string;
        if (uploadType === "sketch") {
          designPrompt = `Image 1 is a rough sketch or concept drawing of a room. Images 2..${dedupedMaterials.length + 1} are texture/material samples.\n\nCreate a photorealistic interior visualization based on this sketch.\n\nApply the following materials and finishes:\n${matInstr}\n\nApply the provided textures exactly accurate, without turning yellow, grey or changing the textures. Style the rest of item as a designer. Produce a realistic interior render with professional photography quality.`;
        } else {
          designPrompt = `Image 1 is a photo of a room. Images 2..${dedupedMaterials.length + 1} are texture/material samples.\n\nPRESERVE the exact room layout, architecture, furniture placement, and camera angle from Image 1. Do NOT rearrange, add, or remove any furniture or architectural elements.\n\nONLY replace surface materials and finishes using the exact provided texture samples:\n${matInstr}\n\nApply the provided textures exactly accurate, without turning yellow, grey or changing the textures. Style the rest of items as a designer. Create a photorealistic result with professional photography quality.`;
        }


        const { data, error } = await supabase.functions.invoke("generate-material-edit", {
          body: {
            imageBase64,
            materialImages: dedupedMaterials,
            designPrompt,
            quality: API_CONFIG.imageGeneration.quality,
            model: geminiModel,
          },
        });
        const errorBody = error ? await (error as any).context?.json?.().catch(() => null) : null;
        if (error) throw new Error(errorBody?.error || error.message || "Failed to generate material edit");
        generatedImageData = data?.generatedImage;
        if (!generatedImageData) throw new Error("No image returned from material edit service");
      } else {
        let materialPrompt = "";
        if (collection) {
          materialPrompt = buildDetailedMaterialPromptWithOverrides(materialOverrides, collection.promptBase, excludedSlots);
        }

        {
          const fd = design.freestyleDescription.trim() || null;
          let p = `Make a visualisation of a room with professional interior design. You must maintain the room's architecture and layout.`;
          if (fd) p += ` Use these materials and finishes: ${fd}.`;
          else if (materialPrompt) p += ` Apply this material palette and finishes: ${materialPrompt}.`;
          p += ` Style: modern contemporary interior, balanced proportions, quality materials, cohesive design.`;
          p += " Create a photorealistic interior render with natural lighting and professional photography quality.";
        }


        const { data, error } = await supabase.functions.invoke("generate-interior", {
          body: {
            imageBase64,
            roomCategory: design.selectedCategory,
            materialPrompt: materialPrompt || null,
            freestyleDescription: design.freestyleDescription.trim() || null,
            quality: API_CONFIG.imageGeneration.quality,
            model: API_CONFIG.imageGeneration.modelCreative,
          },
        });

        if (error) throw new Error(error.message || "Failed to generate interior");
        generatedImageData = data?.generatedImage;
        if (!generatedImageData) throw new Error("No image returned from generation service");
      }

      return await storeGeneratedImage(generatedImageData, room, null, null, startTime);
    } catch (err: unknown) {
      captureError(err, {
        action: "generateInteriorRender",
        edgeFunction: "generate-interior",
        room,
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

    if (clearFirst) {
      clayRenderImagesRef.current = { ...clayRenderImagesRef.current, [currentRoom]: null };
    }
    setGeneration((prev) => ({
      ...prev,
      pendingImageUpload: null,
      showUploadDialog: false,
      generatedImages: clearFirst
        ? { ...prev.generatedImages, [currentRoom]: null }
        : prev.generatedImages,
      clayRenderImages: clearFirst
        ? { ...prev.clayRenderImages, [currentRoom]: null }
        : prev.clayRenderImages,
    }));

    try {
      const { data: existing } = await supabase
        .from('user_uploads')
        .select('image_path')
        .eq('user_id', user.id)
        .eq('room_category', currentRoom)
        .maybeSingle();

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
        // Delete persisted clay render so stale result isn't reloaded next session
        await supabase.storage.from('user-images').remove([`${user.id}/clay/${currentRoom}.jpg`]);

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

  // Generate clay render (step 1 of floorplan two-step flow)
  const generateClayRender = useCallback(async (): Promise<void> => {
    const room = design.selectedCategory || "Kitchen";
    const uploadedImage = design.uploadedImages[room] || null;
    if (!uploadedImage || !user) return;

    setGeneration(prev => ({ ...prev, isGenerating: true, isProcessing: true }));

    try {
      const imageResponse = await fetch(uploadedImage);
      const imageBlob = await imageResponse.blob();
      const imageBase64 = await resizeBlobToBase64(imageBlob, 512);

      const fd = design.freestyleDescription?.trim() || null;

      // Load texture images — same dedup logic as sketch/photo path
      const clayMaterialsWithMeta = fd ? [] : await loadMaterialImagesWithOverrides(materialOverrides, excludedSlots);
      type ClayDedupEntry = MaterialImageWithMeta & { surfaces: string[] };
      const clayDedupMap: Record<string, ClayDedupEntry> = {};
      for (const m of clayMaterialsWithMeta) {
        if (clayDedupMap[m.matId]) { clayDedupMap[m.matId].surfaces.push(m.purpose); }
        else { clayDedupMap[m.matId] = { ...m, surfaces: [m.purpose] }; }
      }
      const clayDedupedMaterials = Object.values(clayDedupMap);

      let clayMaterialSection = "";
      if (fd) {
        clayMaterialSection = `\nApply these surface materials and finishes: ${fd}`;
      } else if (clayDedupedMaterials.length > 0) {
        const matInstr = clayDedupedMaterials
          .map((m, i) => {
            const texture = m.texturePrompt || m.description;
            return m.surfaces.length === 1
              ? `- Image ${i + 2} (${texture}): apply to ${m.surfaces[0]}.`
              : `- Image ${i + 2} (${texture}): apply this SAME texture to ALL of these surfaces: ${m.surfaces.join(", ")}.`;
          })
          .join("\n");
        clayMaterialSection = `\nImages 2..${clayDedupedMaterials.length + 1} are texture/material samples. Apply the following materials:\n${matInstr}`;
      }

      const designPrompt = `Image 1 is a 2D kitchen floor plan. Convert it into a single photorealistic perspective render as if standing in the kitchen looking toward the main wall (NOT A 3D MODEL render).

Preserve: the layout, number of windows, door positions.
Assume: standard 2.4m ceiling height, neutral white walls.
${clayMaterialSection}
Output a clean, minimalist, well-lit render suitable for interior material selection.`;

      const { data, error } = await supabase.functions.invoke("generate-material-edit", {
        body: {
          imageBase64,
          materialImages: clayDedupedMaterials,
          designPrompt,
          model: API_CONFIG.imageGeneration.modelCreative,
        },
      });

      const errorBody = error ? await (error as any).context?.json?.().catch(() => null) : null;
      if (error) throw new Error(errorBody?.error || error.message || "Failed to generate clay render");

      const clayBase64 = data?.generatedImage;
      if (!clayBase64) throw new Error("No image returned from clay render");

      // Persist clay render to storage so it survives page reload
      let clayValue = clayBase64;
      try {
        const clayBlobResponse = await fetch(clayBase64);
        const clayBlob = await clayBlobResponse.blob();
        const clayPath = `${user!.id}/clay/${room}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('user-images')
          .upload(clayPath, clayBlob, { contentType: 'image/jpeg', upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('user-images').getPublicUrl(clayPath);
          clayValue = urlData.publicUrl + `?t=${Date.now()}`;
        } else {
          captureError(new Error(uploadErr.message), { action: "generateClayRender:storageUpload", room });
          toast.warning("Render saved for this session only — reload to regenerate", { position: "top-center" });
        }
      } catch (storageErr) {
        captureError(storageErr, { action: "generateClayRender:storageUpload", room });
        toast.warning("Render saved for this session only — reload to regenerate", { position: "top-center" });
      }

      clayRenderImagesRef.current = { ...clayRenderImagesRef.current, [room]: clayValue };
      setGeneration(prev => ({
        ...prev,
        clayRenderImages: { ...prev.clayRenderImages, [room]: clayValue },
        isGenerating: false,
        isProcessing: false,
      }));
    } catch (err) {
      captureError(err, { action: "generateClayRender", room });
      toast.error(t(getErrorTranslationKey(err)));
      setGeneration(prev => ({ ...prev, isGenerating: false, isProcessing: false }));
    }
  }, [design, materialOverrides, excludedSlots, user, t]);

  return {
    generation,
    setGeneration,
    pendingUploadTypeRef,
    handleSaveImage,
    handleImageUpload,
    clearUploadedImage,
    storeGeneratedImage,
    handleGenerate,
    generateClayRender,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    confirmImageUpload,
    cancelImageUpload,
  };
}
