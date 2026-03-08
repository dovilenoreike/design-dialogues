import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { Upload, Sparkles, Loader2, Camera, X, Download, ChevronDown, Coins, RotateCcw } from "lucide-react";
import UploadMenuSheet from "./UploadMenuSheet";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCredits } from "@/contexts/CreditsContext";
import type { UploadType } from "@/types/design-state";


import { getVisualization } from "@/data/visualisations";
import { getPaletteById, getRoomMaterialBubbles, getSlotAlternatives } from "@/data/palettes";
import { getMaterialById } from "@/data/materials";
import { getStyleById, styles } from "@/data/styles";
import { rooms } from "@/data/rooms";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { collections } from "@/data/collections";
import { palettesV2 } from "@/data/palettes/palettes-v2";

// Map room name to translation key (nominative)
const roomTranslationKey: Record<string, string> = {
  "Kitchen": "space.kitchen",
  "Living Room": "space.livingRoom",
  "Bedroom": "space.bedroom",
  "Bathroom": "space.bathroom",
};

const ROOM_TO_TYPE: Record<string, string> = {
  "Kitchen": "kitchen",
  "Living Room": "livingRoom",
  "Bedroom": "bedroom",
  "Bathroom": "bathroom",
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
    materialOverrides,
    setMaterialOverrides,
    excludedSlots,
    setExcludedSlots,
  } = useDesign();
  const { credits, useCredit, refetchCredits, buyCredits } = useCredits();

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

  // Collection/palette derivations (needed by swipe handlers below)
  const selectedPaletteV2 = palettesV2.find((p) => p.id === selectedMaterial);
  const currentCollection = collections.find((c) => c.id === selectedPaletteV2?.collectionId);
  const palettesInCollection = palettesV2.filter((p) => p.collectionId === currentCollection?.id);

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
      case 'palettes': {
        const currentCollectionId = selectedPaletteV2?.collectionId ?? selectedMaterial ?? collections[0].id;
        const nextCollection = getNextItem(currentCollectionId, collections, 'left', c => c.id);
        const nextPaletteId = palettesV2.find((p) => p.collectionId === nextCollection.id)?.id;
        if (nextPaletteId) handleSelectMaterial(nextPaletteId);
        break;
      }
    }
  }, [isGenerating, showRoomSwitchDialog, showStyleSwitchDialog, activeMode, selectedCategory, selectedStyle, selectedMaterial, selectedPaletteV2, getNextItem, handleSelectCategory, handleSelectStyle, handleSelectMaterial]);

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
      case 'palettes': {
        const currentCollectionId = selectedPaletteV2?.collectionId ?? selectedMaterial ?? collections[0].id;
        const prevCollection = getNextItem(currentCollectionId, collections, 'right', c => c.id);
        const prevPaletteId = palettesV2.find((p) => p.collectionId === prevCollection.id)?.id;
        if (prevPaletteId) handleSelectMaterial(prevPaletteId);
        break;
      }
    }
  }, [isGenerating, showRoomSwitchDialog, showStyleSwitchDialog, activeMode, selectedCategory, selectedStyle, selectedMaterial, selectedPaletteV2, getNextItem, handleSelectCategory, handleSelectStyle, handleSelectMaterial]);

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
      setShowNoCreditsBanner(true);
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
        handleImageUpload(file, pendingUploadTypeRef.current);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleImageUpload]
  );

  const handleUploadClick = (type?: UploadType) => {
    if (type) pendingUploadTypeRef.current = type;
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

  // True when user's material overrides differ from the current palette defaults
  const hasMaterialChanges = useMemo(() => {
    if (Object.keys(materialOverrides).length === 0) return false;
    const pv2 = palettesV2.find(p => p.id === selectedMaterial);
    const roomType = ROOM_TO_TYPE[roomNameRaw];
    const paletteSlots = (pv2?.selections?.[roomType as keyof typeof pv2.selections] ?? {}) as Record<string, string>;
    return Object.entries(materialOverrides).some(([key, val]) => paletteSlots[key] !== val);
  }, [materialOverrides, selectedMaterial, roomNameRaw]);

  // Blur the pregenerated visualization when it no longer matches user's material selection
  const isVisualizationMismatched = !hasUserImage && hasMaterialChanges;

  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [showNoCreditsBanner, setShowNoCreditsBanner] = useState(false);

  const pendingUploadTypeRef = useRef<UploadType>("photo");

  // Material swap rail state — which slot's rail is open
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  // Close rail when palette or room changes
  useEffect(() => {
    setActiveSlot(null);
  }, [selectedMaterial, selectedCategory]);

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
        const currentCollectionId = selectedPaletteV2?.collectionId ?? selectedMaterial ?? collections[0].id;
        const prevCollection = getPrevItem(currentCollectionId, collections, c => c.id);
        const prevPaletteId = palettesV2.find((p) => p.collectionId === prevCollection.id)?.id ?? selectedMaterial;
        return getImageForState(selectedCategory, prevPaletteId, selectedStyle);
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
        const currentCollectionId = selectedPaletteV2?.collectionId ?? selectedMaterial ?? collections[0].id;
        const nextCollection = getNextItem(currentCollectionId, collections, 'left', c => c.id);
        const nextPaletteId = palettesV2.find((p) => p.collectionId === nextCollection.id)?.id ?? selectedMaterial;
        return getImageForState(selectedCategory, nextPaletteId, selectedStyle);
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
        onClick={() => { if (activeSlot) setActiveSlot(null); }}
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
              className={`w-full h-full object-cover transition-[filter] duration-300 ${isVisualizationMismatched ? 'blur-sm' : ''}`}
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
            className="pointer-events-auto flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-xl flex items-center justify-center shadow-lg"
              style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
            >
              <Upload className="w-6 h-6 text-white/80" strokeWidth={1.5} />
            </div>
            {isVisualizationMismatched && (
              <span className="text-sm text-white/60 text-center max-w-[200px] leading-relaxed tracking-wide [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] select-none">
                {t("mobile.stage.uploadPrompt")}
              </span>
            )}
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
            onClick={() => setUploadMenuOpen(true)}
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
        <div className="absolute bottom-6 left-3 flex items-center gap-1.5 z-10">
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

      {/* Palette material bubbles - bottom-right when browsing */}
      {!hasUserImage && palette && (() => {
        const bubbles = getRoomMaterialBubbles(palette.id, roomNameRaw);
        return bubbles.length > 0 ? (
          <div
            className="absolute bottom-12 right-1.5 flex flex-col items-center w-10 opacity-90"
          >
            {palette && (
              hasMaterialChanges ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedMaterial) handleSelectMaterial(selectedMaterial);
                  }}
                  className="w-full py-1.5 flex justify-center active:scale-95 transition-all mb-1"
                >
                  <RotateCcw className="w-3 h-3 text-white/60" strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = palettesInCollection.findIndex((p) => p.id === selectedMaterial);
                    if (palettesInCollection.length > 1) {
                      const next = palettesInCollection[(idx + 1) % palettesInCollection.length];
                      handleSelectMaterial(next.id);
                    }
                  }}
                  className="w-full py-1.5 text-[7px] tracking-wide uppercase font-medium text-white/60 active:scale-95 transition-all mb-1 text-center leading-tight break-words"
                >
                  {t(`palette.${palette.id}`) || palette.name}
                  {palettesInCollection.length > 1 && <ChevronDown className="w-2.5 h-2.5 text-white/50 shrink-0" strokeWidth={2} />}
                </button>
              )
            )}
            <div
              className="relative flex flex-col gap-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-xl shadow-lg"
              style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
            >
              {bubbles.map((bubble) => {
                const isExcluded = excludedSlots.has(bubble.slotKey);
                const overriddenImage = materialOverrides[bubble.slotKey]
                  ? getMaterialById(materialOverrides[bubble.slotKey])?.image || bubble.image
                  : bubble.image;
                const isActive = activeSlot === bubble.slotKey;
                return (
                  <div key={bubble.slotKey} className="relative h-7">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isExcluded) {
                          setExcludedSlots(prev => { const next = new Set(prev); next.delete(bubble.slotKey); return next; });
                          return;
                        }
                        if (activeMode !== "palettes") {
                          onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes");
                        }
                        setActiveSlot(isActive ? null : bubble.slotKey);
                      }}
                      className={`block active:scale-95 transition-transform relative ${isExcluded ? "opacity-[0.35]" : ""}`}
                    >
                      <img
                        src={overriddenImage}
                        alt={bubble.slotLabel}
                        title={bubble.slotLabel}
                        className={`w-7 h-7 rounded-full object-cover ${activeMode === "palettes" ? "" : "shadow-sm"} ${isActive ? "ring-[1.5px] ring-white" : ""}`}
                      />
                      {isExcluded && (
                        <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
                      )}
                    </button>
                    {/* Material swap rail */}
                    {isActive && !isExcluded && (() => {
                      const alternatives = getSlotAlternatives(palette.id, roomNameRaw, bubble.slotKey);
                      const currentMaterialId = materialOverrides[bubble.slotKey] || bubble.materialId;
                      return (
                        <div
                          className="absolute right-full top-1/2 -translate-y-1/2 mr-2 flex items-center gap-1.5 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Exclude slot button — outside the glass pill, at far left */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExcludedSlots(prev => new Set(prev).add(bubble.slotKey));
                              setActiveSlot(null);
                            }}
                            className="w-6 h-6 shrink-0 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <X className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
                          </button>
                          {/* Glass pill with alternatives */}
                          <div
                            className="relative flex items-center gap-1.5 backdrop-blur-xl bg-white/20 rounded-full px-1.5 py-1"
                            style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
                          >
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[7px] tracking-[0.2em] uppercase text-white/50 font-medium select-none whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                              {t(`surface.${bubble.slotKey}`) || bubble.slotLabel}
                            </span>
                            {alternatives.map((alt) => (
                              <button
                                key={alt.materialId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMaterialOverrides(prev => ({ ...prev, [bubble.slotKey]: alt.materialId }));
                                  setActiveSlot(null);
                                }}
                                className="w-7 h-7 shrink-0 active:scale-90 transition-transform"
                              >
                                <img
                                  src={alt.image}
                                  alt={alt.materialId}
                                  className={`w-7 h-7 rounded-full object-cover ${alt.materialId === currentMaterialId ? "ring-[1.5px] ring-white" : ""}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
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

      {/* Palette material bubbles - bottom-right above FAB after upload */}
      {hasUserImage && palette && (() => {
        const bubbles = getRoomMaterialBubbles(palette.id, roomNameRaw);
        const paletteName = t(`palette.${palette.id}`) || palette.name;
        return bubbles.length > 0 ? (
          <div
            className="absolute bottom-20 right-1.5 flex flex-col items-center max-w-[44px] opacity-100"
          >
            {hasMaterialChanges ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedMaterial) handleSelectMaterial(selectedMaterial);
                }}
                className="py-1.5 flex justify-center active:scale-95 transition-all mb-1"
              >
                <RotateCcw className="w-3 h-3 text-white/60" strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={() => { onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes"); }}
                className="active:scale-[0.97] transition-transform"
              >
                <span className="text-[7px] font-medium tracking-[0.2em] uppercase text-white/50 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] select-none mb-1 text-center leading-tight block">
                  {paletteName}
                </span>
              </button>
            )}
            <div
              className="relative flex flex-col gap-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-xl shadow-lg"
              style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
            >
              {bubbles.map((bubble) => {
                const isExcluded = excludedSlots.has(bubble.slotKey);
                const overriddenImage = materialOverrides[bubble.slotKey]
                  ? getMaterialById(materialOverrides[bubble.slotKey])?.image || bubble.image
                  : bubble.image;
                const isActive = activeSlot === bubble.slotKey;
                return (
                  <div key={bubble.slotKey} className="relative h-7">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isExcluded) {
                          setExcludedSlots(prev => { const next = new Set(prev); next.delete(bubble.slotKey); return next; });
                          return;
                        }
                        if (activeMode !== "palettes") {
                          onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes");
                        }
                        setActiveSlot(isActive ? null : bubble.slotKey);
                      }}
                      className={`block active:scale-95 transition-transform relative ${isExcluded ? "opacity-[0.35]" : ""}`}
                    >
                      <img
                        src={overriddenImage}
                        alt={bubble.slotLabel}
                        title={bubble.slotLabel}
                        className={`w-7 h-7 rounded-full object-cover ${isActive ? "ring-[1.5px] ring-white" : ""}`}
                      />
                      {isExcluded && (
                        <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
                      )}
                    </button>
                    {/* Material swap rail */}
                    {isActive && !isExcluded && (() => {
                      const alternatives = getSlotAlternatives(palette.id, roomNameRaw, bubble.slotKey);
                      const currentMaterialId = materialOverrides[bubble.slotKey] || bubble.materialId;
                      return (
                        <div
                          className="absolute right-full top-1/2 -translate-y-1/2 mr-2 flex items-center gap-1.5 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Exclude slot button — outside the glass pill, at far left */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExcludedSlots(prev => new Set(prev).add(bubble.slotKey));
                              setActiveSlot(null);
                            }}
                            className="w-6 h-6 shrink-0 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <X className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
                          </button>
                          {/* Glass pill with alternatives */}
                          <div
                            className="relative flex items-center gap-1.5 backdrop-blur-xl bg-white/20 rounded-full px-1.5 py-1"
                            style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
                          >
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[7px] tracking-[0.2em] uppercase text-white/50 font-medium select-none whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                              {t(`surface.${bubble.slotKey}`) || bubble.slotLabel}
                            </span>
                            {alternatives.map((alt) => (
                              <button
                                key={alt.materialId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMaterialOverrides(prev => ({ ...prev, [bubble.slotKey]: alt.materialId }));
                                  setActiveSlot(null);
                                }}
                                className="w-7 h-7 shrink-0 active:scale-90 transition-transform"
                              >
                                <img
                                  src={alt.image}
                                  alt={alt.materialId}
                                  className={`w-7 h-7 rounded-full object-cover ${alt.materialId === currentMaterialId ? "ring-[1.5px] ring-white" : ""}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* AI concept watermark - directly on image */}
      <span className="absolute bottom-1 right-1.5 text-[8px] font-medium tracking-[0.2em] uppercase text-white/40 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] select-none pointer-events-none">
        {t("result.visualizationDisclaimer")}
      </span>

      {/* Upload type menu bottom sheet */}
      <UploadMenuSheet
        open={uploadMenuOpen}
        onOpenChange={setUploadMenuOpen}
        onSelect={(type) => handleUploadClick(type)}
      />

      {/* No credits banner overlay */}
      {showNoCreditsBanner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-xs rounded-2xl bg-background p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Coins className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("credits.noCredits")}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {t("credits.bannerDescription")}
            </p>
            <button
              onClick={() => {
                setShowNoCreditsBanner(false);
                buyCredits();
              }}
              className="mt-4 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background active:scale-[0.98] transition-transform"
            >
              {t("credits.buyMore")}
            </button>
            <button
              onClick={() => setShowNoCreditsBanner(false)}
              className="mt-2 w-full py-2 text-xs text-muted-foreground"
            >
              {t("credits.dismiss")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
