import { useCallback, useEffect, useRef, useState } from "react";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialSlotPicker, { type SlotKey, type SlotSelections } from "../controls/MaterialSlotPicker";
import { collectionsV2 } from "@/data/collections/collections-v2";
import Stage from "../Stage";
import ControlCenter from "../ControlCenter";
import { MaterialsSummary } from "../thread/summaries/MaterialsSummary";
import RoomTripletGrid from "../home/RoomTripletGrid";
import { RoomSwitchDialog } from "../dialogs/RoomSwitchDialog";
import { StyleSwitchDialog } from "../dialogs/StyleSwitchDialog";
import { UploadDialog } from "../dialogs/UploadDialog";
import { DesignNotificationSheet } from "@/components/DesignNotificationSheet";

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
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);

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
    const compatibleCollections = collectionsV2.filter((col) =>
      filledIds.every((id) => Object.values(col.pool).flat().includes(id))
    );

    // Switch collection only when the current one is no longer compatible
    if (compatibleCollections.length > 0) {
      const currentStillCompatible = compatibleCollections.some((c) => c.id === design.selectedMaterial);
      if (!currentStillCompatible) {
        internalPaletteChange.current = true;
        handleSelectMaterial(compatibleCollections[0].id);
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
    <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 relative">

      {/* Coming soon overlay — temporarily disabled for testing
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
        <p className="text-lg font-serif mb-1">{t("comingSoon.screenTitle")}</p>
        <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
          Čia galėsite vaizduoti savo erdves su pasirinktomis medžiagomis.
        </p>
        <button
          onClick={() => setNotificationSheetOpen(true)}
          className="mt-4 px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
        >
          {t("comingSoon.beNotifiedButton")}
        </button>
      </div>
      */}

      {/* Hero visualisation */}
      <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
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

      <DesignNotificationSheet
        isOpen={notificationSheetOpen}
        onClose={() => setNotificationSheetOpen(false)}
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
