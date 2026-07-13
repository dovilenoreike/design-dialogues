import {
  effectiveRunFor,
  type AssignableFixture,
  type KitchenLayout,
  type ProjectAppliance,
  type RunAssignment,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { LayoutLegGlyph } from "./LayoutLegGlyph";

interface ApplianceRunAssignmentProps {
  layout: KitchenLayout;
  runCount: number;
  /** The declared appliance set (drives which rows appear). */
  selected: Set<ProjectAppliance>;
  assignments: RunAssignment;
  onChange: (key: AssignableFixture, run: number) => void;
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
  selected,
  assignments,
  onChange,
}: ApplianceRunAssignmentProps) {
  if (runCount < 2) return null;

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

  // Quiet segmented A│B│C. The spatial meaning lives in the legend above, so the
  // control itself stays a small, low-key letter toggle rather than a loud block.
  const segmented = (row: Row, run: number) => {
    const locked = !!row.lockedNote;
    return (
      <div className={`inline-flex overflow-hidden rounded-md border ${locked ? "opacity-50" : ""}`}>
        {Array.from({ length: runCount }).map((_, i) => {
          const active = i === run;
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => onChange(row.key, i)}
              aria-pressed={active}
              aria-label={`${row.label} on Run ${runLabel(i)}`}
              className={`h-7 min-w-[28px] border-l px-2 text-xs font-medium transition first:border-l-0 ${
                active ? "" : `text-muted-foreground${locked ? "" : " hover:bg-muted"}`
              }`}
              style={active ? { backgroundColor: "rgba(100,125,117,0.14)", color: SAGE } : undefined}
            >
              {runLabel(i)}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-md border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <span className="text-sm font-medium text-muted-foreground">Which wall?</span>
        {/* Legend — teaches the letter → leg mapping once, so the rows don't have to. */}
        <div className="flex items-center gap-3">
          {Array.from({ length: runCount }).map((_, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutLegGlyph layout={layout} leg={i} size={18} className="text-muted-foreground" />
              {runLabel(i)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col divide-y">
        {rows.map((row) => {
          const run = effectiveRunFor(row.key, assignments, selected, runCount);
          // The oven merges into one built-under unit when it shares the hob's run.
          const combined =
            row.key === "oven" &&
            selected.has("hob") &&
            run === effectiveRunFor("hob", assignments, selected, runCount);
          const note = row.lockedNote ?? (combined ? "combined with hob" : undefined);
          return (
            <div key={row.key} className="flex items-center gap-3 py-1.5">
              <ApplianceGlyph id={row.glyph} size={16} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">
                {row.label}
                {note && <span className="ml-1.5 text-xs text-muted-foreground">· {note}</span>}
              </span>
              {segmented(row, run)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
