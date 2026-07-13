import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Heart, Pencil } from "lucide-react";
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
  onApplyPreset: (materials: Record<string, string>, imageUrl: string | null, designer: string | null, isUserCollectionRestore?: boolean) => void;
  /** Whether the user already has materials set (prevents auto-applying on mount) */
  hasExistingMaterials: boolean;
  /**
   * True when a ?material= deep-link was present at page load. Suppresses the first-visit
   * auto-apply so the deep-link places only its own material instead of a full preset —
   * the board is briefly empty (default seeding is suppressed for deep-links) and must not
   * be back-filled with the first collection.
   */
  deepLinkMaterialPresent?: boolean;
  /** When true the user has changed materials — show "Your collection" instead of preset name */
  isModified?: boolean;
  /**
   * "overlay" (default) — absolute-positioned, floats over the Stage image with white text.
   * "header" — normal block element with dark text, sits in document flow above sub-tabs.
   */
  variant?: "overlay" | "header";
  /** User-saved palettes — prepended to the carousel with a heart badge */
  savedPalettes?: SavedPalette[];
  /** Auto-snapshot of the user's own work, captured before their first curated-preset swap */
  userCollectionSnapshot?: Record<string, string> | null;
}

type CarouselItem = {
  id: string;
  name: { en: string; lt: string };
  image_url: string | null;
  materials: Record<string, string>;
  isSaved: boolean;
  isUserCollection: boolean;
  designer?: string | null;
};

export default function CollectionPresetCarousel({
  roomCategory,
  onApplyPreset,
  hasExistingMaterials,
  deepLinkMaterialPresent = false,
  isModified = false,
  variant = "overlay",
  savedPalettes = [],
  userCollectionSnapshot = null,
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

  // Merge: "Your collection" snapshot first (when present), then saved palettes, then curated presets
  const allItems = useMemo((): CarouselItem[] => {
    const userCollItem: CarouselItem[] = userCollectionSnapshot
      ? [{ id: '__user__', name: { en: 'Your collection', lt: 'Tavo derinys' }, image_url: null, materials: userCollectionSnapshot, isSaved: false, isUserCollection: true }]
      : [];
    return [
      ...userCollItem,
      ...savedPalettes.map((p): CarouselItem => ({ id: p.id, name: { en: 'My palette', lt: 'Mano derinys' }, image_url: null, materials: p.materials, isSaved: true, isUserCollection: false })),
      ...filteredPresets.map((p): CarouselItem => ({ id: p.id, name: p.name, image_url: p.image_url ?? null, materials: p.materials, isSaved: false, isUserCollection: false, designer: p.designer ?? null })),
    ];
  }, [userCollectionSnapshot, savedPalettes, filteredPresets]);

  const applyAt = (next: number) => {
    if (!allItems[next]) return;
    setIndex(next);
    try { localStorage.setItem(indexKey, String(next)); } catch {}
    const item = allItems[next];
    // Remap any material codes to their showroom synonym where applicable
    const materials = activeShowroom
      ? Object.fromEntries(
          Object.entries(item.materials).map(([slot, code]) => [
            slot,
            resolveCodeForShowroom(code, activeShowroom.id),
          ])
        )
      : item.materials;
    onApplyPreset(materials, item.image_url ?? null, item.designer ?? null, item.isUserCollection);
  };

  // Auto-apply the first preset when presets load and user has no materials yet.
  // Wait for graph to load too when in showroom mode so filtering is accurate.
  // Skip if the user explicitly reset — they want an empty state across reloads.
  useEffect(() => {
    const userExplicitlyReset = localStorage.getItem("materials-reset") === "1";
    if (!loading && !graphLoading && allItems.length > 0 && !hasExistingMaterials && !userExplicitlyReset && !deepLinkMaterialPresent) {
      applyAt(0);
    }
  }, [loading, graphLoading, filteredPresets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp index if allItems shrinks (e.g. after graph loads and filters apply)
  useEffect(() => {
    if (allItems.length > 0 && index >= allItems.length) {
      setIndex(0);
    }
  }, [allItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset index when category changes
  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(indexKey) ?? "0") || 0;
      setIndex(saved);
    } catch {
      setIndex(0);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shift index when "Your collection" item appears or disappears (inserted at position 0)
  const prevSnapshotRef = useRef(userCollectionSnapshot);
  useEffect(() => {
    const wasNull = prevSnapshotRef.current == null;
    const isNow = userCollectionSnapshot != null;
    if (wasNull && isNow) {
      setIndex(i => {
        const next = i + 1;
        try { localStorage.setItem(indexKey, String(next)); } catch {}
        return next;
      });
    }
    if (!wasNull && !isNow) {
      setIndex(i => {
        const next = Math.max(0, i - 1);
        try { localStorage.setItem(indexKey, String(next)); } catch {}
        return next;
      });
    }
    prevSnapshotRef.current = userCollectionSnapshot;
  }, [userCollectionSnapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide while loading, or while graph is still loading in showroom mode (can't filter yet)
  if (loading || (activeShowroom && graphLoading) || allItems.length === 0) return null;

  const item = allItems[Math.min(index, allItems.length - 1)];
  const presetName = (language === "lt" ? item.name?.lt : item.name?.en) ?? item.id;
  const name = isModified && !item.isSaved && !item.isUserCollection
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
          {item.isUserCollection && <Pencil className="w-3 h-3 flex-shrink-0" style={{ color: "#647d75" }} strokeWidth={1.5} />}
          {item.isSaved && <Heart className="w-3 h-3 flex-shrink-0" style={{ color: "#647d75" }} fill="#647d75" strokeWidth={0} />}
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
          {item.isUserCollection && <Pencil className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />}
          {item.isSaved && <Heart className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" strokeWidth={0} />}
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
