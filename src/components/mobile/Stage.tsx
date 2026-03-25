import { useCallback, useMemo, useEffect, useState } from "react";
import { Upload, Sparkles, Loader2, Camera, X, Download, ChevronDown, Coins } from "lucide-react";
import UploadMenuSheet from "./UploadMenuSheet";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCredits } from "@/contexts/CreditsContext";
import type { UploadType } from "@/types/design-state";

import { getVisualization } from "@/data/visualisations";
import { ROOM_DISPLAY_TO_TYPE, ROOM_DISPLAY_TO_TRANSLATION_KEY } from "@/lib/design-constants";
import { getStyleById } from "@/data/styles";
import { rooms } from "@/data/rooms";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { useStageSwipe, getNextItem, getPrevItem } from "@/hooks/useStageSwipe";
import { getCollectionMaterialBubbles } from "@/lib/collection-utils";
import StageCarousel from "./StageCarousel";
import StageBubbleRail from "./StageBubbleRail";
import { useRef } from "react";

interface StageProps {
  onOpenSelector?: (mode: ControlMode) => void;
}

export default function Stage({ onOpenSelector }: StageProps = {}) {
  const { t, language } = useLanguage();
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

  // selectedMaterial is now a collection ID directly
  const currentCollection = selectedMaterial ? collectionsV2.find((c) => c.id === selectedMaterial) : null;

  // Swipe gesture hook
  const { isDragging, dragOffset, ref } = useStageSwipe({
    activeMode,
    selectedCategory,
    selectedStyle,
    selectedMaterial,
    isGenerating,
    showRoomSwitchDialog,
    showStyleSwitchDialog,
    handleSelectCategory,
    handleSelectStyle,
    handleSelectMaterial,
  });

  // Wrapper that generates first, then deducts credit only on success
  const handleGenerateWithCredits = useCallback(async () => {
    if (credits !== null && credits <= 0) {
      setShowNoCreditsBanner(true);
      return;
    }

    try {
      const success = await handleGenerate();
      if (success) {
        try {
          await useCredit();
        } catch (creditErr) {
          console.error("Failed to deduct credit after successful generation:", creditErr);
          refetchCredits();
        }
      }
    } catch (err) {
      console.error("Generation failed:", err);
    }
  }, [credits, handleGenerate, useCredit, refetchCredits]);

  // Current room's images
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;
  const generatedImage = generatedImages[selectedCategory || "Kitchen"] || null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadTypeRef = useRef<UploadType>("photo");

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageUpload(file, pendingUploadTypeRef.current);
      e.target.value = "";
    },
    [handleImageUpload]
  );

  const handleUploadClick = (type?: UploadType) => {
    if (type) pendingUploadTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const style = design.selectedStyle ? getStyleById(design.selectedStyle) : null;

  const styleId = design.selectedStyle || null;
  const visualizationImage = getVisualization(selectedMaterial, selectedCategory, styleId);
  const displayImage = generatedImage || uploadedImage || visualizationImage;
  const roomNameRaw = selectedCategory || "Kitchen";
  const roomName = t(ROOM_DISPLAY_TO_TRANSLATION_KEY[roomNameRaw] || roomNameRaw);
  const hasUserImage = !!uploadedImage || !!generatedImage;

  // True when there are user-applied material overrides (the overrides ARE the design choices)
  const hasMaterialChanges = useMemo(() => {
    return Object.keys(materialOverrides).length > 0;
  }, [materialOverrides]);

  const isVisualizationMismatched = !hasUserImage && hasMaterialChanges;

  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [showNoCreditsBanner, setShowNoCreditsBanner] = useState(false);

  // Material swap rail — which slot's rail is open
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  // Close rail when palette or room changes
  useEffect(() => {
    setActiveSlot(null);
  }, [selectedMaterial, selectedCategory]);

  // Calculate image URL for any room/style/palette combo
  const getImageForState = useCallback((
    category: string | null,
    material: string | null,
    style: string | null
  ): string => {
    const roomName = category || "Kitchen";
    const uploaded = uploadedImages[roomName];
    const generated = generatedImages[roomName];
    return generated || uploaded || getVisualization(material, category, style);
  }, [uploadedImages, generatedImages]);

  // Prev/current/next images for carousel
  const prevImage = useMemo(() => {
    switch (activeMode) {
      case 'rooms': {
        const prevRoom = getPrevItem(selectedCategory, rooms, r => r.name);
        return getImageForState(prevRoom.name, selectedMaterial, selectedStyle);
      }
      case 'styles': {
        const prevStyle = getPrevItem(selectedStyle, [], s => s.id);
        return getImageForState(selectedCategory, selectedMaterial, prevStyle?.id ?? selectedStyle);
      }
      case 'palettes': {
        const currentCollectionId = selectedMaterial ?? collectionsV2[0].id;
        const prevCollection = getPrevItem(currentCollectionId, collectionsV2, c => c.id);
        return getImageForState(selectedCategory, prevCollection.id, selectedStyle);
      }
    }
  }, [activeMode, selectedCategory, selectedMaterial, selectedStyle, getImageForState]);

  const currentImage = displayImage;

  const nextImage = useMemo(() => {
    switch (activeMode) {
      case 'rooms': {
        const nextRoom = getNextItem(selectedCategory, rooms, 'left', r => r.name);
        return getImageForState(nextRoom.name, selectedMaterial, selectedStyle);
      }
      case 'styles': {
        const nextStyle = getNextItem(selectedStyle, [], 'left', s => s.id);
        return getImageForState(selectedCategory, selectedMaterial, nextStyle?.id ?? selectedStyle);
      }
      case 'palettes': {
        const currentCollectionId = selectedMaterial ?? collectionsV2[0].id;
        const nextCollection = getNextItem(currentCollectionId, collectionsV2, 'left', c => c.id);
        return getImageForState(selectedCategory, nextCollection.id, selectedStyle);
      }
    }
  }, [activeMode, selectedCategory, selectedMaterial, selectedStyle, getImageForState]);

  // Preload adjacent images
  useEffect(() => {
    [prevImage, nextImage].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [prevImage, nextImage]);

  // Bubble data for the rail — built from materialOverrides + collection defaults
  const bubbles = currentCollection ? getCollectionMaterialBubbles(currentCollection, roomNameRaw, materialOverrides) : [];

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

      {/* Carousel */}
      <StageCarousel
        prevImage={prevImage}
        currentImage={currentImage}
        nextImage={nextImage}
        isDragging={isDragging}
        dragOffset={dragOffset}
        containerRef={ref}
        onClickContainer={() => { if (activeSlot) setActiveSlot(null); }}
        isVisualizationMismatched={isVisualizationMismatched}
        roomName={roomName}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

      {/* Room label - top-left when browsing */}
      {!hasUserImage && (
        <div className="absolute top-4 left-3 z-10">
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/60 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] select-none">
            {String(rooms.findIndex(r => r.name === roomNameRaw) + 1).padStart(2, '0')} &bull; {roomName}
          </span>
        </div>
      )}

      {/* Upload button - centered when browsing */}
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

      {/* Room label + action buttons after upload */}
      {hasUserImage && (
        <div className="absolute inset-x-0 top-4 px-3">
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-neutral-500 [text-shadow:0_0_4px_rgba(255,255,255,0.8)] select-none">
            {String(rooms.findIndex(r => r.name === roomNameRaw) + 1).padStart(2, '0')} &bull; {roomName}
          </span>
          {generatedImage && !isGenerating && (
            <button
              onClick={handleSaveImage}
              className="absolute top-0 right-12 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-transform"
              style={{ border: '0.5px solid rgba(255,255,255,0.15)' }}
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
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

      {/* FAB generate button */}
      {hasUserImage && (
        <div className="absolute bottom-4 right-4">
          {isGenerating ? (
            <button disabled className="flex items-center gap-2 px-5 py-3 bg-foreground/70 text-background rounded-full font-medium text-sm shadow-lg min-h-[44px]">
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

      {/* Bottom-left replace button after upload */}
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

      {/* Bubble rail - browsing mode */}
      {!hasUserImage && currentCollection && bubbles.length > 0 && (
        <StageBubbleRail
          collection={currentCollection}
          bubbles={bubbles}
          roomNameRaw={roomNameRaw}
          materialOverrides={materialOverrides}
          excludedSlots={excludedSlots}
          setMaterialOverrides={setMaterialOverrides}
          setExcludedSlots={setExcludedSlots}
          activeSlot={activeSlot}
          setActiveSlot={setActiveSlot}
          activeMode={activeMode}
          onOpenSelector={onOpenSelector}
          setActiveMode={setActiveMode}
          hasMaterialChanges={hasMaterialChanges}
          handleSelectMaterial={handleSelectMaterial}
          selectedMaterial={selectedMaterial}
          t={t}
          language={language}
          variant="browsing"
        />
      )}

      {/* Style tag after upload */}
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

      {/* Bubble rail - uploaded mode */}
      {hasUserImage && currentCollection && bubbles.length > 0 && (
        <StageBubbleRail
          collection={currentCollection}
          bubbles={bubbles}
          roomNameRaw={roomNameRaw}
          materialOverrides={materialOverrides}
          excludedSlots={excludedSlots}
          setMaterialOverrides={setMaterialOverrides}
          setExcludedSlots={setExcludedSlots}
          activeSlot={activeSlot}
          setActiveSlot={setActiveSlot}
          activeMode={activeMode}
          onOpenSelector={onOpenSelector}
          setActiveMode={setActiveMode}
          hasMaterialChanges={hasMaterialChanges}
          handleSelectMaterial={handleSelectMaterial}
          selectedMaterial={selectedMaterial}
          t={t}
          language={language}
          variant="uploaded"
        />
      )}

      {/* AI concept watermark */}
      <span className="absolute bottom-1 right-1.5 text-[8px] font-medium tracking-[0.2em] uppercase text-white/40 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] select-none pointer-events-none">
        {t("result.visualizationDisclaimer")}
      </span>

      {/* Upload type menu */}
      <UploadMenuSheet
        open={uploadMenuOpen}
        onOpenChange={setUploadMenuOpen}
        onSelect={(type) => handleUploadClick(type)}
      />

      {/* No credits banner */}
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
