import { useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { ComponentList } from "@/components/kitchen-calculator/ComponentList";
import { HardwareGradeSelector } from "@/components/kitchen-calculator/HardwareGradeSelector";
import { KitchenSettingsPanel } from "@/components/kitchen-calculator/KitchenSettingsPanel";
import { KitchenSetup } from "@/components/kitchen-calculator/KitchenSetup";
import { MaterialsHeader } from "@/components/kitchen-calculator/MaterialsHeader";
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
  ESSENTIAL_TYPES,
  generateKitchen,
  makeExtraCost,
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
  type ExtraCost,
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

const isCustom = (width: number): boolean => !STANDARD_WIDTHS.includes(width);

// Sensible starting width when adding a unit by type (corners/islands are wider).
const ADD_WIDTHS: Partial<Record<UnitType, number>> = {
  cornerBase: 900,
  cornerWall: 900,
  island: 1200,
};
const addWidth = (type: UnitType): number => ADD_WIDTHS[type] ?? 600;

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

  const handleQuantityChange = (runId: string, unitId: string, quantity: number) =>
    mapRunUnit(runId, unitId, (u) => ({ ...u, quantity: Math.max(1, Math.round(quantity)) }));

  const handleRemoveUnit = (runId: string, unitId: string) =>
    updateRun(runId, (r) => ({
      ...r,
      baseUnits: r.baseUnits.filter((u) => u.id !== unitId),
      wallUnits: r.wallUnits.filter((u) => u.id !== unitId),
    }));

  const handleAddBase = (runId: string, type: UnitType) =>
    updateRun(runId, (r) => ({
      ...r,
      baseUnits: [...r.baseUnits, makeUnit(type, addWidth(type))],
    }));

  const handleAddWall = (runId: string, type: UnitType) =>
    updateRun(runId, (r) => ({
      ...r,
      wallUnits: [...r.wallUnits, makeUnit(type, addWidth(type))],
    }));

  const handleFillGap = (runId: string, gapMm: number) =>
    updateRun(runId, (r) => ({
      ...r,
      baseUnits: [...r.baseUnits, makeUnit("storage", gapMm, { isCustom: isCustom(gapMm) })],
    }));

  const handleFillWall = (runId: string, spanMm: number) =>
    updateRun(runId, (r) => ({ ...r, wallUnits: [...r.wallUnits, ...makeWallRun(spanMm)] }));

  const handleRunLengthChange = (runId: string, mm: number) =>
    updateRun(runId, (r) => ({ ...r, lengthMm: mm }));

  // Reorder units within a section so the list mirrors the physical run order.
  const reorderById = (list: CabinetUnit[], activeId: string, overId: string): CabinetUnit[] => {
    const from = list.findIndex((u) => u.id === activeId);
    const to = list.findIndex((u) => u.id === overId);
    return from < 0 || to < 0 || from === to ? list : arrayMove(list, from, to);
  };

  const handleReorderBase = (runId: string, activeId: string, overId: string) =>
    updateRun(runId, (r) => ({ ...r, baseUnits: reorderById(r.baseUnits, activeId, overId) }));

  const handleReorderWall = (runId: string, activeId: string, overId: string) =>
    updateRun(runId, (r) => ({ ...r, wallUnits: reorderById(r.wallUnits, activeId, overId) }));

  const handleWorktopToggle = (runId: string, value: boolean) =>
    updateRun(runId, (r) => ({ ...r, worktop: value }));
  const handleWorktopLengthChange = (runId: string, mm: number) =>
    updateRun(runId, (r) => ({ ...r, worktopLengthMm: mm }));
  const handleWorktopLengthReset = (runId: string) =>
    updateRun(runId, (r) => ({ ...r, worktopLengthMm: null }));
  const handleBacksplashChange = (runId: string, value: boolean) =>
    updateRun(runId, (r) => ({ ...r, backsplash: value }));

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
  const handleIslandQuantityChange = (unitId: string, quantity: number) =>
    mapIsland(unitId, (u) => ({ ...u, quantity: Math.max(1, Math.round(quantity)) }));
  const handleIslandRemove = (unitId: string) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, islandUnits: prev.islandUnits.filter((u) => u.id !== unitId) } : prev,
    );
  };
  const handleIslandAdd = (type: UnitType) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, islandUnits: [...prev.islandUnits, makeUnit(type, addWidth(type))] } : prev,
    );
  };
  const handleIslandReorder = (activeId: string, overId: string) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, islandUnits: reorderById(prev.islandUnits, activeId, overId) } : prev,
    );
  };

  // --- additional costs ---------------------------------------------------

  const mapExtra = (id: string, fn: (c: ExtraCost) => ExtraCost) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, extraCosts: prev.extraCosts.map((c) => (c.id === id ? fn(c) : c)) } : prev,
    );
  };
  const handleExtraLabelChange = (id: string, label: string) =>
    mapExtra(id, (c) => ({ ...c, label }));
  // Typing an amount overrides an auto (%) line.
  const handleExtraAmountChange = (id: string, amount: number) =>
    mapExtra(id, (c) => ({ ...c, amount, auto: false }));
  const handleExtraResetAuto = (id: string) => mapExtra(id, (c) => ({ ...c, auto: true }));
  const handleExtraRemove = (id: string) => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, extraCosts: prev.extraCosts.filter((c) => c.id !== id) } : prev,
    );
  };
  const handleExtraAdd = (label = "") => {
    setHasEdits(true);
    setState((prev) =>
      prev ? { ...prev, extraCosts: [...prev.extraCosts, makeExtraCost(label)] } : prev,
    );
  };

  // --- completeness (aggregate across all runs) ---------------------------

  const presentEssentials = state
    ? ESSENTIAL_TYPES.filter((t) => state.runs.some((r) => r.baseUnits.some((u) => u.type === t)))
    : [];

  const missingEssentials = state
    ? ESSENTIAL_TYPES.filter(
        (t) => !presentEssentials.includes(t) && !excludedEssentials.includes(t),
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
        <header className="mb-8">
          <h1 className="font-serif text-3xl">Kitchen price calculator</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a layout and enter each leg&apos;s length to generate a component list and an
            estimated total. Prices are indicative (mocked) for this preview.
          </p>
        </header>

        <div className="mb-6">
          <MaterialsHeader />
        </div>

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
              extraCosts={state.extraCosts ?? []}
              furnitureSubtotal={
                pricing.unitsTotal + pricing.worktop + pricing.islandWorktop + pricing.extras
              }
              presentEssentials={presentEssentials}
              onRunLengthChange={handleRunLengthChange}
              onRemoveRun={handleRemoveRun}
              onTypeChange={handleTypeChange}
              onWidthChange={handleWidthChange}
              onQuantityChange={handleQuantityChange}
              onRemoveUnit={handleRemoveUnit}
              onAddBase={handleAddBase}
              onAddWall={handleAddWall}
              onFillGap={handleFillGap}
              onFillWall={handleFillWall}
              onReorderBase={handleReorderBase}
              onReorderWall={handleReorderWall}
              onWorktopToggle={handleWorktopToggle}
              onWorktopLengthChange={handleWorktopLengthChange}
              onWorktopLengthReset={handleWorktopLengthReset}
              onBacksplashChange={handleBacksplashChange}
              onAddRun={handleAddRun}
              onIslandTypeChange={handleIslandTypeChange}
              onIslandWidthChange={handleIslandWidthChange}
              onIslandQuantityChange={handleIslandQuantityChange}
              onIslandRemove={handleIslandRemove}
              onIslandAdd={handleIslandAdd}
              onIslandReorder={handleIslandReorder}
              onExtraLabelChange={handleExtraLabelChange}
              onExtraAmountChange={handleExtraAmountChange}
              onExtraResetAuto={handleExtraResetAuto}
              onExtraRemove={handleExtraRemove}
              onExtraAdd={handleExtraAdd}
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
