import {
  effectiveRunFor,
  type AssignableFixture,
  type KitchenLayout,
  type ProjectAppliance,
  type RunAssignment,
  type RunTarget,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { IslandGlyph } from "./IslandGlyph";
import { LayoutLegGlyph } from "./LayoutLegGlyph";

interface ApplianceRunAssignmentProps {
  layout: KitchenLayout;
  runCount: number;
  /** Whether the kitchen has an island — offered as an extra destination. */
  hasIsland: boolean;
  /** The declared appliance set (drives which rows appear). */
  selected: Set<ProjectAppliance>;
  assignments: RunAssignment;
  onChange: (key: AssignableFixture, target: RunTarget) => void;
}

interface Row {
  key: AssignableFixture;
  /** Glyph to draw — a hob+oven row still reads as the hob symbol. */
  glyph: AssignableFixture;
  label: string;
  /** Locked rows follow another fixture's run (oven/hood ride the hob). */
  lockedNote?: string;
}

const SAGE = "#647d75";

/**
 * "Which wall?" — assigns the sink and each placed appliance to a run before
 * generation, so the maker spreads the work core across legs instead of piling
 * it all on Run A. Only shown for multi-run layouts (a Line has nowhere to
 * spread). Oven and hood ride the hob's wall and so are shown locked.
 */
export function ApplianceRunAssignment({
  layout,
  runCount,
  hasIsland,
  selected,
  assignments,
  onChange,
}: ApplianceRunAssignmentProps) {
  // Nothing to assign unless there are at least two destinations (runs + island).
  if (runCount < 2 && !hasIsland) return null;

  const rows: Row[] = [{ key: "sink", glyph: "sink", label: "Sink" }];
  // Hob and oven are independent rows: keep them on the same run for a built-under
  // combo, or split them for a hob + a standalone oven tower.
  if (selected.has("hob")) rows.push({ key: "hob", glyph: "hob", label: "Hob" });
  if (selected.has("oven")) rows.push({ key: "oven", glyph: "oven", label: "Oven" });
  if (selected.has("fridge")) rows.push({ key: "fridge", glyph: "fridge", label: "Fridge" });
  if (selected.has("dishwasher")) rows.push({ key: "dishwasher", glyph: "dishwasher", label: "Dishwasher" });
  if (selected.has("microwave")) rows.push({ key: "microwave", glyph: "microwave", label: "Microwave" });
  if (selected.has("hood")) {
    rows.push({
      key: "hood",
      glyph: "hood",
      label: "Hood",
      lockedNote: selected.has("hob") ? "follows the hob" : undefined,
    });
  }

  const runLabel = (i: number) => String.fromCharCode(65 + i); // 0 → A, 1 → B…

  // The destinations: each run (A│B│C…), then the island as a final segment.
  const targets: RunTarget[] = [
    ...Array.from({ length: runCount }, (_, i) => i as RunTarget),
    ...(hasIsland ? (["island"] as RunTarget[]) : []),
  ];

  // Quiet segmented A│B│C│◇. The spatial meaning lives in the legend above, so the
  // control itself stays a small, low-key toggle rather than a loud block.
  const segmented = (row: Row, target: RunTarget) => {
    const locked = !!row.lockedNote;
    return (
      <div className={`inline-flex overflow-hidden rounded-md border ${locked ? "opacity-50" : ""}`}>
        {targets.map((t) => {
          const active = t === target;
          return (
            <button
              key={String(t)}
              type="button"
              disabled={locked}
              onClick={() => onChange(row.key, t)}
              aria-pressed={active}
              aria-label={t === "island" ? `${row.label} on the island` : `${row.label} on Run ${runLabel(t)}`}
              className={`flex h-7 min-w-[28px] items-center justify-center border-l px-2 text-xs font-medium transition first:border-l-0 ${
                active ? "" : `text-muted-foreground${locked ? "" : " hover:bg-muted"}`
              }`}
              style={active ? { backgroundColor: "rgba(100,125,117,0.14)", color: SAGE } : undefined}
            >
              {t === "island" ? <IslandGlyph size={14} /> : runLabel(t)}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-md border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <span className="text-sm font-medium text-muted-foreground">Where?</span>
        {/* Legend — teaches the letter → leg (and island) mapping once. */}
        <div className="flex items-center gap-3">
          {Array.from({ length: runCount }).map((_, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutLegGlyph layout={layout} leg={i} size={18} className="text-muted-foreground" />
              {runLabel(i)}
            </span>
          ))}
          {hasIsland && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IslandGlyph size={18} className="text-muted-foreground" />
              Island
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col divide-y">
        {rows.map((row) => {
          const target = effectiveRunFor(row.key, assignments, selected, runCount, hasIsland);
          // The oven merges into one built-under unit when it shares the hob's run.
          const combined =
            row.key === "oven" &&
            selected.has("hob") &&
            target === effectiveRunFor("hob", assignments, selected, runCount, hasIsland);
          const note = row.lockedNote ?? (combined ? "combined with hob" : undefined);
          return (
            <div key={row.key} className="flex items-center gap-3 py-1.5">
              <ApplianceGlyph id={row.glyph} size={16} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">
                {row.label}
                {note && <span className="ml-1.5 text-xs text-muted-foreground">· {note}</span>}
              </span>
              {segmented(row, target)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
