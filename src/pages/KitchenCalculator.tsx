import { useMemo, useState } from "react";
import { ComponentList } from "@/components/kitchen-calculator/ComponentList";
import { HardwareGradeSelector } from "@/components/kitchen-calculator/HardwareGradeSelector";
import { KitchenSettingsPanel } from "@/components/kitchen-calculator/KitchenSettingsPanel";
import { KitchenSetup } from "@/components/kitchen-calculator/KitchenSetup";
import { MissingUnitsAlert } from "@/components/kitchen-calculator/MissingUnitsAlert";
import { TotalBar } from "@/components/kitchen-calculator/TotalBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  defaultSettings,
  generateKitchen,
  makeRun,
  makeUnit,
  makeWallRun,
  mockHardwareDB,
  mockMaterialConfig,
  nextRunLabel,
  priceKitchen,
  retypeUnit,
  UNIT_LABELS,
  type CabinetUnit,
  type GlobalSettings,
  type HardwareGrade,
  type KitchenLayout,
  type KitchenState,
  type Run,
  type UnitType,
} from "@/lib/kitchen-calculator";

const STANDARD_WIDTHS = [300, 400, 500, 600, 800, 1000];
const ADDED_RUN_LENGTH = 2400; // mm, default length for a manually added run

// Sensible per-layout seed lengths (metres) so the explorer can just hit Generate
// and a maker overwrites with real measurements.
const DEFAULT_LEG_LENGTHS: Record<KitchenLayout, string[]> = {
  line: ["3.6"],
  l: ["3.6", "2.4"],
  u: ["3.6", "2.4", "2.4"],
  galley: ["3.6", "3.0"],
};

// A kitchen normally needs these three. (hobOven is the combined hob/oven unit;
// splitting it into a separate oven housing is a later phase.)
const ESSENTIAL_TYPES: UnitType[] = ["sink", "hobOven", "fridge"];

const isCustom = (width: number): boolean => !STANDARD_WIDTHS.includes(width);

/**
 * Hidden kitchen-furniture price calculator (Phase 1).
 * Reachable only by direct URL (/kitchen-calculator) — not linked anywhere.
 * Self-contained: no AppShell / Header / Footer. Desktop-focused, English copy.
 */
