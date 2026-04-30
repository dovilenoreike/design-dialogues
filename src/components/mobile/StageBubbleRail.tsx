import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { useGraphMaterials, getMaterialByCode, getPairCountByCode, getMaterialsByRole } from "@/hooks/useGraphMaterials";
import { getArchetypeById } from "@/data/archetypes";
import { SLOT_TO_ROLE, type MaterialBubble } from "@/lib/collection-utils";
import { SLOT_KEY_TO_ROLE, type SlotKey } from "./controls/MaterialSlotPicker";
import { surfaces } from "@/data/rooms/surfaces";
import { OPTIONAL_SLOTS } from "./views/KonceptasView";
import type { ControlMode } from "@/contexts/DesignContext";

interface StageBubbleRailProps {
  bubbles: MaterialBubble[];
  materialOverrides: Record<string, string>;
  excludedSlots: Set<string>;
  setMaterialOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setExcludedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeSlot: string | null;
  setActiveSlot: (slot: string | null) => void;
  activeMode: ControlMode;
  onOpenSelector?: (mode: ControlMode) => void;
  setActiveMode: (mode: ControlMode) => void;
  t: (key: string) => string;
  /** "browsing" = no user image (sits above CTAs), "uploaded" = user has image */
  variant: "browsing" | "uploaded";
  /** If provided, only show swatches for these slots; all others collapse into a "+" tile */
  collectionSlots?: Set<string>;
  /** Called when user adds a new slot via "+", so the parent can expand collectionSlots */
  onAddSlot?: (slotKey: string) => void;
  /** When provided, swatch tap opens the full picker instead of the alternatives panel */
  onSwatchTap?: (paletteKey: string) => void;
  /** Which optional slots are currently enabled — used to filter the swatch rail */
  enabledOptionalSlots?: Set<SlotKey>;
  /** Categories available to add (same list as flatlay "+") — e.g. "front", "worktop", "accent" */
  addableCategories?: string[];
  /** Called when user picks a category to add — same callback as flatlay "+" */
  onAddCategory?: (category: string) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  front: "Fronts",
  worktop: "Worktops",
  accent: "Accents",
};

