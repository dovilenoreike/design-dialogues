import { useState, useEffect } from "react";
import { X, RotateCcw, Plus } from "lucide-react";
import { getMaterialByCode, getMaterialsByRole } from "@/hooks/useGraphMaterials";
import { getArchetypeById } from "@/data/archetypes";
import { SLOT_TO_ROLE, type MaterialBubble } from "@/lib/collection-utils";
import type { ControlMode } from "@/contexts/DesignContext";
import { useShowroom } from "@/contexts/ShowroomContext";

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
  hasMaterialChanges: boolean;
  t: (key: string) => string;
  language: string;
  /** "browsing" = !hasUserImage (bottom-12), "uploaded" = hasUserImage (bottom-20) */
  variant: "browsing" | "uploaded";
  getRecommendedCodes?: (currentCode: string | null, otherCodes: string[], targetRole?: string) => string[];
}

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
  hasMaterialChanges,
  t,
  language,
  variant,
  getRecommendedCodes,
}: StageBubbleRailProps) {
  const { activeShowroom } = useShowroom();
  const showroomFilter = activeShowroom
    ? { id: activeShowroom.id, surfaceCategories: activeShowroom.surfaceCategories }
    : undefined;

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem("bubble-rail-hint-seen"); } catch { return true; }
  });

  const dismissHint = () => {
    if (!showHint) return;
    try { localStorage.setItem("bubble-rail-hint-seen", "1"); } catch {}
    setShowHint(false);
  };

  useEffect(() => { setShowAddMenu(false); }, [activeSlot]);

  const visibleBubbles = bubbles.filter(b => !excludedSlots.has(b.slotKey));
  const hiddenBubbles  = bubbles.filter(b =>  excludedSlots.has(b.slotKey));

  if (bubbles.length === 0) return null;

  const bottomClass = variant === "browsing" ? "bottom-12" : "bottom-20";
  const containerClass = variant === "browsing"
    ? "absolute right-1.5 flex flex-col items-center w-10 opacity-90"
    : "absolute right-1.5 flex flex-col items-center max-w-[44px] opacity-100";

  return (
    <div className={`${containerClass} ${bottomClass}`}>
      {hasMaterialChanges && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMaterialOverrides({});
          }}
          className={`${variant === "browsing" ? "w-full" : ""} py-1.5 flex justify-center active:scale-95 transition-all mb-1`}
        >
          <RotateCcw className="w-3 h-3 text-white/60" strokeWidth={2} />
        </button>
      )}

      <div
        className="relative flex flex-col gap-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-xl shadow-lg"
        style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
      >
        {/* Hint label — fades out on first tap */}
        <div
          className={`absolute right-full top-0 flex items-center mr-2 pointer-events-none transition-opacity duration-300 ${showHint && !activeSlot ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
            <span className="text-[9px] font-medium text-black/70 whitespace-nowrap">
              {t("surface.personaliseHint")}
            </span>
            <span className="text-black/40 text-[9px]">→</span>
          </div>
        </div>

        {visibleBubbles.map((bubble) => {
          const overrideId = materialOverrides[bubble.slotKey];
          const overriddenImage = overrideId
            ? (getMaterialByCode(overrideId)?.imageUrl ?? getArchetypeById(overrideId)?.image ?? bubble.image)
            : bubble.image;
          const isActive = activeSlot === bubble.slotKey;

          return (
            <div key={bubble.slotKey} className="relative h-7">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissHint();
                  if (activeMode !== "palettes") {
                    onOpenSelector ? onOpenSelector("palettes") : setActiveMode("palettes");
                  }
                  setActiveSlot(isActive ? null : bubble.slotKey);
                }}
                className="block active:scale-95 transition-transform relative"
              >
                <img
                  src={overriddenImage}
                  alt={bubble.slotLabel}
                  title={bubble.slotLabel}
                  className={`w-7 h-7 rounded-full object-cover ${variant === "browsing" && activeMode !== "palettes" ? "shadow-sm" : ""} ${isActive ? "ring-[1.5px] ring-white" : ""}`}
                />
              </button>

              {/* Material swap rail */}
              {isActive && (() => {
                const slotRole = SLOT_TO_ROLE[bubble.slotKey];
                const otherCodes = visibleBubbles
                  .filter((b) => b.slotKey !== bubble.slotKey)
                  .map((b) => materialOverrides[b.slotKey] ?? b.materialId)
                  .filter(Boolean) as string[];
                const currentCode = materialOverrides[bubble.slotKey] || bubble.materialId;
                const graphCodes = (getRecommendedCodes && otherCodes.length > 0)
                  ? getRecommendedCodes(currentCode, otherCodes, slotRole).slice(0, 4)
                  : [];
                const fallbackAlternatives = (() => {
                  if (!slotRole) return [];
                  return getMaterialsByRole(slotRole)
                    .filter((m) => !!m.imageUrl && (!showroomFilter || m.showroomIds.includes(showroomFilter.id)))
                    .slice(0, 4)
                    .map((m) => ({
                      materialId: m.technicalCode,
                      image: m.imageUrl!,
                    }));
                })();
                const alternatives = graphCodes.length > 0
                  ? graphCodes
                      .map((code) => {
                        const img = getMaterialByCode(code)?.imageUrl;
                        const ids = getMaterialByCode(code)?.showroomIds ?? [];
                        return img ? { materialId: code, image: img, showroomIds: ids } : null;
                      })
                      .filter((m): m is NonNullable<typeof m> => m !== null)
                      .filter((m) => !showroomFilter || m.showroomIds.includes(showroomFilter.id))
                      .map(({ materialId, image }) => ({ materialId, image }))
                  : fallbackAlternatives;
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

        {hiddenBubbles.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddMenu(v => !v); }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 active:scale-90 transition-transform"
              style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
            >
              <Plus className="w-3.5 h-3.5 text-white/70" strokeWidth={2} />
            </button>

            {showAddMenu && (
              <div
                className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 flex items-center gap-1.5 backdrop-blur-xl bg-white/20 rounded-full px-2.5 py-1.5"
                style={{ border: '0.5px solid rgba(255,255,255,0.3)' }}
                onClick={e => e.stopPropagation()}
              >
                {hiddenBubbles.map(b => (
                  <button
                    key={b.slotKey}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExcludedSlots(prev => { const next = new Set(prev); next.delete(b.slotKey); return next; });
                      if (hiddenBubbles.length === 1) setShowAddMenu(false);
                    }}
                    className="text-[9px] tracking-wide uppercase text-white/80 font-medium px-2 py-1 rounded-full bg-white/10 active:scale-95 transition-transform whitespace-nowrap"
                  >
                    {t(`surface.${b.slotKey}`) || b.slotLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
