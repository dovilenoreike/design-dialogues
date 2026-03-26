import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { Upload, Sparkles, Loader2, Camera, X, Download, Coins } from "lucide-react";
import UploadMenuSheet from "./UploadMenuSheet";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCredits } from "@/contexts/CreditsContext";
import { useAuth } from "@/hooks/useAuth";
import { requestMoreCredits } from "@/lib/request-credits";
import type { UploadType } from "@/types/design-state";

import { getVisualization } from "@/data/visualisations";
import { ROOM_DISPLAY_TO_TRANSLATION_KEY } from "@/lib/design-constants";
import { rooms } from "@/data/rooms";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { useStageSwipe, getNextItem, getPrevItem } from "@/hooks/useStageSwipe";
import { getCollectionMaterialBubbles } from "@/lib/collection-utils";
import { useShowroom } from "@/contexts/ShowroomContext";
import StageCarousel from "./StageCarousel";
import StageBubbleRail from "./StageBubbleRail";

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
    generateClayRender,
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
  const { user } = useAuth();
  const { activeShowroom } = useShowroom();
  const showroomFilter = activeShowroom
    ? { id: activeShowroom.id, surfaceCategories: activeShowroom.surfaceCategories }
    : undefined;

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

  const uploadType = design.uploadTypes[selectedCategory || "Kitchen"] || "photo";
  const isFloorplan = uploadType === "floorplan";
  const clayRender = generation.clayRenderImages?.[selectedCategory || "Kitchen"] ?? null;
  const [isGeneratingClay, setIsGeneratingClay] = useState(false);

  const handleGenerateClayRenderClick = useCallback(async () => {
    setIsGeneratingClay(true);
    await generateClayRender();
    setIsGeneratingClay(false);
  }, [generateClayRender]);

  const handleRegenerateClayClick = useCallback(async () => {
    setIsGeneratingClay(true);
    await generateClayRender();
    setIsGeneratingClay(false);
  }, [generateClayRender]);

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

  const styleId = design.selectedStyle || null;
  const visualizationImage = getVisualization(selectedMaterial, selectedCategory, styleId);
  const displayImage = generatedImage || (isFloorplan && clayRender ? clayRender : null) || uploadedImage || visualizationImage;
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
  const [creditRequestState, setCreditRequestState] = useState<'idle' | 'form' | 'submitting' | 'success' | 'error'>('idle');
  const [creditRequestEmail, setCreditRequestEmail] = useState('');

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
    const clay = generation.clayRenderImages?.[roomName] ?? null;
    const uploadTypeForRoom = design.uploadTypes[roomName] || "photo";
    return generated || (uploadTypeForRoom === "floorplan" && clay ? clay : null) || uploaded || getVisualization(material, category, style);
  }, [uploadedImages, generatedImages, generation.clayRenderImages, design.uploadTypes]);

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
  const bubbles = currentCollection
    ? getCollectionMaterialBubbles(currentCollection, materialOverrides, showroomFilter)
    : [];

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
          {isFloorplan ? (
            // Floorplan two-step flow
            isGenerating ? (
              <button disabled className="flex items-center gap-2 px-5 py-3 bg-foreground/70 text-background rounded-full font-medium text-sm shadow-lg min-h-[44px]">
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                {isGeneratingClay ? "Generating Clay..." : t("mobile.stage.generating")}
              </button>
            ) : !clayRender && !generatedImage ? (
              // Step 1: no clay render yet
              <button
                onClick={handleGenerateClayRenderClick}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm shadow-lg min-h-[44px] transition-all bg-foreground text-background active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                Generate Clay Render
              </button>
            ) : clayRender && !generatedImage ? (
              // Between steps: clay render exists, no final image
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleRegenerateClayClick}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-xl text-white/80 rounded-full text-xs font-medium shadow-md active:scale-[0.98] transition-transform"
                  style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
                >
                  Regenerate Clay
                </button>
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
                  Add Textures
                </button>
              </div>
            ) : (
              // Final image exists: normal UI
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
                {t("mobile.stage.revisualize")}
              </button>
            )
          ) : (
            // Non-floorplan: existing UI
            isGenerating ? (
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
            )
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


      {/* Bubble rail - browsing mode */}
      {!hasUserImage && currentCollection && bubbles.length > 0 && (
        <StageBubbleRail
          collection={currentCollection}
          bubbles={bubbles}

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


      {/* Bubble rail - uploaded mode */}
      {hasUserImage && currentCollection && bubbles.length > 0 && (
        <StageBubbleRail
          collection={currentCollection}
          bubbles={bubbles}

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
                setCreditRequestState('idle');
                setCreditRequestEmail('');
                buyCredits();
              }}
              className="mt-4 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background active:scale-[0.98] transition-transform"
            >
              {t("credits.buyMore")}
            </button>

            {/* Credit request flow */}
            {creditRequestState === 'idle' && (
              <button
                onClick={() => setCreditRequestState('form')}
                className="mt-2 w-full py-2 text-xs text-muted-foreground underline underline-offset-2"
              >
                {t("credits.requestFree")}
              </button>
            )}

            {creditRequestState === 'form' && (
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={creditRequestEmail}
                  onChange={(e) => setCreditRequestEmail(e.target.value)}
                  placeholder={t("credits.requestEmailPlaceholder")}
                  className="flex-1 rounded-full border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                <button
                  onClick={async () => {
                    if (!creditRequestEmail || !user) return;
                    setCreditRequestState('submitting');
                    const result = await requestMoreCredits(user.id, creditRequestEmail);
                    if (result.success) {
                      setCreditRequestState('success');
                      setTimeout(() => {
                        setShowNoCreditsBanner(false);
                        setCreditRequestState('idle');
                        setCreditRequestEmail('');
                      }, 2000);
                    } else {
                      setCreditRequestState('error');
                    }
                  }}
                  disabled={!creditRequestEmail}
                  className="rounded-full bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  {t("credits.requestSubmit")}
                </button>
              </div>
            )}

            {creditRequestState === 'submitting' && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t("credits.requestSubmit")}...</span>
              </div>
            )}

            {creditRequestState === 'success' && (
              <p className="mt-3 text-xs font-medium" style={{ color: '#647d75' }}>
                {t("credits.requestSuccess")}
              </p>
            )}

            {creditRequestState === 'error' && (
              <button
                onClick={() => setCreditRequestState('form')}
                className="mt-3 w-full py-1 text-xs"
                style={{ color: '#9a3412' }}
              >
                {t("credits.requestError")}
              </button>
            )}

            {creditRequestState !== 'form' && creditRequestState !== 'submitting' && (
              <button
                onClick={() => {
                  setShowNoCreditsBanner(false);
                  setCreditRequestState('idle');
                  setCreditRequestEmail('');
                }}
                className="mt-2 w-full py-2 text-xs text-muted-foreground"
              >
                {t("credits.dismiss")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
