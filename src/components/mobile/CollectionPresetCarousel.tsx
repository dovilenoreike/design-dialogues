import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCollectionPresets } from "@/hooks/useCollectionPresets";
import { useLanguage } from "@/contexts/LanguageContext";

interface CollectionPresetCarouselProps {
  /** Room category from design state, e.g. "Kitchen", "Living Room" */
  roomCategory: string | null;
  /** Called when a preset is selected — replaces materialOverrides with preset materials */
  onApplyPreset: (materials: Record<string, string>, imageUrl: string | null) => void;
  /** Whether the user already has materials set (prevents auto-applying on mount) */
  hasExistingMaterials: boolean;
  /** When true the user has changed materials — show "Your collection" instead of preset name */
  isModified?: boolean;
}

export default function CollectionPresetCarousel({
  roomCategory,
  onApplyPreset,
  hasExistingMaterials,
  isModified = false,
}: CollectionPresetCarouselProps) {
  const { language } = useLanguage();

  // Normalise "Living Room" → "living-room" to match DB values
  const category = roomCategory
    ? roomCategory.toLowerCase().replace(/\s+/g, "-")
    : "kitchen";

  const { presets, loading } = useCollectionPresets(category);
  const [index, setIndex] = useState(0);

  // Auto-apply the first preset when presets load and user has no materials yet
  useEffect(() => {
    if (!loading && presets.length > 0 && !hasExistingMaterials) {
      onApplyPreset(presets[0].materials, presets[0].image_url ?? null);
    }
  }, [loading, presets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset index when category changes
  useEffect(() => {
    setIndex(0);
  }, [category]);

  if (loading || presets.length === 0) return null;

  const preset = presets[index];
  const presetName = (language === "lt" ? preset.name?.lt : preset.name?.en) ?? preset.id;
  const name = isModified
    ? (language === "lt" ? "Tavo derinys" : "Your collection")
    : presetName;

  const goPrev = () => {
    const next = (index - 1 + presets.length) % presets.length;
    setIndex(next);
    onApplyPreset(presets[next].materials, presets[next].image_url ?? null);
  };

  const goNext = () => {
    const next = (index + 1) % presets.length;
    setIndex(next);
    onApplyPreset(presets[next].materials, presets[next].image_url ?? null);
  };

  return (
    <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-center pt-3 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={goPrev}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 active:scale-90 transition-transform"
          style={{ border: "0.5px solid rgba(255,255,255,0.2)" }}
          aria-label="Previous collection"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <span className="text-sm font-medium text-white select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
          {name}
        </span>
        <button
          onClick={goNext}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 active:scale-90 transition-transform"
          style={{ border: "0.5px solid rgba(255,255,255,0.2)" }}
          aria-label="Next collection"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
