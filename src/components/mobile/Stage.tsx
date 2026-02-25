import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { Upload, Sparkles, Loader2, Camera, X, Download, ChevronDown } from "lucide-react";
import UploadMenuSheet from "./UploadMenuSheet";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCredits } from "@/contexts/CreditsContext";
import { toast } from "sonner";
import { getVisualization } from "@/data/visualisations";
import { getPaletteById, palettes } from "@/data/palettes";
import { getPaletteMaterialImages } from "@/data/palettes/material-images";
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

interface StageProps {
  onOpenSelector?: (mode: ControlMode) => void;
}

export default function Stage({ onOpenSelector }: StageProps = {}) {
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
    const uploadedImage = uploadedImages[roomName];
    const generatedImage = generatedImages[roomName];
    const visualizationImage = getVisualization(material, category, style);
    return generatedImage || uploadedImage || visualizationImage;
  }, [uploadedImages, generatedImages]);

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

  // Get current room's uploaded image and generated image
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;
  const generatedImage = generatedImages[selectedCategory || "Kitchen"] || null;

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

  const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;
  const style = design.selectedStyle ? getStyleById(design.selectedStyle) : null;

  // Get the appropriate image to display (palette × room × style)
  const styleId = design.selectedStyle || null;
  const visualizationImage = getVisualization(selectedMaterial, selectedCategory, styleId);
  const displayImage = generatedImage || uploadedImage || visualizationImage;
  const roomNameRaw = selectedCategory || "Kitchen";
  const roomName = t(roomTranslationKey[roomNameRaw] || roomNameRaw);
  const hasUserImage = !!uploadedImage || !!generatedImage;
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);

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

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

      {/* Room technical label - top-left */}
      {!hasUserImage && (
        <div className="absolute top-4 left-3 z-10">
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/60 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] select-none">
            {String(rooms.findIndex(r => r.name === roomNameRaw) + 1).padStart(2, '0')} &bull; {roomName}
          </span>
        </div>
      )}

      {/* Upload button - centered, clean */}
      {!hasUserImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={() => setUploadMenuOpen(true)}
            className="pointer-events-auto flex flex-col items-center active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-xl flex items-center justify-center shadow-lg"
              style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
            >
              <Upload className="w-6 h-6 text-white/80" strokeWidth={1.5} />
            </div>
          </button>
        </div>
      )}

      {/* Room label + action buttons - show when user has uploaded/generated */}
      {hasUserImage && (
        <div className="absolute inset-x-0 top-4 px-3">
          {/* Room technical label - top-left */}
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-neutral-500 [text-shadow:0_0_4px_rgba(255,255,255,0.8)] select-none">
            {String(rooms.findIndex(r => r.name === roomNameRaw) + 1).padStart(2, '0')} &bull; {roomName}
          </span>
          {/* Save button - visible when generated image exists */}
          {generatedImage && !isGenerating && (
            <button
              onClick={handleSaveImage}
              className="absolute top-0 right-12 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-transform"
              style={{ border: '0.5px solid rgba(255,255,255,0.15)' }}
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
          {/* Clear button - top right */}
          {!isGenerating && (
            <button
              onClick={clearUploadedImage}
              className="absolute top-0 right-3 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-transform"
              style={{ border: '0.5px solid rgba(255,255,255,0.15)' }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
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
        <div className="absolute bottom-4 left-3 flex items-center gap-1.5">
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/20 backdrop-blur-xl text-white/80 rounded-full text-[10px] tracking-wide uppercase font-medium shadow-lg active:scale-[0.98] transition-transform min-h-[44px]"
            style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
          >
            <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("mobile.stage.replace")}
          </button>
        </div>
      )}

      {/* Technical tags - bottom-left when browsing */}
      {!hasUserImage && (
        <div className="absolute bottom-8 left-3 flex items-center gap-1.5">
          <button
            onClick={() => { onOpenSelector ? onOpenSelector("rooms") : setActiveMode("rooms"); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] tracking-wide uppercase font-medium active:scale-95 transition-all ${
              activeMode === "rooms"
                ? "bg-white/20 backdrop-blur-xl text-white/80"
                : "text-white/60"
            }`}
            style={activeMode === "rooms" ? { border: '0.5px solid rgba(255,255,255,0.3)' } : undefined}
          >
            {roomName}
            <ChevronDown className="w-2.5 h-2.5 text-white/50" strokeWidth={2} />
          </button>
          {style && (
            <button
              onClick={() => { onOpenSelector ? onOpenSelector("styles") : setActiveMode("styles"); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] tracking-wide uppercase font-medium active:scale-95 transition-all ${
                activeMode === "styles"
                  ? "bg-white/20 backdrop-blur-xl text-white/80"
                  : "text-white/60"
              }`}
              style={activeMode === "styles" ? { border: '0.5px solid rgba(255,255,255,0.3)' } : undefined}
            >
              {t(`style.${style.id}`) || style.name}
              <ChevronDown className="w-2.5 h-2.5 text-white/50" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Palette specimen strip - bottom-right when browsing */}
      {!hasUserImage && palette && (() => {
        const swatchImages = getPaletteMaterialImages(palette.id).slice(0, 4);
        const paletteName = t(`palette.${palette.id}`) || palette.name;
        return swatchImages.length > 0 ? (
          <button
            onClick={() => { onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes"); }}
            className="absolute bottom-12 right-1.5 flex flex-col items-center active:scale-[0.97] transition-transform max-w-[44px]"
          >
            <span className="text-[7px] font-medium tracking-[0.2em] uppercase text-white/50 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] select-none mb-1 text-center leading-tight">
              {paletteName}
            </span>
            <div className="flex flex-col gap-1.5">
              {swatchImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shadow-sm"
                />
              ))}
            </div>
          </button>
        ) : null;
      })()}

      {/* Style tag - centered below status badge after upload/generation */}
      {hasUserImage && style && (
        <div className="absolute top-14 inset-x-0 flex justify-center">
          <button
            onClick={() => { onOpenSelector ? onOpenSelector("styles") : setActiveMode("styles"); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 backdrop-blur-xl rounded-full text-[10px] tracking-wide uppercase text-white/80 font-medium active:scale-95 transition-transform"
            style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
          >
            {t(`style.${style.id}`) || style.name}
            <ChevronDown className="w-2.5 h-2.5 text-white/50" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Palette specimen strip - bottom-right above FAB after upload */}
      {hasUserImage && palette && (() => {
        const swatchImages = getPaletteMaterialImages(palette.id).slice(0, 4);
        const paletteName = t(`palette.${palette.id}`) || palette.name;
        return swatchImages.length > 0 ? (
          <button
            onClick={() => { onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes"); }}
            className="absolute bottom-20 right-1.5 flex flex-col items-center active:scale-[0.97] transition-transform max-w-[44px]"
          >
            <span className="text-[7px] font-medium tracking-[0.2em] uppercase text-white/50 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] select-none mb-1 text-center leading-tight">
              {paletteName}
            </span>
            <div
              className="flex flex-col gap-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-xl shadow-lg"
              style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
            >
              {swatchImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ))}
            </div>
          </button>
        ) : null;
      })()}

      {/* AI concept watermark - directly on image */}
      <span className="absolute bottom-5 right-1.5 text-[8px] font-medium tracking-[0.2em] uppercase text-white/40 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] select-none pointer-events-none">
        {t("result.visualizationDisclaimer")}
      </span>

      {/* Upload type menu bottom sheet */}
      <UploadMenuSheet
        open={uploadMenuOpen}
        onOpenChange={setUploadMenuOpen}
        onSelect={handleUploadClick}
      />

    </div>
  );
}
