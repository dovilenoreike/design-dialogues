import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCollectionPresets } from "@/hooks/useCollectionPresets";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { useGraphMaterials, getMaterialByCode } from "@/hooks/useGraphMaterials";
import type { MaterialRole } from "@/types/material-types";

interface CollectionPresetCarouselProps {
  /** Room category from design state, e.g. "Kitchen", "Living Room" */
  roomCategory: string | null;
  /** Called when a preset is selected — replaces materialOverrides with preset materials */
  onApplyPreset: (materials: Record<string, string>, imageUrl: string | null) => void;
  /** Whether the user already has materials set (prevents auto-applying on mount) */
  hasExistingMaterials: boolean;
  /** When true the user has changed materials — show "Your collection" instead of preset name */
  isModified?: boolean;
  /**
   * "overlay" (default) — absolute-positioned, floats over the Stage image with white text.
   * "header" — normal block element with dark text, sits in document flow above sub-tabs.
   */
  variant?: "overlay" | "header";
}

export default function CollectionPresetCarousel({
  roomCategory,
  onApplyPreset,
  hasExistingMaterials,
  isModified = false,
  variant = "overlay",
}: CollectionPresetCarouselProps) {
  const { language } = useLanguage();
  const { activeShowroom } = useShowroom();
  const { loading: graphLoading } = useGraphMaterials();

  // Normalise "Living Room" → "living-room" to match DB values
  const category = roomCategory
    ? roomCategory.toLowerCase().replace(/\s+/g, "-")
    : "kitchen";

  const { presets, loading } = useCollectionPresets(category);
  const indexKey = `preset-index-${category}`;
  const [index, setIndex] = useState(() => {
    try { return parseInt(localStorage.getItem(indexKey) ?? "0") || 0; } catch { return 0; }
  });

  // Filter presets to those compatible with the active showroom.
  // Rule: every material whose role is covered by the showroom must be in that showroom's stock.
  // Materials in roles the showroom doesn't cover (e.g. worktops for a floor-only showroom) are ignored.
  const filteredPresets = useMemo(() => {
    if (!activeShowroom || graphLoading) return presets;
    return presets.filter((preset) =>
      Object.values(preset.materials).every((code) => {
        const mat = getMaterialByCode(code);
        if (!mat) return true; // unknown material — allow rather than hide
        const showroomCoversRole = mat.role.some((r) =>
          activeShowroom.surfaceCategories.includes(r as MaterialRole)
        );
        if (!showroomCoversRole) return true; // role not covered by this showroom — ignore
        return mat.showroomIds.includes(activeShowroom.id);
      })
    );
  }, [presets, activeShowroom, graphLoading]);

  const applyAt = (next: number) => {
    setIndex(next);
    try { localStorage.setItem(indexKey, String(next)); } catch {}
    onApplyPreset(filteredPresets[next].materials, filteredPresets[next].image_url ?? null);
  };

  // Auto-apply the first preset when presets load and user has no materials yet.
  // Wait for graph to load too when in showroom mode so filtering is accurate.
  useEffect(() => {
    if (!loading && !graphLoading && filteredPresets.length > 0 && !hasExistingMaterials) {
      applyAt(0);
    }
  }, [loading, graphLoading, filteredPresets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp index if filteredPresets shrinks (e.g. after graph loads and filters apply)
  useEffect(() => {
    if (filteredPresets.length > 0 && index >= filteredPresets.length) {
      setIndex(0);
    }
  }, [filteredPresets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset index when category changes
  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(indexKey) ?? "0") || 0;
      setIndex(saved);
    } catch {
      setIndex(0);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide while loading, or while graph is still loading in showroom mode (can't filter yet)
  if (loading || (activeShowroom && graphLoading) || filteredPresets.length === 0) return null;

  const preset = filteredPresets[index];
  const presetName = (language === "lt" ? preset.name?.lt : preset.name?.en) ?? preset.id;
  const name = isModified
    ? (language === "lt" ? "Tavo derinys" : "Your collection")
    : presetName;

  const goPrev = () => applyAt((index - 1 + filteredPresets.length) % filteredPresets.length);
  const goNext = () => applyAt((index + 1) % filteredPresets.length);

  if (variant === "header") {
    return (
      <div className="flex items-center justify-center gap-3 py-1">
        <button
          onClick={goPrev}
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ backgroundColor: "rgba(0,0,0,0.07)", border: "0.5px solid rgba(0,0,0,0.08)" }}
          aria-label="Previous collection"
        >
          <ChevronLeft className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
        </button>
        <span className="w-40 text-center text-[12px] font-medium tracking-[0.04em] text-foreground/70 select-none uppercase truncate">
          {name}
        </span>
        <button
          onClick={goNext}
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ backgroundColor: "rgba(0,0,0,0.07)", border: "0.5px solid rgba(0,0,0,0.08)" }}
          aria-label="Next collection"
        >
          <ChevronRight className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

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
