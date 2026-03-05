import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Plus } from "lucide-react";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialSlotPicker, { type SlotKey, type SlotSelections } from "../controls/MaterialSlotPicker";
import { getMaterialById } from "@/data/materials";
import { collections } from "@/data/collections";
import { palettesV2 } from "@/data/palettes/palettes-v2";
import Stage from "../Stage";
import ControlCenter from "../ControlCenter";
import { MaterialsSummary } from "../thread/summaries/MaterialsSummary";
import RoomTripletGrid from "../home/RoomTripletGrid";
import HomeBudgetSection from "../home/HomeBudgetSection";
import HomeAuditSection from "../home/HomeAuditSection";
import HomeRoadmapSection from "../home/HomeRoadmapSection";
import { RoomSwitchDialog } from "../dialogs/RoomSwitchDialog";
import { StyleSwitchDialog } from "../dialogs/StyleSwitchDialog";
import { UploadDialog } from "../dialogs/UploadDialog";

// Maps each slot picker key to the palette slot keys it controls, per room
const SLOT_TO_PALETTE_KEYS: Record<SlotKey, (room: string) => string[]> = {
  floor: () => ["floor"],
  mainFronts: (room) => {
    if (room === "Living Room") return ["cabinetFurniture"];
    if (room === "Bedroom") return ["wardrobes"];
    if (room === "Bathroom") return ["vanityUnit"];
    return ["bottomCabinets"]; // Kitchen default
  },
  worktops: () => ["worktops"],
  additionalFronts: (room) => (room === "Kitchen" ? ["topCabinets"] : ["shelves"]),
  accents: (room) => (room === "Kitchen" ? ["shelves"] : []),
};

// All palette slot keys that the slot picker can ever set — used for clear
const ALL_PICKER_PALETTE_KEYS = new Set([
  "floor", "bottomCabinets", "topCabinets", "shelves", "worktops",
  "cabinetFurniture", "wardrobes", "vanityUnit",
]);

// Reverse: palette slot key → SlotKey, room-aware
function paletteKeyToSlot(paletteKey: string, room: string): SlotKey | null {
  switch (paletteKey) {
    case "floor": return "floor";
    case "worktops": return "worktops";
    case "bottomCabinets": return room === "Kitchen" ? "mainFronts" : null;
    case "cabinetFurniture": return room === "Living Room" ? "mainFronts" : null;
    case "wardrobes": return room === "Bedroom" ? "mainFronts" : null;
    case "vanityUnit": return room === "Bathroom" ? "mainFronts" : null;
    case "topCabinets": return room === "Kitchen" ? "additionalFronts" : null;
    case "shelves": return room === "Kitchen" ? "accents" : "additionalFronts";
    default: return null;
  }
}

const ROOM_TO_TYPE: Record<string, string> = {
  Kitchen: "kitchen",
  "Living Room": "livingRoom",
  Bedroom: "bedroom",
  Bathroom: "bathroom",
};

