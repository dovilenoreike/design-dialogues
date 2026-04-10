import { useCallback, useEffect, useRef, useState } from "react";
import { useDesign } from "@/contexts/DesignContext";
import MaterialSlotPicker, { type SlotKey, type SlotSelections } from "../controls/MaterialSlotPicker";
import Stage from "../Stage";
import { MaterialsSummary } from "../thread/summaries/MaterialsSummary";
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
    confirmImageUpload,
    cancelImageUpload,
    setMaterialOverrides,
    materialOverrides,
  } = useDesign();

  const scrollRef = useRef<HTMLDivElement>(null);

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

    setMaterialOverrides((prev) => {
      const next = { ...prev };
      ALL_PICKER_PALETTE_KEYS.forEach((k) => delete next[k]);
      Object.assign(next, newOverrides);
      return next;
    });
  }, [slotSelections, design.selectedCategory, setMaterialOverrides]);

  // Sync squares from palette + active overrides (covers bubble column changes, resets, and palette switches)
  useEffect(() => {
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
  }, [design.selectedCategory, materialOverrides]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">

      <div className="px-4 pt-4 pb-6 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-10">

        <div className="lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center">

          {/* LEFT: canvas */}
          <div>
            <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "1/1" }}>
              <Stage />
            </div>
          </div>

          {/* RIGHT: MaterialsSummary */}
          <div className="mt-4 lg:mt-0">
            <div className="lg:max-w-[400px] lg:mx-auto">
              <MaterialsSummary />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom padding (mobile only) */}
      <div className="h-4 md:hidden" />

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
        lockedCollectionId={undefined}
      />
    </div>
  );
}
