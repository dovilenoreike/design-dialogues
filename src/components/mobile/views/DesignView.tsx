import { useCallback, useEffect, useRef, useState } from "react";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialSlotPicker, { type SlotKey, type SlotSelections } from "../controls/MaterialSlotPicker";
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
  mainTiles: () => [],
  additionalTiles: () => [],
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
    materialOverrides,
  } = useDesign();
  const { t } = useLanguage();

  const scrollRef = useRef<HTMLDivElement>(null);
  // Prevents the palette→squares sync from firing when the slot picker itself changed the palette
  const internalPaletteChange = useRef(false);
  // Prevents the sync effect from overwriting null slots when the clear button is clicked
  const internalSlotClear = useRef(false);

  const [slotSelections, setSlotSelections] = useState<SlotSelections>({
    floor: null,
    mainFronts: null,
    worktops: null,
    additionalFronts: null,
    accents: null,
    mainTiles: null,
    additionalTiles: null,
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

  // Sync squares from palette + active overrides (covers bubble column changes, resets, and palette switches)
  useEffect(() => {
    if (internalPaletteChange.current) {
      internalPaletteChange.current = false;
      return;
    }
    if (internalSlotClear.current) {
      internalSlotClear.current = false;
      return;
    }
    const room = design.selectedCategory || "Kitchen";

    const newSelections: SlotSelections = {
      floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null,
    };
    // Only reflect user-made selections (overrides) — tray is empty by default
    for (const [paletteKey, materialId] of Object.entries(materialOverrides)) {
      const slotKey = paletteKeyToSlot(paletteKey, room);
      if (slotKey) newSelections[slotKey] = materialId;
    }
    setSlotSelections(newSelections);
  }, [design.selectedMaterial, design.selectedCategory, materialOverrides]);

  const handleOpenSelector = useCallback((mode: ControlMode) => {
    setActiveMode(mode);
  }, [setActiveMode]);

  const handleRoomSelect = useCallback((roomDisplayName: string) => {
    handleSelectCategory(roomDisplayName);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [handleSelectCategory]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      {/* Hero visualisation */}
      <div className="relative w-full" style={{ aspectRatio: "4/5" }}>
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
