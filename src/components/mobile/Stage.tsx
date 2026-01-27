import { useRef, useCallback } from "react";
import { Upload, Sparkles, Loader2, Camera, X, Download, LayoutGrid, Palette } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCredits } from "@/contexts/CreditsContext";
import { toast } from "sonner";
import { getVisualization } from "@/data/visualisations";
import { getPaletteById } from "@/data/palettes";
import { getStyleById } from "@/data/styles";

// Map room name to translation key (nominative)
const roomTranslationKey: Record<string, string> = {
  "Kitchen": "space.kitchen",
  "Living Room": "space.livingRoom",
  "Bathroom": "space.bathroom",
  "Bedroom": "space.bedroom",
};

// Map room name to accusative translation key (for "Kuriame {room}")
const roomTranslationKeyAcc: Record<string, string> = {
  "Kitchen": "space.kitchenAcc",
  "Living Room": "space.livingRoomAcc",
  "Bathroom": "space.bathroomAcc",
  "Bedroom": "space.bedroomAcc",
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
  } = useDesign();
  const { credits, useCredit, refetchCredits } = useCredits();

  const { uploadedImages, selectedCategory, selectedMaterial } = design;
  const { generatedImage, isGenerating } = generation;

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

  // Get current room's uploaded image
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;

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
  const displayImage = generatedImage || uploadedImage || visualizationImage;
  const roomNameRaw = selectedCategory || "Kitchen";
  const roomName = t(roomTranslationKey[roomNameRaw] || roomNameRaw);
  const roomNameAcc = t(roomTranslationKeyAcc[roomNameRaw] || roomTranslationKey[roomNameRaw] || roomNameRaw);
  const hasUserImage = !!uploadedImage || !!generatedImage;

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

      {/* Background visualization image */}
      <div className="absolute inset-0">
        <img
          src={displayImage}
          alt={`${roomName} visualization`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Upload overlay - show when no user image */}
      {!hasUserImage && (
        <button
          onClick={handleUploadClick}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-colors active:bg-black/50"
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
      )}

      {/* Status badge and action buttons - show when user has uploaded/generated */}
      {hasUserImage && (
        <div className="absolute inset-x-0 top-4 flex flex-col items-center px-4">
          <p className="inline-block px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white/90">
            {generatedImage
              ? t("mobile.stage.visualized").replace("{room}", roomName)
              : t("mobile.stage.yourRoom").replace("{room}", roomName)}
          </p>
          {/* Visualization disclaimer - only after generation */}
          {generatedImage && (
            <p className="mt-1.5 text-[10px] text-white/70 italic">
              {t("result.visualizationDisclaimer")}
            </p>
          )}
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
              {generatedImage ? t("mobile.stage.revisualize") : t("mobile.stage.visualize")}
            </button>
          )}
        </div>
      )}

      {/* Replace button - show when user has uploaded */}
      {hasUserImage && !isGenerating && (
        <button
          onClick={handleUploadClick}
          className="absolute bottom-4 left-4 flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-sm text-foreground rounded-full text-sm font-medium shadow-lg active:scale-[0.98] transition-transform min-h-[44px]"
        >
          <Camera className="w-4 h-4" strokeWidth={1.5} />
          {t("mobile.stage.replace")}
        </button>
      )}

      {/* Glass Pills - bottom when browsing */}
      {!hasUserImage && (style || palette) && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 pointer-events-none">
          {style && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-full text-xs text-white font-medium">
              <LayoutGrid className="w-3 h-3" strokeWidth={2} />
              {t(`style.${style.id}`) || style.name}
            </span>
          )}
          {palette && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/10">
              <Palette className="w-3 h-3" strokeWidth={2} />
              {t(`palette.${palette.id}`) || palette.name}
            </span>
          )}
        </div>
      )}

      {/* Glass Pills - centered below status badge after upload/generation */}
      {hasUserImage && (style || palette) && (
        <div className="absolute top-14 inset-x-0 flex justify-center items-center gap-2 pointer-events-none">
          {style && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-full text-xs text-white font-medium">
              <LayoutGrid className="w-3 h-3" strokeWidth={2} />
              {t(`style.${style.id}`) || style.name}
            </span>
          )}
          {palette && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/10">
              <Palette className="w-3 h-3" strokeWidth={2} />
              {t(`palette.${palette.id}`) || palette.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
