import { useEffect, useState } from "react";
import { Check, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { surfaces } from "@/data/rooms/surfaces";
import { useMaterialOverrides } from "@/hooks/useMaterialOverrides";
import {
  getCachedImageUrl,
  getMaterialByCode,
  getMaterialsByRole,
  useGraphMaterials,
  type SupabaseMaterial,
} from "@/hooks/useGraphMaterials";

/**
 * Materials palette for the kitchen, shown as a strip of texture swatches at the
 * top of the calculator. It mirrors the main app's **flatlay slots**, not raw
 * surfaces: one swatch per "Fronts I/II/III" or "Worktops", where a single front
 * material can cover several physical surfaces. Slots are optional — an empty
 * "+" tile adds another. Everything reads/writes the same localStorage the
 * moodboard uses, so picks flow back to the account:
 *  - `material-overrides`         — surfaceKey → material code (the pricing store)
 *  - `moodboard-slot-selections`  — slotKey → archetype id
 *  - `slot-surfaces`              — slotKey → surfaces it covers
 *  - `enabled-optional-slots`     — which slots are on the flatlay
 *
 * Custom (off-catalog) materials are a calculator-local pricing concept and are
 * not written back to the shared stores.
 */

// Furniture slots the calculator prices, in flatlay order. Faucets/floor live on
// the moodboard but aren't furniture, so they're intentionally excluded here.
const FURNITURE_SLOTS = ["mainFronts", "additionalFronts", "tertiaryFronts", "worktops"] as const;
type FurnitureSlot = (typeof FURNITURE_SLOTS)[number];

const SLOT_LABEL: Record<FurnitureSlot, string> = {
  mainFronts: "Fronts I",
  additionalFronts: "Fronts II",
  tertiaryFronts: "Fronts III",
  worktops: "Worktops",
};

// Default primary surface per slot (mirrors DEFAULT_SLOT_SURFACES / SLOT_TO_PALETTE_KEY
// in KonceptasView). slot-surfaces may extend a slot to more surfaces (e.g. island).
const SLOT_PRIMARY_SURFACE: Record<FurnitureSlot, string> = {
  mainFronts: "bottomCabinets",
  additionalFronts: "topCabinets",
  tertiaryFronts: "tallCabinets",
  worktops: "worktops",
};

const SLOT_ROLE: Record<FurnitureSlot, string> = {
  mainFronts: "front",
  additionalFronts: "front",
  tertiaryFronts: "front",
  worktops: "worktop",
};

// Short surface labels for the stripe captions (surfaces.ts labels run long).
const SURFACE_SHORT: Record<string, string> = {
  bottomCabinets: "Bottom",
  topCabinets: "Top",
  tallCabinets: "Tall",
  shelves: "Shelves",
  island: "Island",
  worktops: "Worktop",
};
const shortSurface = (pk: string): string => SURFACE_SHORT[pk] ?? surfaces[pk]?.label ?? pk;

// Full slot-selections shape the moodboard persists — kept so we merge, not clobber.
const FULL_SLOT_SELECTIONS: Record<string, string | null> = {
  floor: null,
  mainFronts: null,
  worktops: null,
  additionalFronts: null,
  tertiaryFronts: null,
  accents: null,
  mainTiles: null,
  additionalTiles: null,
};

interface CustomMaterial {
  name: string;
  price: string;
}

const matName = (mat: SupabaseMaterial): string => mat.name?.en ?? mat.technicalCode;

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function MaterialsHeader() {
  // Kick off the catalog load; re-renders this strip once texture images resolve.
  useGraphMaterials();

  // Shared with the moodboard via localStorage.
  const { materialOverrides, setMaterialOverrides } = useMaterialOverrides();

  const [slotSelections, setSlotSelections] = useState<Record<string, string | null>>(() => ({
    ...FULL_SLOT_SELECTIONS,
    ...readJSON<Record<string, string | null>>("moodboard-slot-selections", {}),
  }));
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(readJSON<string[]>("enabled-optional-slots", [])),
  );
  // slot-surfaces: which surfaces each slot covers — editable via the pills below.
  const [slotSurfaces, setSlotSurfaces] = useState<Record<string, string[]>>(() =>
    readJSON<Record<string, string[]>>("slot-surfaces", {}),
  );

  useEffect(() => {
    try {
      localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
    } catch {}
  }, [slotSelections]);
  useEffect(() => {
    try {
      localStorage.setItem("enabled-optional-slots", JSON.stringify([...enabled]));
    } catch {}
  }, [enabled]);
  useEffect(() => {
    try {
      localStorage.setItem("slot-surfaces", JSON.stringify(slotSurfaces));
    } catch {}
  }, [slotSurfaces]);

  // Custom (off-catalog) materials — calculator-local, not synced.
  const [customChoices, setCustomChoices] = useState<Record<string, CustomMaterial>>({});
  // Which popover is open: a slot key, the "add" menu, or nothing.
  const [openKey, setOpenKey] = useState<FurnitureSlot | "add" | null>(null);
  const [query, setQuery] = useState("");
  const [customDraft, setCustomDraft] = useState<CustomMaterial>({ name: "", price: "" });

  // The surfaces a slot writes to (defaults to its primary if unmapped).
  const surfacesForSlot = (slot: FurnitureSlot): string[] =>
    slotSurfaces[slot]?.length ? slotSurfaces[slot] : [SLOT_PRIMARY_SURFACE[slot]];

  const codeForSlot = (slot: FurnitureSlot): string | undefined =>
    materialOverrides[surfacesForSlot(slot)[0]];

  // Caption = the surfaces this material is applied to, e.g. "Bottom · Island".
  const surfaceSummary = (slot: FurnitureSlot): string =>
    surfacesForSlot(slot).map(shortSurface).join(" · ");

  // Every surface of the slot's role (front → bottom/top/tall/shelves/island, etc.).
  const surfaceOptions = (slot: FurnitureSlot): string[] =>
    Object.entries(surfaces)
      .filter(([, def]) => def.category === SLOT_ROLE[slot])
      .map(([pk]) => pk);

  // Which other visible slot currently owns a surface (surfaces are 1-slot-exclusive).
  const ownerOf = (pk: string, slot: FurnitureSlot): FurnitureSlot | undefined =>
    FURNITURE_SLOTS.find(
      (s) => s !== slot && (enabled.has(s) || !!codeForSlot(s)) && surfacesForSlot(s).includes(pk),
    );

  // Assign a surface to this slot — transfers it off any other slot, copies the
  // slot's current material onto it, and drops the other slot if it empties.
  const addSurface = (slot: FurnitureSlot, pk: string) => {
    const primaryPk = surfacesForSlot(slot)[0];
    const owner = (Object.entries(slotSurfaces) as [string, string[]][]).find(
      ([k, pks]) => k !== slot && pks?.includes(pk),
    );
    const orphaned = owner && owner[1].length <= 1 ? (owner[0] as FurnitureSlot) : null;

    setSlotSurfaces((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k !== slot && next[k]?.includes(pk)) next[k] = next[k].filter((x) => x !== pk);
      }
      const base = next[slot]?.length ? next[slot] : [...surfacesForSlot(slot)];
      next[slot] = base.includes(pk) ? base : [...base, pk];
      return next;
    });
    setMaterialOverrides((prev) => {
      const code = prev[primaryPk];
      return code ? { ...prev, [pk]: code } : prev;
    });
    if (orphaned && (FURNITURE_SLOTS as readonly string[]).includes(orphaned)) {
      setEnabled((prev) => {
        const s = new Set(prev);
        s.delete(orphaned);
        return s;
      });
      setSlotSelections((prev) => ({ ...prev, [orphaned]: null }));
    }
  };

  // Unassign a surface (only when the slot keeps at least one).
  const removeSurface = (slot: FurnitureSlot, pk: string) => {
    setSlotSurfaces((prev) => ({ ...prev, [slot]: (prev[slot] ?? []).filter((x) => x !== pk) }));
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      delete next[pk];
      return next;
    });
  };

  // A slot appears as a swatch if it's on the flatlay or already has a material.
  const visibleSlots = FURNITURE_SLOTS.filter((s) => enabled.has(s) || !!codeForSlot(s));
  const addableSlots = FURNITURE_SLOTS.filter((s) => !visibleSlots.includes(s));

  const openPopover = (key: FurnitureSlot | "add" | null) => {
    setOpenKey(key);
    setQuery("");
    setCustomDraft(
      key && key !== "add" ? customChoices[key] ?? { name: "", price: "" } : { name: "", price: "" },
    );
  };

  // Picking a catalog material: write the code to every surface the slot covers,
  // record the archetype, enable the slot, and drop any custom entry.
  const pickCode = (slot: FurnitureSlot, mat: SupabaseMaterial) => {
    const code = mat.technicalCode;
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      for (const pk of surfacesForSlot(slot)) next[pk] = code;
      return next;
    });
    setSlotSelections((prev) => ({ ...prev, [slot]: mat.archetypeId ?? code }));
    setEnabled((prev) => (prev.has(slot) ? prev : new Set([...prev, slot])));
    setCustomChoices((prev) => {
      const { [slot]: _, ...rest } = prev;
      return rest;
    });
    setOpenKey(null);
  };

  const applyCustom = (slot: FurnitureSlot) => {
    if (!customDraft.name.trim()) return;
    setCustomChoices((prev) => ({ ...prev, [slot]: customDraft }));
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      for (const pk of surfacesForSlot(slot)) delete next[pk];
      return next;
    });
    setSlotSelections((prev) => ({ ...prev, [slot]: null }));
    setEnabled((prev) => (prev.has(slot) ? prev : new Set([...prev, slot])));
    setOpenKey(null);
  };

  // Empty the material but keep the square on the strip.
  const clearMaterial = (slot: FurnitureSlot) => {
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      for (const pk of surfacesForSlot(slot)) delete next[pk];
      return next;
    });
    setSlotSelections((prev) => ({ ...prev, [slot]: null }));
    setCustomChoices((prev) => {
      const { [slot]: _, ...rest } = prev;
      return rest;
    });
  };

  // Remove the square entirely (clears material + takes it off the flatlay).
  const removeSlot = (slot: FurnitureSlot) => {
    clearMaterial(slot);
    setEnabled((prev) => {
      const next = new Set(prev);
      next.delete(slot);
      return next;
    });
    setOpenKey(null);
  };

  const addSlot = (slot: FurnitureSlot) => {
    setEnabled((prev) => new Set([...prev, slot]));
    openPopover(slot);
  };

  // Clear the whole stripe — furniture slots only (floor/faucets on the moodboard stay).
  const resetAll = () => {
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      for (const s of FURNITURE_SLOTS) for (const pk of surfacesForSlot(s)) delete next[pk];
      return next;
    });
    setSlotSelections((prev) => {
      const next = { ...prev };
      for (const s of FURNITURE_SLOTS) next[s] = null;
      return next;
    });
    setEnabled((prev) => {
      const next = new Set(prev);
      for (const s of FURNITURE_SLOTS) next.delete(s);
      return next;
    });
    setCustomChoices({});
    setOpenKey(null);
  };

  // Catalog search — role-scoped, matches technical code or name, image-only.
  const searchResults = (slot: FurnitureSlot): SupabaseMaterial[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getMaterialsByRole(SLOT_ROLE[slot])
      .filter(
        (m) =>
          m.imageUrl &&
          (m.technicalCode.toLowerCase().includes(q) || matName(m).toLowerCase().includes(q)),
      )
      .slice(0, 24);
  };

  const renderSwatchPopover = (slot: FurnitureSlot) => {
    const code = codeForSlot(slot);
    const custom = customChoices[slot];
    const isSet = !!code || !!custom;
    const results = openKey === slot ? searchResults(slot) : [];
    return (
      <PopoverContent align="start" className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{surfaceSummary(slot)}</span>
          <div className="flex items-center gap-3">
            {isSet && (
              <button
                type="button"
                onClick={() => clearMaterial(slot)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => removeSlot(slot)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          </div>
        </div>

        {/* Surface assignment — which surfaces this material applies to.
            Only shown when the role has more than one surface (worktop has one). */}
        {surfaceOptions(slot).length > 1 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-muted-foreground">Applies to</div>
            <div className="flex flex-wrap gap-1.5">
              {surfaceOptions(slot).map((pk) => {
                const assigned = surfacesForSlot(slot).includes(pk);
                const owner = ownerOf(pk, slot);
                const canRemove = assigned && surfacesForSlot(slot).length > 1;
                return (
                  <button
                    key={pk}
                    type="button"
                    onClick={() => {
                      if (assigned) {
                        if (canRemove) removeSurface(slot, pk);
                      } else {
                        addSurface(slot, pk);
                      }
                    }}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                    style={
                      assigned
                        ? { backgroundColor: "#647d75", color: "#fff" }
                        : {
                            border: "0.5px dashed rgba(0,0,0,0.18)",
                            color: "rgba(0,0,0,0.45)",
                            opacity: owner ? 0.5 : 1,
                          }
                    }
                    title={owner ? `Currently on ${surfaceSummary(owner)} — tap to move here` : undefined}
                  >
                    {surfaces[pk].label}
                    {assigned && canRemove && <X className="h-2.5 w-2.5 opacity-60" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Catalog search — by code or name, shows texture thumbnails. */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalog by code or name…"
              className="pl-7"
              aria-label={`Search ${SLOT_LABEL[slot]} materials`}
            />
          </div>

          {query.trim() &&
            (results.length > 0 ? (
              <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-0.5">
                {results.map((m) => {
                  const selected = m.technicalCode === code;
                  return (
                    <button
                      key={m.technicalCode}
                      type="button"
                      onClick={() => pickCode(slot, m)}
                      className="group/result flex flex-col items-center gap-1"
                      title={`${matName(m)} · ${m.technicalCode}`}
                    >
                      <div
                        className="relative aspect-square w-full overflow-hidden rounded-lg border transition group-hover/result:border-[#647d75]"
                        style={selected ? { borderColor: "#647d75" } : undefined}
                      >
                        <img
                          src={m.imageUrl!}
                          alt={matName(m)}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {selected && (
                          <div
                            className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                            style={{ backgroundColor: "#647d75" }}
                          >
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <span className="w-full truncate text-center font-mono text-[9px] text-muted-foreground">
                        {m.technicalCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                No catalog match. Try another code, or add it as a custom material below.
              </p>
            ))}
        </div>

        {/* Custom: for materials not in the catalog (calculator-local). */}
        <div className="space-y-2 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">
            Not in the catalog? Add your own
          </div>
          <Input
            value={customDraft.name}
            onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Material description"
            aria-label={`${SLOT_LABEL[slot]} custom material`}
          />
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">€</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={customDraft.price}
              onChange={(e) => setCustomDraft((d) => ({ ...d, price: e.target.value }))}
              placeholder="0"
              className="w-24 text-right"
              aria-label={`${SLOT_LABEL[slot]} price per square metre`}
            />
            <span className="whitespace-nowrap text-sm text-muted-foreground">/ m²</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={!customDraft.name.trim()}
            onClick={() => applyCustom(slot)}
          >
            Use custom material
          </Button>
        </div>
      </PopoverContent>
    );
  };

  // Menu of surfaces not yet on the stripe — shared by the empty-state bar and "+".
  const addMenu = (
    <PopoverContent align="start" className="w-56 p-1">
      <div className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        Add surface material
      </div>
      {addableSlots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => addSlot(slot)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          {surfaceSummary(slot)}
        </button>
      ))}
    </PopoverContent>
  );

  return (
    <section>
      {visibleSlots.length > 0 && (
        <div className="mb-1.5 flex justify-end">
          <button
            type="button"
            onClick={resetAll}
            title="Reset materials"
            aria-label="Reset materials"
            className="text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Connected texture stripe — one segment per slot, caption overlaid on the texture. */}
      {visibleSlots.length === 0 ? (
        // Empty state — an obvious full-width way to add the first material.
        <Popover open={openKey === "add"} onOpenChange={(o) => openPopover(o ? "add" : null)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-16 w-full items-center justify-center gap-2 border border-dashed text-sm text-muted-foreground transition hover:border-[#647d75] hover:text-[#647d75]"
            >
              <Plus className="h-4 w-4" />
              Add material
            </button>
          </PopoverTrigger>
          {addMenu}
        </Popover>
      ) : (
        <div className="flex h-16 overflow-hidden border">
          {visibleSlots.map((slot, i) => {
            const code = codeForSlot(slot);
            const custom = customChoices[slot];
            const mat = code ? getMaterialByCode(code) : undefined;
            const image = code ? mat?.imageUrl ?? getCachedImageUrl(code) : null;
            const isSet = !!code || !!custom;
            const hasImage = !!image;
            const active = openKey === slot;

            return (
              <Popover key={slot} open={active} onOpenChange={(o) => openPopover(o ? slot : null)}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="group relative h-full min-w-0 flex-1 focus-visible:outline-none"
                    style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.65)" } : undefined}
                    aria-label={`${surfaceSummary(slot)} material`}
                  >
                    {/* Texture / fallback fill */}
                    {hasImage ? (
                      <img
                        src={image}
                        alt={surfaceSummary(slot)}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="block h-full w-full"
                        style={{
                          backgroundColor: isSet ? "rgba(0,0,0,0.04)" : "rgba(100,125,117,0.06)",
                        }}
                      />
                    )}
                    {/* Empty slot invites a pick */}
                    {!isSet && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[#647d75]" />
                      </span>
                    )}
                    {/* Caption overlaid on the texture */}
                    <span
                      className={`pointer-events-none absolute inset-x-0 bottom-0 truncate px-1.5 pb-1 text-[10px] font-medium ${
                        hasImage ? "pt-5 text-white" : "pt-1 text-muted-foreground"
                      }`}
                      style={
                        hasImage
                          ? { background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }
                          : undefined
                      }
                    >
                      {surfaceSummary(slot)}
                    </span>
                    {/* Hover + active affordances */}
                    <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                    {active && (
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: "inset 0 0 0 2px #647d75" }}
                      />
                    )}
                  </button>
                </PopoverTrigger>
                {renderSwatchPopover(slot)}
              </Popover>
            );
          })}

          {/* "+" segment — adds another slot. */}
          {addableSlots.length > 0 && (
            <Popover open={openKey === "add"} onOpenChange={(o) => openPopover(o ? "add" : null)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex h-full w-11 flex-none flex-col items-center justify-center gap-0.5 transition hover:bg-[#647d75]/5 focus-visible:outline-none"
                  style={{ borderLeft: "1px solid rgba(0,0,0,0.08)" }}
                  aria-label="Add a surface material"
                >
                  <Plus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[#647d75]" />
                  <span className="text-[8px] uppercase tracking-wide text-muted-foreground transition-colors group-hover:text-[#647d75]">
                    Add
                  </span>
                </button>
              </PopoverTrigger>
              {addMenu}
            </Popover>
          )}
        </div>
      )}

    </section>
  );
}
