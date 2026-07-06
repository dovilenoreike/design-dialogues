import { useState } from "react";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { surfaces } from "@/data/rooms/surfaces";

/**
 * MOCKUP — materials palette for the kitchen, shown as a strip at the top of the
 * calculator. Uses the project's real surface categories (src/data/rooms/surfaces).
 * A material is chosen either by its **technical code** from the integrated
 * catalog, or entered as a custom material + €/m². Not yet wired to pricing.
 *
 * TODO (per product): add a "Housing" (carcass) surface once it exists in
 * surfaces.ts — housing material is normally cheaper than the fronts.
 */

// Surfaces the calculator actually builds furniture for, in display order.
const SURFACE_KEYS = ["worktops", "bottomCabinets", "topCabinets", "tallCabinets", "island"] as const;

type SelectionKind = "unset" | "code" | "custom";

interface Choice {
  kind: SelectionKind;
  code: string;
  customName: string;
  customPrice: string;
}

const emptyChoice = (): Choice => ({ kind: "unset", code: "", customName: "", customPrice: "" });

function valueLabel(choice: Choice): string {
  if (choice.kind === "code") return choice.code;
  if (choice.kind === "custom") return choice.customName.trim() || "Custom material";
  return "Not set";
}

export function MaterialsHeader() {
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(SURFACE_KEYS.map((k) => [k, emptyChoice()])),
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  const patch = (key: string, p: Partial<Choice>) =>
    setChoices((prev) => ({ ...prev, [key]: { ...prev[key], ...p } }));

  const applyCode = (key: string) => {
    if (!choices[key].code.trim()) return;
    patch(key, { kind: "code" });
    setOpenKey(null);
  };
  const applyCustom = (key: string) => {
    if (!choices[key].customName.trim()) return;
    patch(key, { kind: "custom" });
    setOpenKey(null);
  };

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Materials</h2>
          <p className="text-xs text-muted-foreground">
            One material per surface — search the catalog by code, or add your own.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">Preview · not yet priced</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {SURFACE_KEYS.map((key) => {
          const choice = choices[key];
          const isSet = choice.kind !== "unset";
          // Worktop covers the backsplash too (via the checkbox below), so keep
          // the tile label short rather than "Worktops & Backsplashes".
          const label = key === "worktops" ? "Worktop" : surfaces[key].label;
          return (
            <div key={key} className="flex flex-col gap-1.5">
            <Popover open={openKey === key} onOpenChange={(o) => setOpenKey(o ? key : null)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group rounded-lg border p-3 text-left transition-colors hover:border-[#647d75]"
                >
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span
                      className={`truncate text-sm ${
                        isSet ? "font-medium" : "text-muted-foreground"
                      } ${choice.kind === "code" ? "font-mono" : ""}`}
                    >
                      {valueLabel(choice)}
                    </span>
                    <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                  </div>
                </button>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-72 space-y-3">
                <div className="text-sm font-medium">{label}</div>

                {/* Catalog: search by technical code only. */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Catalog material code
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={choice.code}
                        onChange={(e) => patch(key, { code: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && applyCode(key)}
                        placeholder="e.g. H1180 ST37"
                        className="pl-7 font-mono"
                        aria-label={`${surfaces[key].label} catalog code`}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="text-white"
                      style={{ backgroundColor: "#647d75" }}
                      disabled={!choice.code.trim()}
                      onClick={() => applyCode(key)}
                    >
                      Set
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enter the material&apos;s technical code from the catalog.
                  </p>
                </div>

                {/* Custom: for materials not in the catalog. */}
                <div className="space-y-2 border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    Not in the catalog? Add your own
                  </div>
                  <Input
                    value={choice.customName}
                    onChange={(e) => patch(key, { customName: e.target.value })}
                    placeholder="Material description"
                    aria-label={`${surfaces[key].label} custom material`}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">€</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={choice.customPrice}
                      onChange={(e) => patch(key, { customPrice: e.target.value })}
                      placeholder="0"
                      className="w-24 text-right"
                      aria-label={`${surfaces[key].label} price per square metre`}
                    />
                    <span className="whitespace-nowrap text-sm text-muted-foreground">/ m²</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!choice.customName.trim()}
                    onClick={() => applyCustom(key)}
                  >
                    Use custom material
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Housing (carcass) material — coming soon.
      </p>
    </section>
  );
}
