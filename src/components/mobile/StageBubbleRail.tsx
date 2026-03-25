import { X, ChevronDown, RotateCcw } from "lucide-react";
import { getMaterialById } from "@/data/materials";
import { getArchetypeById } from "@/data/archetypes";
import { getSlotAlternatives, type MaterialBubble } from "@/lib/collection-utils";
import type { CollectionV2 } from "@/data/collections/types";
import type { ControlMode } from "@/contexts/DesignContext";
import { useShowroom } from "@/contexts/ShowroomContext";

interface StageBubbleRailProps {
  collection: CollectionV2;
  bubbles: MaterialBubble[];
  roomNameRaw: string;
  materialOverrides: Record<string, string>;
  excludedSlots: Set<string>;
  setMaterialOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setExcludedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeSlot: string | null;
  setActiveSlot: (slot: string | null) => void;
  activeMode: ControlMode;
  onOpenSelector?: (mode: ControlMode) => void;
  setActiveMode: (mode: ControlMode) => void;
  hasMaterialChanges: boolean;
  handleSelectMaterial: (id: string | null) => void;
  selectedMaterial: string | null;
  t: (key: string) => string;
  language: string;
  /** "browsing" = !hasUserImage (bottom-12), "uploaded" = hasUserImage (bottom-20) */
  variant: "browsing" | "uploaded";
}

export default function StageBubbleRail({
  collection,
  bubbles,
  roomNameRaw,
  materialOverrides,
  excludedSlots,
  setMaterialOverrides,
  setExcludedSlots,
  activeSlot,
  setActiveSlot,
  activeMode,
  onOpenSelector,
  setActiveMode,
  hasMaterialChanges,
  handleSelectMaterial,
  selectedMaterial,
  t,
  language,
  variant,
}: StageBubbleRailProps) {
  const { activeShowroom } = useShowroom();
  const showroomFilter = activeShowroom
    ? { id: activeShowroom.id, surfaceCategories: activeShowroom.surfaceCategories }
    : undefined;

  if (bubbles.length === 0) return null;

  const bottomClass = variant === "browsing" ? "bottom-12" : "bottom-20";
  const containerClass = variant === "browsing"
    ? "absolute right-1.5 flex flex-col items-center w-10 opacity-90"
    : "absolute right-1.5 flex flex-col items-center max-w-[44px] opacity-100";

  const collectionName = collection.name[language as keyof typeof collection.name] ?? collection.name.en;

  return (
    <div className={`${containerClass} ${bottomClass}`}>
      {hasMaterialChanges ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (selectedMaterial) handleSelectMaterial(selectedMaterial);
          }}
          className={`${variant === "browsing" ? "w-full" : ""} py-1.5 flex justify-center active:scale-95 transition-all mb-1`}
        >
          <RotateCcw className="w-3 h-3 text-white/60" strokeWidth={2} />
        </button>
      ) : variant === "browsing" ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes");
          }}
          className="w-full py-1.5 text-[7px] tracking-wide uppercase font-medium text-white/60 active:scale-95 transition-all mb-1 text-center leading-tight break-words"
        >
          {collectionName}
        </button>
      ) : (
        <button
          onClick={() => { onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes"); }}
          className="active:scale-[0.97] transition-transform"
        >
          <span className="text-[7px] font-medium tracking-[0.2em] uppercase text-white/50 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] select-none mb-1 text-center leading-tight block">
            {collectionName}
          </span>
        </button>
      )}

      <div
        className="relative flex flex-col gap-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-xl shadow-lg"
        style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
      >
        {bubbles.map((bubble) => {
          const isExcluded = excludedSlots.has(bubble.slotKey);
          const overrideId = materialOverrides[bubble.slotKey];
          const overriddenImage = overrideId
            ? (getMaterialById(overrideId)?.image ?? getArchetypeById(overrideId)?.image ?? bubble.image)
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
                  className={`w-7 h-7 rounded-full object-cover ${variant === "browsing" && activeMode !== "palettes" ? "shadow-sm" : ""} ${isActive ? "ring-[1.5px] ring-white" : ""}`}
                />
                {isExcluded && (
                  <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
                )}
              </button>

              {/* Material swap rail */}
              {isActive && !isExcluded && (() => {
                const alternatives = getSlotAlternatives(collection.id, roomNameRaw, bubble.slotKey, showroomFilter);
                const currentMaterialId = materialOverrides[bubble.slotKey] || bubble.materialId;
                return (
                  <div
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2 flex items-center gap-1.5 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
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
  );
}
