import { useMemo, useState } from "react";
import { ComponentList, type SectionKind } from "@/components/kitchen-calculator/ComponentList";
import { HardwareGradeSelector } from "@/components/kitchen-calculator/HardwareGradeSelector";
import { KitchenSettingsPanel } from "@/components/kitchen-calculator/KitchenSettingsPanel";
import { LengthInput } from "@/components/kitchen-calculator/LengthInput";
import { MissingUnitsAlert } from "@/components/kitchen-calculator/MissingUnitsAlert";
import { RunLengthAlert } from "@/components/kitchen-calculator/RunLengthAlert";
import { TotalBar } from "@/components/kitchen-calculator/TotalBar";
import { Separator } from "@/components/ui/separator";
import {
  defaultSettings,
  generateKitchen,
  makeUnit,
  makeWallRun,
  mockHardwareDB,
  mockMaterialConfig,
  priceKitchen,
  retypeUnit,
  UNIT_LABELS,
  type CabinetUnit,
  type GlobalSettings,
  type HardwareGrade,
  type KitchenState,
  type UnitType,
} from "@/lib/kitchen-calculator";

const DEFAULT_ADD: Record<SectionKind, { type: UnitType; width: number }> = {
  base: { type: "storage", width: 600 },
  wall: { type: "wall", width: 600 },
  island: { type: "island", width: 1200 },
};

const STANDARD_WIDTHS = [300, 400, 500, 600, 800, 1000];
const MIN_STORAGE_WIDTH = 150; // mm — don't trim a storage cabinet below this

// A kitchen normally needs these three. (hobOven is the combined hob/oven unit;
// splitting it into a separate oven housing is a later phase.)
const ESSENTIAL_TYPES: UnitType[] = ["sink", "hobOven", "fridge"];

/**
 * Hidden kitchen-furniture price calculator (Phase 1).
 * Reachable only by direct URL (/kitchen-calculator) — not linked anywhere.
 * Self-contained: no AppShell / Header / Footer. Desktop-focused, English copy.
 */