export default function StageBubbleRail({
  bubbles,
  materialOverrides,
  excludedSlots,
  setMaterialOverrides,
  setExcludedSlots,
  activeSlot,
  setActiveSlot,
  activeMode,
  onOpenSelector,
  setActiveMode,
  t,
  variant,
  collectionSlots,
  onAddSlot,
  onSwatchTap,
  enabledOptionalSlots,
  addableCategories,
  onAddCategory,
}: StageBubbleRailProps) {
  // Subscribe to graph load — ensures addableSlots and handleAddSlot re-run once data is ready
  useGraphMaterials();

  const roleAltsCacheRef = useRef<Record<string, Array<{ materialId: string; image: string }>>>({});
  const [slotAlternatives, setSlotAlternatives] = useState<Array<{ materialId: string; image: string }>>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const materialOverridesRef = useRef(materialOverrides);
  materialOverridesRef.current = materialOverrides;

  // Invalidate role cache when materialOverrides gets a code from outside the rail
  useEffect(() => {
    for (const [slot, code] of Object.entries(materialOverrides)) {
      const role = SLOT_TO_ROLE[slot];
      if (!role) continue;
      const cached = roleAltsCacheRef.current[role];
      if (cached && !cached.some(alt => alt.materialId === code)) {
        delete roleAltsCacheRef.current[role];
      }
    }
  }, [materialOverrides]);

  useEffect(() => {
    // Close the add menu only when an alternatives panel opens (not when closing one)
    if (activeSlot) setShowAddMenu(false);
    if (!activeSlot) { setSlotAlternatives([]); return; }

    const role = SLOT_TO_ROLE[activeSlot] ?? SLOT_KEY_TO_ROLE[activeSlot as SlotKey];

    if (role && roleAltsCacheRef.current[role]) {
      setSlotAlternatives(roleAltsCacheRef.current[role]);
      return;
    }

    const overrides = materialOverridesRef.current;

    const flatlayCodes = [...new Set(
      Object.entries(overrides)
        .filter(([k, v]) => SLOT_TO_ROLE[k] === role && !!v)
        .map(([, v]) => v)
    )];

    const neededExtras = Math.max(0, 4 - flatlayCodes.length);
    const extraCodes = role
      ? getMaterialsByRole(role)
          .filter(m => !flatlayCodes.includes(m.technicalCode) && !!m.imageUrl)
          .sort((a, b) => getPairCountByCode(b.technicalCode) - getPairCountByCode(a.technicalCode))
          .slice(0, neededExtras)
          .map(m => m.technicalCode)
      : [];

    const candidates = [...flatlayCodes, ...extraCodes];
    const alternatives = candidates
      .map(code => {
        const img = getMaterialByCode(code)?.imageUrl ?? getArchetypeById(code)?.image;
        return img ? { materialId: code, image: img } : null;
      })
      .filter((x): x is { materialId: string; image: string } => x !== null);

    if (role) roleAltsCacheRef.current[role] = alternatives;
    setSlotAlternatives(alternatives);
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleBubbles = bubbles.filter(b => !excludedSlots.has(b.slotKey));
  const swatchBubbles = collectionSlots
    ? visibleBubbles.filter(b => collectionSlots.has(b.slotKey))
    : visibleBubbles;

  // Group swatchBubbles by effective material code so duplicate-material slots collapse into one swatch
  const groupedSwatches = (() => {
    const seen = new Map<string, { slotKeys: string[]; bubble: MaterialBubble }>();
    for (const bubble of swatchBubbles) {
      const code = materialOverrides[bubble.slotKey] || bubble.materialId;
      if (seen.has(code)) {
        seen.get(code)!.slotKeys.push(bubble.slotKey);
      } else {
        seen.set(code, { slotKeys: [bubble.slotKey], bubble });
      }
    }
    return [...seen.values()];
  })();

  // Derive the active group (for alternatives panel — updating all grouped slots together)
  const activeGroup = groupedSwatches.find(g => g.slotKeys.includes(activeSlot ?? ""));

  // Use externally-computed addable categories (same source as flatlay "+")
  const effectiveAddableCategories = addableCategories ?? [];

  // Nothing to show at all — no swatches and nothing to add
  if (groupedSwatches.length === 0 && effectiveAddableCategories.length === 0) return null;

  const bottomClass = "-bottom-[32px]";

  const handleAddSlot = (category: string) => {
    onAddCategory?.(category);
    setShowAddMenu(false);
  };

  return (
    <div
      className={`absolute inset-x-0 ${bottomClass} flex flex-col items-center gap-2`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Alternatives panel — shown above the rail when a swatch is active (not when onSwatchTap is provided) */}
      {!onSwatchTap && activeSlot && slotAlternatives.length > 0 && (() => {
        const currentCode = materialOverrides[activeSlot] || bubbles.find(b => b.slotKey === activeSlot)?.materialId;
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-black/50 backdrop-blur-xl"
               style={{ border: "0.5px solid rgba(255,255,255,0.25)" }}>
            <button
              onClick={() => setActiveSlot(null)}
              className="w-6 h-6 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            >
              <X className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
            </button>
            {slotAlternatives.map(alt => (
              <button
                key={alt.materialId}
                onClick={() => {
                  setMaterialOverrides(prev => {
                    const next = { ...prev };
                    for (const k of (activeGroup?.slotKeys ?? [activeSlot!])) next[k] = alt.materialId;
                    return next;
                  });
                  setActiveSlot(null);
                }}
                className="shrink-0 active:scale-90 transition-transform"
              >
                <img
                  src={alt.image}
                  alt={alt.materialId}
                  className={`w-12 h-9 rounded-xl object-cover ${alt.materialId === currentCode ? "ring-2 ring-white" : ""}`}
                />
              </button>
            ))}
          </div>
        );
      })()}

      {/* Add-surface menu — shown above the rail when "+" is tapped */}
      {showAddMenu && effectiveAddableCategories.length > 0 && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-black/50 backdrop-blur-xl"
          style={{ border: "0.5px solid rgba(255,255,255,0.25)" }}
        >
          <button
            onClick={() => setShowAddMenu(false)}
            className="w-6 h-6 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          >
            <X className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
          </button>
          {effectiveAddableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleAddSlot(cat)}
              className="text-[9px] tracking-wide uppercase text-white/80 font-medium px-2.5 py-1.5 rounded-full bg-white/15 active:scale-95 transition-transform whitespace-nowrap"
            >
              {t(`category.${cat}`) || CATEGORY_LABEL[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Main swatch row */}
      <div className="flex items-end gap-3 px-4">
        {groupedSwatches.map(({ slotKeys, bubble }) => {
          const representativeSlot = slotKeys[0];
          const overrideCode = materialOverrides[representativeSlot];
          const displayImage = overrideCode
            ? (getMaterialByCode(overrideCode)?.imageUrl ?? getArchetypeById(overrideCode)?.image ?? bubble.image)
            : bubble.image;
          const isActive = slotKeys.includes(activeSlot ?? "");

          return (
            <button
              key={representativeSlot}
              onClick={() => {
                if (onSwatchTap) {
                  onSwatchTap(representativeSlot);
                  return;
                }
                if (activeMode !== "palettes") {
                  onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes");
                }
                setActiveSlot(isActive ? null : representativeSlot);
              }}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <img
                src={displayImage}
                alt={bubble.slotLabel}
                className={`w-14 h-16 rounded-xl object-cover ${isActive ? "ring-2 ring-white" : ""}`}
              />
              <span className="w-14 text-center text-[8px] font-medium tracking-[0.15em] uppercase text-foreground/60 select-none truncate">
                {t(`surface.${representativeSlot}`) || bubble.slotLabel}
              </span>
            </button>
          );
        })}

        {/* "+" tile — only when there are categories left to add */}
        {effectiveAddableCategories.length > 0 && (
          <button
            onClick={() => { setActiveSlot(null); setShowAddMenu(v => !v); }}
            className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
          >
            <div
              className="w-14 h-16 rounded-xl flex items-center justify-center bg-white/30 backdrop-blur-md"
              style={{ border: "1.5px dashed rgba(0,0,0,0.2)" }}
            >
              <Plus className="w-5 h-5 text-foreground/40" strokeWidth={1.5} />
            </div>
            <span className="w-14 text-center text-[8px] font-medium tracking-[0.15em] uppercase text-foreground/60 select-none truncate">
              &nbsp;
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