const KitchenCalculator = () => {
  const [layout, setLayout] = useState<KitchenLayout>("line");
  const [legLengths, setLegLengths] = useState<string[]>(DEFAULT_LEG_LENGTHS.line);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [grade, setGrade] = useState<HardwareGrade>("mid");
  const [state, setState] = useState<KitchenState | null>(null);
  // Essentials the user has marked as out of scope (e.g. a standalone fridge).
  const [excludedEssentials, setExcludedEssentials] = useState<UnitType[]>([]);
  // True once the generated kitchen has been manually changed — gates the
  // "discard your changes?" confirmation on destructive actions.
  const [hasEdits, setHasEdits] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    { type: "layout"; layout: KitchenLayout } | { type: "fresh" } | null
  >(null);

  const applyLayout = (next: KitchenLayout) => {
    setLayout(next);
    const defaults = DEFAULT_LEG_LENGTHS[next];

    if (!state) {
      // Pre-generation: keep any lengths already typed, default the rest.
      setLegLengths((prev) => defaults.map((d, i) => prev[i] ?? d));
      return;
    }

    // Post-generation: a shape change regenerates. Carry over existing leg
    // lengths where legs overlap; default any new legs.
    const mm = defaults.map((d, i) => state.runs[i]?.lengthMm ?? Math.round(Number(d) * 1000));
    setLegLengths(mm.map((v) => String(v / 1000)));
    setState(generateKitchen(next, mm, settings, grade));
    setExcludedEssentials([]);
    setHasEdits(false);
  };

  const handleLayoutChange = (next: KitchenLayout) => {
    if (next === layout) return;
    // Only prompt when the user actually has cabinet edits to lose.
    if (state && hasEdits) {
      setConfirmAction({ type: "layout", layout: next });
      return;
    }
    applyLayout(next);
  };

  const doStartFresh = () => {
    setState(null);
    setExcludedEssentials([]);
    setHasEdits(false);
    setLegLengths(DEFAULT_LEG_LENGTHS[layout]);
  };

  const handleStartFresh = () => {
    if (hasEdits) setConfirmAction({ type: "fresh" });
    else doStartFresh();
  };

  const handleConfirm = () => {
    if (confirmAction?.type === "layout") applyLayout(confirmAction.layout);
    else if (confirmAction?.type === "fresh") doStartFresh();
    setConfirmAction(null);
  };

  const handleLegLengthChange = (index: number, value: string) => {
    setLegLengths((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleGenerate = () => {
    const mm = legLengths.map((s) => Math.round(Number(s) * 1000));
    if (mm.length === 0 || mm.some((v) => !Number.isFinite(v) || v <= 0)) return;
    setState(generateKitchen(layout, mm, settings, grade));
    setExcludedEssentials([]);
    setHasEdits(false);
  };

  // --- run + unit mutation helpers ----------------------------------------

  const updateRun = (runId: string, fn: (run: Run) => Run) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, runs: prev.runs.map((r) => (r.id === runId ? fn(r) : r)) } : prev,
    );
  };

  const mapRunUnit = (runId: string, unitId: string, fn: (u: CabinetUnit) => CabinetUnit) => {
    updateRun(runId, (r) => ({
      ...r,
      baseUnits: r.baseUnits.map((u) => (u.id === unitId ? fn(u) : u)),
      wallUnits: r.wallUnits.map((u) => (u.id === unitId ? fn(u) : u)),
    }));
  };

  const handleTypeChange = (runId: string, unitId: string, type: UnitType) =>
    mapRunUnit(runId, unitId, (u) => retypeUnit(u, type));

  const handleWidthChange = (runId: string, unitId: string, width: number) =>
    mapRunUnit(runId, unitId, (u) => ({ ...u, width, isCustomWidth: isCustom(width) }));

  const handleRemoveUnit = (runId: string, unitId: string) =>
    updateRun(runId, (r) => ({
      ...r,
      baseUnits: r.baseUnits.filter((u) => u.id !== unitId),
      wallUnits: r.wallUnits.filter((u) => u.id !== unitId),
    }));

  const handleAddBase = (runId: string) =>
    updateRun(runId, (r) => ({ ...r, baseUnits: [...r.baseUnits, makeUnit("storage", 600)] }));

  const handleAddWall = (runId: string) =>
    updateRun(runId, (r) => ({ ...r, wallUnits: [...r.wallUnits, makeUnit("wall", 600)] }));

  const handleFillGap = (runId: string, gapMm: number) =>
    updateRun(runId, (r) => ({
      ...r,
      baseUnits: [...r.baseUnits, makeUnit("storage", gapMm, { isCustom: isCustom(gapMm) })],
    }));

  const handleFillWall = (runId: string, spanMm: number) =>
    updateRun(runId, (r) => ({ ...r, wallUnits: [...r.wallUnits, ...makeWallRun(spanMm)] }));

  const handleRunLengthChange = (runId: string, mm: number) =>
    updateRun(runId, (r) => ({ ...r, lengthMm: mm }));

  const handleRemoveRun = (runId: string) => {
    setHasEdits(true);
    setState((prev) =>
      prev && prev.runs.length > 1
        ? { ...prev, runs: prev.runs.filter((r) => r.id !== runId) }
        : prev,
    );
  };

  const handleAddRun = () => {
    setHasEdits(true);
    setState((prev) =>
      prev
        ? { ...prev, runs: [...prev.runs, makeRun(nextRunLabel(prev.runs.length), ADDED_RUN_LENGTH)] }
        : prev,
    );
  };

  // --- island handlers (not run-scoped) -----------------------------------

  const mapIsland = (unitId: string, fn: (u: CabinetUnit) => CabinetUnit) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, islandUnits: prev.islandUnits.map((u) => (u.id === unitId ? fn(u) : u)) } : prev,
    );
  };

  const handleIslandTypeChange = (unitId: string, type: UnitType) =>
    mapIsland(unitId, (u) => retypeUnit(u, type));
  const handleIslandWidthChange = (unitId: string, width: number) =>
    mapIsland(unitId, (u) => ({ ...u, width, isCustomWidth: isCustom(width) }));
  const handleIslandRemove = (unitId: string) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, islandUnits: prev.islandUnits.filter((u) => u.id !== unitId) } : prev,
    );
  };
  const handleIslandAdd = () => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, islandUnits: [...prev.islandUnits, makeUnit("island", 1200)] } : prev,
    );
  };

  // --- completeness (aggregate across all runs) ---------------------------

  const missingEssentials = state
    ? ESSENTIAL_TYPES.filter(
        (t) =>
          !state.runs.some((r) => r.baseUnits.some((u) => u.type === t)) &&
          !excludedEssentials.includes(t),
      )
    : [];

  const handleAddEssential = (type: UnitType) => {
    setHasEdits(true);
    setState((prev) =>
      prev && prev.runs.length > 0
        ? {
            ...prev,
            runs: prev.runs.map((r, i) =>
              i === 0 ? { ...r, baseUnits: [...r.baseUnits, makeUnit(type, 600)] } : r,
            ),
          }
        : prev,
    );
  };

  const handleExcludeEssential = (type: UnitType) =>
    setExcludedEssentials((prev) => (prev.includes(type) ? prev : [...prev, type]));

  // Live settings/grade override whatever was stored at generation time.
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
            Pick a layout and enter each leg&apos;s length to generate a component list and an
            estimated total. Prices are indicative (mocked) for this preview.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <KitchenSetup
            layout={layout}
            legLengths={legLengths}
            generated={state !== null}
            onLayoutChange={handleLayoutChange}
            onLegLengthChange={handleLegLengthChange}
            onGenerate={handleGenerate}
            onStartFresh={handleStartFresh}
          />
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

            <ComponentList
              runs={state.runs}
              islandUnits={state.islandUnits}
              onRunLengthChange={handleRunLengthChange}
              onRemoveRun={handleRemoveRun}
              onTypeChange={handleTypeChange}
              onWidthChange={handleWidthChange}
              onRemoveUnit={handleRemoveUnit}
              onAddBase={handleAddBase}
              onAddWall={handleAddWall}
              onFillGap={handleFillGap}
              onFillWall={handleFillWall}
              onAddRun={handleAddRun}
              onIslandTypeChange={handleIslandTypeChange}
              onIslandWidthChange={handleIslandWidthChange}
              onIslandRemove={handleIslandRemove}
              onIslandAdd={handleIslandAdd}
            />

            <div className="mt-6">
              <TotalBar total={pricing.total} />
            </div>
          </>
        )}

        {!state && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Choose a layout, enter the lengths and press Generate to begin.
          </p>
        )}
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "fresh" ? "Start fresh?" : "Switch layout?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "fresh"
                ? "This clears the current kitchen and returns to the setup screen. This can't be undone."
                : "This rebuilds the kitchen and discards the cabinet changes you've made. Leg lengths are kept where they still apply."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmAction?.type === "fresh" ? "Start fresh" : "Switch layout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KitchenCalculator;
