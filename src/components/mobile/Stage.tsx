import { useRef, useCallback, useMemo, useEffect } from "react";
import { Upload, Sparkles, Loader2, Camera, X, Download, LayoutGrid, Palette } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCredits } from "@/contexts/CreditsContext";
import { toast } from "sonner";
import { getVisualization } from "@/data/visualisations";
import { getPaletteById, palettes } from "@/data/palettes";
import { getStyleById, styles } from "@/data/styles";
import { rooms } from "@/data/rooms";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

// Map room name to translation key (nominative)
const roomTranslationKey: Record<string, string> = {
  "Kitchen": "space.kitchen",
  "Living Room": "space.livingRoom",
  "Bedroom": "space.bedroom",
  "Bathroom": "space.bathroom",
};

// Map room name to accusative translation key (for "Kuriame {room}")
const roomTranslationKeyAcc: Record<string, string> = {
  "Kitchen": "space.kitchenAcc",
  "Living Room": "space.livingRoomAcc",
  "Bedroom": "space.bedroomAcc",
  "Bathroom": "space.bathroomAcc",
};

export default function Stage() {
  const { t } = useLanguage();
  const {
    design,
    generation,
    canGenerate,
    handleImageUpload,
    clearUploadedImage,
    handleGenerate,
    handleSaveImage,
    setActiveMode,
    activeMode,
    handleSelectCategory,
    handleSelectStyle,
    handleSelectMaterial,
  } = useDesign();
  const { credits, useCredit, refetchCredits } = useCredits();

  const { uploadedImages, selectedCategory, selectedMaterial, selectedStyle } = design;
  const { generatedImages, isGenerating, showRoomSwitchDialog, showStyleSwitchDialog } = generation;

  // Create object URLs for File objects (uploaded images)
  // Store URLs in a ref to track them for cleanup
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  // Create object URL for a File, reusing existing URL if possible
  const getObjectUrl = useCallback((file: File | null, key: string): string | null => {
    if (!file) {
      // Clean up existing URL if file is removed
      const existingUrl = objectUrlsRef.current.get(key);
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl);
        objectUrlsRef.current.delete(key);
      }
      return null;
    }

    // Check if we already have a URL for this file
    const existingUrl = objectUrlsRef.current.get(key);
    if (existingUrl) {
      return existingUrl;
    }

    // Create new URL
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.set(key, url);
    return url;
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  // Helper: Get next/prev item with wrapping
  const getNextItem = useCallback(<T,>(
    current: string | null,
    items: T[],
    direction: 'left' | 'right',
    getKey: (item: T) => string
  ): T => {
    const currentIndex = items.findIndex((item) => getKey(item) === current);
    const validIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = direction === 'left'
      ? (validIndex + 1) % items.length
      : (validIndex - 1 + items.length) % items.length;
    return items[nextIndex];
  }, []);

  // Get previous item (wraps to end)
  const getPrevItem = useCallback(<T,>(
    current: string | null,
    items: T[],
    getKey: (item: T) => string
  ): T => {
    return getNextItem(current, items, 'right', getKey);
  }, [getNextItem]);

  // Calculate image URL for any room/style/palette combo
  const getImageForState = useCallback((
    category: string | null,
    material: string | null,
    style: string | null
  ): string => {
    const roomName = category || "Kitchen";
    const uploadedFile = uploadedImages[roomName];
    const generatedImage = generatedImages[roomName];
    const visualizationImage = getVisualization(material, category, style);
    // Convert File to object URL if needed
    const uploadedImageUrl = uploadedFile ? getObjectUrl(uploadedFile, roomName) : null;
    return generatedImage || uploadedImageUrl || visualizationImage;
  }, [uploadedImages, generatedImages, getObjectUrl]);

  // Swipe handlers
  const handleSwipeLeft = useCallback(() => {
    if (isGenerating || showRoomSwitchDialog || showStyleSwitchDialog) return;

    switch (activeMode) {
      case 'rooms':
        const nextRoom = getNextItem(selectedCategory, rooms, 'left', r => r.name);
        handleSelectCategory(nextRoom.name);
        break;
      case 'styles':
        const nextStyle = getNextItem(selectedStyle, styles, 'left', s => s.id);
        handleSelectStyle(nextStyle.id);
        break;
      case 'palettes':
        const nextPalette = getNextItem(selectedMaterial, palettes, 'left', p => p.id);
        handleSelectMaterial(nextPalette.id);
        break;
    }
  }, [isGenerating, showRoomSwitchDialog, showStyleSwitchDialog, activeMode, selectedCategory, selectedStyle, selectedMaterial, getNextItem, handleSelectCategory, handleSelectStyle, handleSelectMaterial]);

  const handleSwipeRight = useCallback(() => {
    if (isGenerating || showRoomSwitchDialog || showStyleSwitchDialog) return;

    switch (activeMode) {
      case 'rooms':
        const nextRoom = getNextItem(selectedCategory, rooms, 'right', r => r.name);
        handleSelectCategory(nextRoom.name);
        break;
      case 'styles':
        const nextStyle = getNextItem(selectedStyle, styles, 'right', s => s.id);
        handleSelectStyle(nextStyle.id);
        break;
      case 'palettes':
        const nextPalette = getNextItem(selectedMaterial, palettes, 'right', p => p.id);
        handleSelectMaterial(nextPalette.id);
        break;
    }
  }, [isGenerating, showRoomSwitchDialog, showStyleSwitchDialog, activeMode, selectedCategory, selectedStyle, selectedMaterial, getNextItem, handleSelectCategory, handleSelectStyle, handleSelectMaterial]);

  // Apply swipe gesture
  const { isDragging, dragOffset, ref } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    disabled: isGenerating || showRoomSwitchDialog || showStyleSwitchDialog,
  });

  // Wrapper that generates first, then deducts credit only on success
  const handleGenerateWithCredits = useCallback(async () => {
    // Check if user has credits before attempting generation
    if (credits !== null && credits <= 0) {
      toast.error(t("credits.noCredits") || "No credits remaining. Please purchase more credits.");
      return;
    }

    try {
      // Generate the image first
      const success = await handleGenerate();

      // Only deduct credit if generation was successful
      if (success) {
        try {
          await useCredit();
        } catch (creditErr) {
          console.error("Failed to deduct credit after successful generation:", creditErr);
          // Don't show error to user - image was generated successfully
          // Just refetch to sync credit state
          refetchCredits();
        }
      }
    } catch (err) {
      console.error("Generation failed:", err);
      // No credit deducted since generation failed
    }
  }, [credits, handleGenerate, useCredit, refetchCredits, t]);

  // Get current room's uploaded file and generated image
  const uploadedFile = uploadedImages[selectedCategory || "Kitchen"] || null;
  const generatedImage = generatedImages[selectedCategory || "Kitchen"] || null;
  // Convert File to object URL for display
  const uploadedImageUrl = uploadedFile ? getObjectUrl(uploadedFile, selectedCategory || "Kitchen") : null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleImageUpload]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Get palette and style info for glass pills
  const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;
  const style = design.selectedStyle ? getStyleById(design.selectedStyle) : null;

  // Get the appropriate image to display (palette × room × style)
  const styleId = design.selectedStyle || null;
  const visualizationImage = getVisualization(selectedMaterial, selectedCategory, styleId);
  const displayImage = generatedImage || uploadedImageUrl || visualizationImage;
  const roomNameRaw = selectedCategory || "Kitchen";
  const roomName = t(roomTranslationKey[roomNameRaw] || roomNameRaw);
  const roomNameAcc = t(roomTranslationKeyAcc[roomNameRaw] || roomTranslationKey[roomNameRaw] || roomNameRaw);
  const hasUserImage = !!uploadedFile || !!generatedImage;

  // Calculate prev/current/next based on activeMode
  const prevImage = useMemo(() => {
    switch (activeMode) {
      case 'rooms': {
        const prevRoom = getPrevItem(selectedCategory, rooms, r => r.name);
        return getImageForState(prevRoom.name, selectedMaterial, selectedStyle);
      }
      case 'styles': {
        const prevStyle = getPrevItem(selectedStyle, styles, s => s.id);
        return getImageForState(selectedCategory, selectedMaterial, prevStyle.id);
      }
      case 'palettes': {
        const prevPalette = getPrevItem(selectedMaterial, palettes, p => p.id);
        return getImageForState(selectedCategory, prevPalette.id, selectedStyle);
      }
    }
  }, [activeMode, selectedCategory, selectedMaterial, selectedStyle, getPrevItem, getImageForState]);

  const currentImage = displayImage; // Already calculated

  const nextImage = useMemo(() => {
    switch (activeMode) {
      case 'rooms': {
        const nextRoom = getNextItem(selectedCategory, rooms, 'left', r => r.name);
        return getImageForState(nextRoom.name, selectedMaterial, selectedStyle);
      }
      case 'styles': {
        const nextStyle = getNextItem(selectedStyle, styles, 'left', s => s.id);
        return getImageForState(selectedCategory, selectedMaterial, nextStyle.id);
      }
      case 'palettes': {
        const nextPalette = getNextItem(selectedMaterial, palettes, 'left', p => p.id);
        return getImageForState(selectedCategory, nextPalette.id, selectedStyle);
      }
    }
  }, [activeMode, selectedCategory, selectedMaterial, selectedStyle, getNextItem, getImageForState]);

  // Preload adjacent images
  useEffect(() => {
    [prevImage, nextImage].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [prevImage, nextImage]);

  return (
    <div className="relative w-full h-full bg-surface-muted">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Carousel container */}
      <div
        ref={ref}
        className="absolute inset-0 overflow-hidden"
      >
        {/* Inner track that slides */}
        <div
          className="absolute inset-0 flex"
          style={{
            width: '300%',
            transform: `translateX(calc(${-100 / 3}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 300ms ease-out',
          }}
        >
          {/* Previous Image */}
          <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
            <img
              src={prevImage}
              alt="Previous"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Current Image */}
          <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
            <img
              src={currentImage}
              alt={`${roomName} visualization`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Next Image */}
          <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
            <img
              src={nextImage}
              alt="Next"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Disclaimer - always visible at bottom right */}
      <div className="absolute right-3 bottom-3 z-10">
        <p className="text-[10px] text-white/50 tracking-wider uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
          {t("result.visualizationDisclaimer")}
        </p>
      </div>

      {/* Upload overlay - show when no user image */}
      {!hasUserImage && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-colors pointer-events-none"
        >
          <button
            onClick={handleUploadClick}
            className="pointer-events-auto flex flex-col items-center active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Upload className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <h2
              key={roomName}
              className="text-2xl font-serif text-white/80 mb-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.3)] animate-fade-in-up"
            >
              {t("mobile.stage.designingThe").replace("{room}", roomNameAcc)}
            </h2>
            <p className="text-sm text-white/80">
              {t("mobile.stage.uploadPrompt")}
            </p>
          </button>
        </div>
      )}

      {/* Status badge and action buttons - show when user has uploaded/generated */}
      {hasUserImage && (
        <div className="absolute inset-x-0 top-4 flex flex-col items-center px-4">
          <p className="inline-block px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white/90">
            {generatedImage
              ? t("mobile.stage.visualized").replace("{room}", roomName)
              : t("mobile.stage.yourRoom").replace("{room}", roomName)}
          </p>
                    {/* Save button - visible when generated image exists */}
          {generatedImage && !isGenerating && (
            <button
              onClick={handleSaveImage}
              className="absolute top-0 right-14 w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white/90 active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {/* Clear button - top right */}
          {!isGenerating && (
            <button
              onClick={clearUploadedImage}
              className="absolute top-0 right-4 w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white/90 active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Floating action button - only show after user has uploaded */}
      {hasUserImage && (
        <div className="absolute bottom-4 right-4">
          {isGenerating ? (
            <button
              disabled
              className="flex items-center gap-2 px-5 py-3 bg-foreground/70 text-background rounded-full font-medium text-sm shadow-lg min-h-[44px]"
            >
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              {t("mobile.stage.generating")}
            </button>
          ) : (
            <button
              onClick={handleGenerateWithCredits}
              disabled={!canGenerate}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm shadow-lg min-h-[44px] transition-all ${
                canGenerate
                  ? "bg-foreground text-background active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              {canGenerate
                ? (generatedImage ? t("mobile.stage.revisualize") : t("mobile.stage.visualize"))
                : (!selectedStyle
                    ? t("mobile.stage.selectStyle")
                    : t("mobile.stage.selectPalette"))}
            </button>
          )}
        </div>
      )}

      {/* Bottom left action buttons - show when user has uploaded */}
      {hasUserImage && !isGenerating && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-foreground rounded-full text-sm font-medium shadow-lg active:scale-[0.98] transition-transform min-h-[44px]"
          >
            <Camera className="w-4 h-4" strokeWidth={1.5} />
            {t("mobile.stage.replace")}
          </button>
        </div>
      )}

      {/* Glass Pills - bottom when browsing */}
      {!hasUserImage && (style || palette) && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
          {style && (
            <button
              onClick={() => setActiveMode("styles")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-full text-xs text-white font-medium active:scale-95 transition-transform"
            >
              <LayoutGrid className="w-3 h-3" strokeWidth={2} />
              {t(`style.${style.id}`) || style.name}
            </button>
          )}
          {palette && (
            <button
              onClick={() => setActiveMode("palettes")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/10 active:scale-95 transition-transform"
            >
              <Palette className="w-3 h-3" strokeWidth={2} />
              {t(`palette.${palette.id}`) || palette.name}
            </button>
          )}
        </div>
      )}

      {/* Glass Pills - centered below status badge after upload/generation */}
      {hasUserImage && (style || palette) && (
        <div className="absolute top-14 inset-x-0 flex justify-center items-center gap-2">
          {style && (
            <button
              onClick={() => setActiveMode("styles")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-full text-xs text-white font-medium active:scale-95 transition-transform"
            >
              <LayoutGrid className="w-3 h-3" strokeWidth={2} />
              {t(`style.${style.id}`) || style.name}
            </button>
          )}
          {palette && (
            <button
              onClick={() => setActiveMode("palettes")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/10 active:scale-95 transition-transform"
            >
              <Palette className="w-3 h-3" strokeWidth={2} />
              {t(`palette.${palette.id}`) || palette.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
