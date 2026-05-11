import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useCollectionPresets } from "@/hooks/useCollectionPresets";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { useGraphMaterials, getMaterialByCode, resolveCodeForShowroom } from "@/hooks/useGraphMaterials";
import type { MaterialRole } from "@/types/material-types";
import type { SavedPalette } from "@/hooks/useSavedPalettes";

interface CollectionPresetCarouselProps {
  /** Room category from design state, e.g. "Kitchen", "Living Room" */
  roomCategory: string | null;
  /** Called when a preset is selected — replaces materialOverrides with preset materials */
  onApplyPreset: (materials: Record<string, string>, imageUrl: string | null, designer: string | null) => void;
  /** Whether the user already has materials set (prevents auto-applying on mount) */
  hasExistingMaterials: boolean;
  /** When true the user has changed materials — show "Your collection" instead of preset name */
  isModified?: boolean;
  /**
   * "overlay" (default) — absolute-positioned, floats over the Stage image with white text.
   * "header" — normal block element with dark text, sits in document flow above sub-tabs.
   */
  variant?: "overlay" | "header";
  /** User-saved palettes — prepended to the carousel with a heart badge */
  savedPalettes?: SavedPalette[];
}

export default function CollectionPresetCarousel({
  roomCategory,
  onApplyPreset,
  hasExistingMaterials,
  isModified = false,
  variant = "overlay",
  savedPalettes = [],
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
  // Rule: every material whose role is covered by the showroom must be in that showroom's stock
  // — or have a synonym that is. Materials in uncovered roles are ignored.
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
        // Accept if the material itself is in the showroom, or a synonym is
        return resolveCodeForShowroom(code, activeShowroom.id) !== code
          || mat.showroomIds.includes(activeShowroom.id);
      })
    );
  }, [presets, activeShowroom, graphLoading]);

  const applyAt = (next: number) => {
    setIndex(next);
    try { localStorage.setItem(indexKey, String(next)); } catch {}
    // allItems isn't available here yet (defined below), so we recalculate inline
    const items = [
      ...savedPalettes.map((p) => ({ materials: p.materials, image_url: null as string | null, designer: null as string | null })),
      ...filteredPresets.map((p) => ({ ...p, designer: p.designer ?? null })),
    ];
    if (!items[next]) return;
    // Remap any material codes to their showroom synonym where applicable
    const materials = activeShowroom
      ? Object.fromEntries(
          Object.entries(items[next].materials).map(([slot, code]) => [
            slot,
            resolveCodeForShowroom(code, activeShowroom.id),
          ])
        )
      : items[next].materials;
    onApplyPreset(materials, items[next].image_url ?? null, items[next].designer);
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

  // Merge: saved palettes first, then curated presets
  const allItems = useMemo(() => [
    ...savedPalettes.map((p) => ({
      id: p.id,
      name: { en: "My palette", lt: "Mano derinys" },
      image_url: null as string | null,
      materials: p.materials,
      isSaved: true,
    })),
    ...filteredPresets.map((p) => ({ ...p, isSaved: false })),
  ], [savedPalettes, filteredPresets]);

  // Hide while loading, or while graph is still loading in showroom mode (can't filter yet)
  if (loading || (activeShowroom && graphLoading) || allItems.length === 0) return null;

  const preset = allItems[Math.min(index, allItems.length - 1)];
  const presetName = (language === "lt" ? preset.name?.lt : preset.name?.en) ?? preset.id;
  const name = isModified && !preset.isSaved
    ? (language === "lt" ? "Tavo derinys" : "Your collection")
    : presetName;

  const goPrev = () => applyAt((index - 1 + allItems.length) % allItems.length);
  const goNext = () => applyAt((index + 1) % allItems.length);

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
        <span className="w-40 flex items-center justify-center gap-1 text-[12px] font-medium tracking-[0.04em] text-foreground/70 select-none uppercase truncate">
          {preset.isSaved && <Heart className="w-3 h-3 flex-shrink-0" style={{ color: "#647d75" }} fill="#647d75" strokeWidth={0} />}
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
        <span className="flex items-center gap-1 text-sm font-medium text-white select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
          {preset.isSaved && <Heart className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" strokeWidth={0} />}
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