export default function DesignView() {
  const {
    design,
    generation,
    activeMode,
    setActiveMode,
    handleSelectCategory,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    confirmImageUpload,
    cancelImageUpload,
    setMaterialOverrides,
    handleSelectMaterial,
  } = useDesign();
  const { t } = useLanguage();

  const scrollRef = useRef<HTMLDivElement>(null);
  // Prevents the palette→squares sync from firing when the slot picker itself changed the palette
  const internalPaletteChange = useRef(false);

  const [slotSelections, setSlotSelections] = useState<SlotSelections>({
    floor: null,
    mainFronts: null,
    worktops: null,
    additionalFronts: null,
    accents: null,
  });
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);

  const handleSlotSelect = useCallback((slotKey: SlotKey, materialId: string) => {
    const newSelections = { ...slotSelections, [slotKey]: materialId };
    setSlotSelections(newSelections);

    const room = design.selectedCategory || "Kitchen";

    // Build palette overrides from ALL filled slots (including the new one)
    const newOverrides: Record<string, string> = {};
    (Object.keys(newSelections) as SlotKey[]).forEach((k) => {
      const id = newSelections[k];
      if (id) SLOT_TO_PALETTE_KEYS[k](room).forEach((pk) => { newOverrides[pk] = id; });
    });

    // Find collections compatible with every filled slot
    const filledIds = Object.values(newSelections).filter((id): id is string => id !== null);
    const compatibleCollections = collections.filter((col) =>
      filledIds.every((id) => Object.values(col.pool).flat().includes(id))
    );

    // Switch palette only when the current collection is no longer compatible
    if (compatibleCollections.length > 0) {
      const currentPv2 = palettesV2.find((p) => p.id === design.selectedMaterial);
      const currentStillCompatible = currentPv2 &&
        compatibleCollections.some((c) => c.id === currentPv2.collectionId);
      if (!currentStillCompatible) {
        const firstPalette = palettesV2.find((p) => p.collectionId === compatibleCollections[0].id);
        if (firstPalette) {
          internalPaletteChange.current = true;
          handleSelectMaterial(firstPalette.id); // internally clears overrides
        }
      }
    }

    // Apply overrides — runs after handleSelectMaterial's clear due to React 18 batching
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      ALL_PICKER_PALETTE_KEYS.forEach((k) => delete next[k]);
      Object.assign(next, newOverrides);
      return next;
    });
  }, [slotSelections, design.selectedCategory, design.selectedMaterial, setMaterialOverrides, handleSelectMaterial]);

  const handleClearSlots = useCallback(() => {
    setSlotSelections({ floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      ALL_PICKER_PALETTE_KEYS.forEach((k) => { delete next[k]; });
      return next;
    });
  }, [setMaterialOverrides]);

  // Sync squares from palette when user picks a collection externally (carousel, etc.)
  useEffect(() => {
    if (internalPaletteChange.current) {
      internalPaletteChange.current = false;
      return;
    }
    const room = design.selectedCategory || "Kitchen";
    const roomType = ROOM_TO_TYPE[room];
    const pv2 = palettesV2.find((p) => p.id === design.selectedMaterial);
    const slots = pv2?.selections[roomType as keyof typeof pv2.selections];

    const newSelections: SlotSelections = {
      floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null,
    };
    if (slots) {
      for (const [paletteKey, materialId] of Object.entries(slots)) {
        const slotKey = paletteKeyToSlot(paletteKey, room);
        if (slotKey) newSelections[slotKey] = materialId as string;
      }
    }
    setSlotSelections(newSelections);
  }, [design.selectedMaterial, design.selectedCategory]);

  const handleOpenSelector = useCallback((mode: ControlMode) => {
    setActiveMode(mode);
  }, [setActiveMode]);

  const handleRoomSelect = useCallback((roomDisplayName: string) => {
    handleSelectCategory(roomDisplayName);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [handleSelectCategory]);

  const roomKey = design.selectedCategory || "Kitchen";
  const hasUserImage = !!(design.uploadedImages[roomKey] || generation.generatedImages[roomKey]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      {/* Material slot pickers — Technical Spec Tray */}
      <div className="flex justify-center px-4 pt-4 pb-0">
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden">
          {/* Slot squares row — no individual labels */}
          <div className="flex items-center justify-center gap-3 px-3 pt-3 pb-2">
            {(["floor", "mainFronts", "additionalFronts", "worktops", "accents"] as const).map((key) => {
              const selectedId = slotSelections[key];
              const material = selectedId ? getMaterialById(selectedId) : null;
              return (
                <button
                  key={key}
                  onClick={() => setOpenSlot(key)}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-neutral-200 active:scale-95 transition-transform shrink-0 flex items-center justify-center"
                >
                  {material ? (
                    <img
                      src={material.image}
                      alt={material.displayName.en}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-4 h-4 text-neutral-300" strokeWidth={1.5} />
                  )}
                </button>
              );
            })}

            {/* Reset — icon only */}
            <button
              onClick={handleClearSlots}
              disabled={!Object.values(slotSelections).some(Boolean)}
              className="w-6 h-12 flex items-center justify-center active:scale-95 transition-all disabled:opacity-20 enabled:opacity-50 enabled:hover:opacity-90 ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1} />
            </button>
          </div>

          {/* Single shared label row */}
          <p className="text-center text-[8px] uppercase tracking-[0.25em] text-neutral-700 pb-3">
            {[t("surface.floor"), t("surface.fronts"), t("surface.worktops"), t("surface.accents")].join(" · ")}
          </p>
        </div>
      </div>

      {/* Hero visualisation — 16px breathing room below tray */}
      <div className="relative aspect-square w-full mt-4">
        <Stage onOpenSelector={handleOpenSelector} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="flex items-center gap-0.5 px-1 py-1 rounded-full bg-neutral-900 shadow-lg">
            {(["rooms", "styles", "palettes"] as ControlMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase transition-all active:scale-95 ${
                  activeMode === mode ? "bg-white/15 text-white font-semibold" : "text-neutral-400 font-medium"
                }`}
              >
                {t(`modes.${mode}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline control center with carousels */}
      <ControlCenter />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Materials summary */}
      <MaterialsSummary />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Other rooms grid */}
      <RoomTripletGrid onRoomSelect={handleRoomSelect} />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Budget estimate */}
      <HomeBudgetSection />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Layout audit */}
      <HomeAuditSection />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Roadmap */}
      <HomeRoadmapSection />

      {/* Bottom padding for safe area */}
      <div className="h-4" />

      {/* Room switch confirmation dialog */}
      <RoomSwitchDialog
        open={generation.showRoomSwitchDialog}
        currentRoom={design.selectedCategory || ""}
        onSaveAndSwitch={() => confirmRoomSwitch(true)}
        onSwitch={() => confirmRoomSwitch(false)}
        onCancel={cancelRoomSwitch}
      />

      {/* Style switch confirmation dialog */}
      <StyleSwitchDialog
        open={generation.showStyleSwitchDialog}
        currentStyle={design.selectedStyle || ""}
        onSaveAndSwitch={() => confirmStyleSwitch(true)}
        onSwitch={() => confirmStyleSwitch(false)}
        onCancel={cancelStyleSwitch}
      />

      {/* Upload confirmation dialog */}
      <UploadDialog
        open={generation.showUploadDialog}
        onConfirm={confirmImageUpload}
        onCancel={cancelImageUpload}
      />

      {/* Material slot picker sheet */}
      <MaterialSlotPicker
        slot={openSlot}
        selections={slotSelections}
        onSelect={handleSlotSelect}
        onClose={() => setOpenSlot(null)}
      />
    </div>
  );
}