const KitchenCalculator = () => {
  const [lengthInput, setLengthInput] = useState("3.6");
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [grade, setGrade] = useState<HardwareGrade>("mid");
  const [state, setState] = useState<KitchenState | null>(null);
  // Essentials the user has marked as out of scope (e.g. a standalone fridge).
  const [excludedEssentials, setExcludedEssentials] = useState<UnitType[]>([]);

  const handleGenerate = () => {
    const meters = Number(lengthInput);
    if (!Number.isFinite(meters) || meters <= 0) return;
    setState(generateKitchen(Math.round(meters * 1000), settings, grade));
    setExcludedEssentials([]);
  };

  // Apply a transform to whichever unit (across all lists) matches `id`.
  const mapUnit = (id: string, fn: (u: CabinetUnit) => CabinetUnit) => {
    setState((prev) => {
      if (!prev) return prev;
      const remap = (u: CabinetUnit) => (u.id === id ? fn(u) : u);
      return {
        ...prev,
        baseUnits: prev.baseUnits.map(remap),
        wallUnits: prev.wallUnits.map(remap),
        islandUnits: prev.islandUnits.map(remap),
      };
    });
  };

  const handleWidthChange = (id: string, width: number) =>
    mapUnit(id, (u) => ({ ...u, width, isCustomWidth: false }));

  const handleTypeChange = (id: string, type: UnitType) =>
    mapUnit(id, (u) => retypeUnit(u, type));

  const handleRemove = (id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const keep = (u: CabinetUnit) => u.id !== id;
      return {
        ...prev,
        baseUnits: prev.baseUnits.filter(keep),
        wallUnits: prev.wallUnits.filter(keep),
        islandUnits: prev.islandUnits.filter(keep),
      };
    });
  };

  const handleAdd = (section: SectionKind) => {
    setState((prev) => {
      if (!prev) return prev;
      const { type, width } = DEFAULT_ADD[section];
      const unit = makeUnit(type, width);
      if (section === "base") return { ...prev, baseUnits: [...prev.baseUnits, unit] };
      if (section === "wall") return { ...prev, wallUnits: [...prev.wallUnits, unit] };
      return { ...prev, islandUnits: [...prev.islandUnits, unit] };
    });
  };

  // Base + tall units form the floor run; it should equal the entered length.
  const runLengthMm = state
    ? state.baseUnits.reduce((sum, u) => sum + u.width, 0)
    : 0;

  // Fill an under-run by adding a storage cabinet sized to close the gap.
  const handleFillGap = (gapMm: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const unit = makeUnit("storage", gapMm, { isCustom: !STANDARD_WIDTHS.includes(gapMm) });
      return { ...prev, baseUnits: [...prev.baseUnits, unit] };
    });
  };

  // Overflow: the widest storage cabinet is the natural filler to shrink, since
  // narrow units are usually intentional (e.g. a spacer beside the hob).
  const overflowMm = state ? Math.max(runLengthMm - state.lengthMm, 0) : 0;
  const widestStorage = state
    ? state.baseUnits
        .filter((u) => u.type === "storage")
        .reduce<CabinetUnit | undefined>(
          (widest, u) => (!widest || u.width > widest.width ? u : widest),
          undefined,
        )
    : undefined;
  // Only offer the trim when one storage unit can absorb the whole overflow.
  const canTrimWidest =
    overflowMm > 0 && !!widestStorage && widestStorage.width - overflowMm >= MIN_STORAGE_WIDTH;

  const handleTrimWidest = () => {
    if (!widestStorage) return;
    const newWidth = widestStorage.width - overflowMm;
    mapUnit(widestStorage.id, (u) => ({
      ...u,
      width: newWidth,
      isCustomWidth: !STANDARD_WIDTHS.includes(newWidth),
    }));
  };

  // Completeness: essentials that are neither present nor marked out of scope.
  const missingEssentials = state
    ? ESSENTIAL_TYPES.filter(
        (t) => !state.baseUnits.some((u) => u.type === t) && !excludedEssentials.includes(t),
      )
    : [];

  const handleAddEssential = (type: UnitType) => {
    setState((prev) =>
      prev ? { ...prev, baseUnits: [...prev.baseUnits, makeUnit(type, 600)] } : prev,
    );
  };

  const handleExcludeEssential = (type: UnitType) => {
    setExcludedEssentials((prev) => (prev.includes(type) ? prev : [...prev, type]));
  };

  // Append wall units to fill the free span above the base cabinets.
  const handleFillWall = (spanMm: number) => {
    setState((prev) =>
      prev ? { ...prev, wallUnits: [...prev.wallUnits, ...makeWallRun(spanMm)] } : prev,
    );
  };

  // Live settings/grade override whatever was stored at generation time, so
  // changing either after Generate reprices immediately.
  const pricing = useMemo(() => {
    if (!state) return null;
    const liveState: KitchenState = { ...state, settings, grade };
    return priceKitchen(liveState, mockMaterialConfig, mockHardwareDB);
  }, [state, settings, grade]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Kitchen price calculator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a kitchen length to generate a standard component list and an estimated total.
            Prices are indicative (mocked) for this preview.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <LengthInput value={lengthInput} onChange={setLengthInput} onGenerate={handleGenerate} />
          <KitchenSettingsPanel settings={settings} onChange={setSettings} />
        </div>

        {state && pricing && (
          <>
            <Separator className="my-6" />
            <div className="mb-4">
              <HardwareGradeSelector value={grade} onChange={setGrade} />
            </div>

            {missingEssentials.length > 0 && (
              <div className="mb-4">
                <MissingUnitsAlert
                  missing={missingEssentials}
                  onAdd={handleAddEssential}
                  onExclude={handleExcludeEssential}
                />
              </div>
            )}

            {excludedEssentials.length > 0 && (
              <p className="mb-4 text-xs text-muted-foreground">
                Excluded from project:{" "}
                {excludedEssentials.map((t) => UNIT_LABELS[t].toLowerCase()).join(", ")}.{" "}
                <button
                  type="button"
                  onClick={() => setExcludedEssentials([])}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  undo
                </button>
              </p>
            )}

            {runLengthMm !== state.lengthMm && (
              <div className="mb-4">
                <RunLengthAlert
                  runLengthMm={runLengthMm}
                  kitchenLengthMm={state.lengthMm}
                  onFillGap={handleFillGap}
                  onTrimWidest={canTrimWidest ? handleTrimWidest : undefined}
                />
              </div>
            )}

            <ComponentList
              baseUnits={state.baseUnits}
              wallUnits={state.wallUnits}
              islandUnits={state.islandUnits}
              kitchenLengthMm={state.lengthMm}
              onTypeChange={handleTypeChange}
              onWidthChange={handleWidthChange}
              onRemove={handleRemove}
              onAdd={handleAdd}
              onFillWall={handleFillWall}
            />

            <div className="mt-6">
              <TotalBar total={pricing.total} />
            </div>
          </>
        )}

        {!state && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Enter a length and press Generate to begin.
          </p>
        )}
      </div>
    </div>
  );
};

export default KitchenCalculator;
