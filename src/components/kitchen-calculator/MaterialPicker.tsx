import { useState } from "react";
import { Check, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getCachedImageUrl,
  getMaterialByCode,
  getMaterialsByRole,
  type SupabaseMaterial,
} from "@/hooks/useGraphMaterials";
import {
  customSlotOf,
  isCustomCode,
  useFrontMaterials,
  type CustomMaterial,
  type PaletteEntry,
} from "./frontMaterialContext";

const SAGE = "#647d75";

const matName = (mat: SupabaseMaterial): string => mat.name?.en ?? mat.technicalCode;

/** Resolve a code (catalog or `custom:<slot>`) to a display name / image. */
function resolve(code: string | undefined, customs: Record<string, CustomMaterial>) {
  if (!code) return { name: "", image: null as string | null, custom: undefined as CustomMaterial | undefined };
  if (isCustomCode(code)) {
    const custom = customs[customSlotOf(code)];
    return { name: custom?.name ?? "Custom material", image: null, custom };
  }
  const mat = getMaterialByCode(code);
  return {
    name: mat ? matName(mat) : code,
    image: mat?.imageUrl ?? getCachedImageUrl(code),
    custom: undefined as CustomMaterial | undefined,
  };
}

/** A texture square, a custom-material tile (initial on a neutral fill), or a
 *  placeholder when a catalog image hasn't resolved yet. */
export function Swatch({
  image,
  custom,
  size = "md",
  ring,
}: {
  image?: string | null;
  /** Present when the code is a custom material (renders its initial). */
  custom?: CustomMaterial;
  size?: "sm" | "md";
  ring?: boolean;
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-7";
  return (
    <span
      className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-md border`}
      style={ring ? { boxShadow: `0 0 0 1.5px ${SAGE}` } : undefined}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : custom ? (
        <span
          className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase"
          style={{ backgroundColor: "rgba(100,125,117,0.14)", color: SAGE }}
        >
          {custom.name.trim().charAt(0) || "€"}
        </span>
      ) : (
        <span className="block h-full w-full" style={{ backgroundColor: "rgba(100,125,117,0.08)" }} />
      )}
    </span>
  );
}

interface MaterialPickerProps {
  /** Catalog role to search within ("front" | "worktop"). */
  role: string;
  /** Popover heading, e.g. "Front material". */
  title: string;
  /** What a swatch describes for the trigger tooltip, e.g. "Front" / "Worktop". */
  noun: string;
  /** The project-default code this line inherits (undefined = nothing chosen). */
  inheritedCode?: string;
  /** The per-line override (undefined = inherit the project default). */
  value?: string;
  /** Optional quick picks from the project palette (fronts I/II/III). */
  palette?: PaletteEntry[];
  onChange: (code: string | undefined) => void;
}

/**
 * Shared material control — a swatch trigger plus a popover to pick from the
 * project palette, search the catalog, or reset to the project default. Used for
 * both a unit's front and a run's worktop.
 */
export function MaterialPicker({
  role,
  title,
  noun,
  inheritedCode,
  value,
  palette = [],
  onChange,
}: MaterialPickerProps) {
  const { customs } = useFrontMaterials();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const overridden = value !== undefined;
  const activeCode = overridden ? value : inheritedCode;

  const nameOf = (code?: string) => resolve(code, customs).name;
  // Render a swatch by code (resolves catalog image / custom tile).
  const swatchFor = (code: string | undefined, size: "sm" | "md", ring?: boolean) => {
    const r = resolve(code, customs);
    return <Swatch image={r.image} custom={r.custom} size={size} ring={ring} />;
  };

  // Picking the inherited material reverts to inheritance so the line keeps
  // tracking the palette; anything else pins an explicit override.
  const pick = (code: string) => {
    onChange(code === inheritedCode ? undefined : code);
    setOpen(false);
  };
  const reset = () => {
    onChange(undefined);
    setOpen(false);
  };

  const results: SupabaseMaterial[] = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getMaterialsByRole(role)
      .filter(
        (mm) =>
          mm.imageUrl &&
          (mm.technicalCode.toLowerCase().includes(q) || matName(mm).toLowerCase().includes(q)),
      )
      .slice(0, 24);
  })();

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${noun} material`}
          title={
            activeCode
              ? `${noun}: ${nameOf(activeCode)}${overridden ? "" : " (project default)"}`
              : `Choose a ${noun.toLowerCase()} material`
          }
          className="relative shrink-0 rounded-md transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-1"
          style={{ ["--tw-ring-color" as string]: "rgba(100,125,117,0.4)" }}
        >
          {swatchFor(activeCode, "md")}
          {/* A sage dot marks a line that departs from the project default. */}
          {overridden && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-background"
              style={{ backgroundColor: SAGE }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div className="text-sm font-medium">{title}</div>

        {/* Reset to the project default for this line. */}
        {inheritedCode && (
          <button
            type="button"
            onClick={reset}
            className="flex w-full items-center gap-2 rounded-md border p-2 text-left transition hover:bg-muted"
            style={!overridden ? { borderColor: SAGE, backgroundColor: "rgba(100,125,117,0.06)" } : undefined}
          >
            {swatchFor(inheritedCode, "sm", !overridden)}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{nameOf(inheritedCode)}</span>
              <span className="block text-[11px] text-muted-foreground">
                Project default
                {isCustomCode(inheritedCode) && customs[customSlotOf(inheritedCode)]?.price
                  ? ` · €${customs[customSlotOf(inheritedCode)].price}/m²`
                  : ""}
              </span>
            </span>
            {!overridden ? (
              <Check className="h-4 w-4 shrink-0" style={{ color: SAGE }} />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </button>
        )}

        {/* The project palette — attribute a different chosen material to this line. */}
        {palette.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-muted-foreground">Project palette</div>
            <div className="flex flex-wrap gap-2">
              {palette.map((p) => {
                const selected = overridden && p.code === activeCode;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => pick(p.code)}
                    className="flex flex-col items-center gap-1"
                    title={`${p.label} · ${nameOf(p.code)}`}
                  >
                    {swatchFor(p.code, "sm", selected)}
                    <span className="text-[9px] text-muted-foreground">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Off-palette: search the catalog for a one-off material on this line. */}
        <div className="space-y-2 border-t pt-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalog by code or name…"
              className="pl-7"
              aria-label={`Search ${noun.toLowerCase()} materials`}
            />
          </div>
          {query.trim() &&
            (results.length > 0 ? (
              <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto pr-0.5">
                {results.map((mm) => {
                  const selected = mm.technicalCode === activeCode;
                  return (
                    <button
                      key={mm.technicalCode}
                      type="button"
                      onClick={() => pick(mm.technicalCode)}
                      className="group/result flex flex-col items-center gap-1"
                      title={`${matName(mm)} · ${mm.technicalCode}`}
                    >
                      <span
                        className="relative aspect-square w-full overflow-hidden rounded-lg border transition group-hover/result:border-[#647d75]"
                        style={selected ? { borderColor: SAGE } : undefined}
                      >
                        <img
                          src={mm.imageUrl!}
                          alt={matName(mm)}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {selected && (
                          <span
                            className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                            style={{ backgroundColor: SAGE }}
                          >
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                          </span>
                        )}
                      </span>
                      <span className="w-full truncate text-center font-mono text-[9px] text-muted-foreground">
                        {mm.technicalCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No catalog match for “{query.trim()}”.</p>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
