import { useMemo, useState, useEffect, useRef } from "react";
import { Check, Trash2, X, Search } from "lucide-react";
import { SHOW_COLOUR_SCORES } from "@/lib/material-generation-utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArchetypesByRole } from "@/data/archetypes";
import { getMaterialByCode, getPairCountByCode, getCompatibilityScore, matchesAllOtherCodes, wouldTriggerWoodWarning, wouldTriggerBusyPatternWarning, getDescriptorScore, GENERAL_PALETTE_WEIGHT, setActiveScoringDirection, getV2DebugForCode } from "@/hooks/useGraphMaterials";
import type { MaterialRole } from "@/types/material-types";
import type { Archetype } from "@/data/archetypes/types";
import type { SupabaseMaterial } from "@/hooks/useGraphMaterials";
import MaterialRequestDialog from "./MaterialRequestDialog";
import { buildMaterialGrid, type GridCell } from "@/lib/material-grid";
import { DIRECTIONS_BY_ARCHETYPE, CLAIMING_PRIORITY, CANONICAL_DIRECTION, directionMinScore, type DirectionId, type RankedClusteredEntry } from "@/lib/palette-scoring-v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotKey = "floor" | "mainFronts" | "worktops" | "additionalFronts" | "tertiaryFronts" | "accents" | "mainTiles" | "additionalTiles";
export type SlotSelections = Record<SlotKey, string | null>;

export const SLOT_KEY_TO_ROLE: Record<SlotKey, MaterialRole> = {
  floor: "floor",
  mainFronts: "front",
  additionalFronts: "front",
  tertiaryFronts: "front",
  worktops: "worktop",
  accents: "accent",
  mainTiles: "tile",
  additionalTiles: "tile",
};

interface MaterialSlotPickerProps {
  slot: SlotKey | null;
  selections: SlotSelections;
  onSelect: (slotKey: SlotKey, archetypeId: string, resolvedCode?: string) => void;
  onClose: () => void;
  onClear?: (slotKey: SlotKey) => void;
  otherMaterialCodes?: string[];
  /** Codes of materials already placed in the same role — used to suppress wood-warning candidates from recommended. */
  sameRoleMaterialCodes?: string[];
  selectedMaterialCode?: string;
  getRecommendedCodes?: (currentCode: string | null, otherCodes: string[], role?: string) => string[];
  getAllRankedCodes?: (otherCodes: string[], role: string, style?: string, chipArchetypeId?: string | null) => string[];
  /** v2 engine: harmony-filtered + direction-tagged candidates, used by the "Explore similar" section. */
  getClusteredRankedCodes?: (otherCodes: string[], role: string, chipArchetypeId?: string | null) => RankedClusteredEntry[];
  graphMaterials?: SupabaseMaterial[];
  /** Only hide archetypes with no matching graph materials when the showroom actively covers this slot's role */
  filterEmptyArchetypes?: boolean;
  /** Render as an always-visible inline panel instead of a bottom-sheet modal */
  inline?: boolean;
  /** Optional node rendered between the inline header and the swatch content (e.g. surface type pills) */
  subHeader?: React.ReactNode;
  /** V badge — compatible with most other selected materials */
  isCompatibleWithOthers?: (code: string, otherCodes: string[]) => boolean;
  /** VV badge — compatible with ALL other selected materials */
  isCompatibleWithEvery?: (code: string, otherCodes: string[]) => boolean;
}

const PLAIN_FRONT_ARCHETYPE_IDS = new Set(['plain']);

function isPlainFrontChip(archetypeId: string | null | undefined, role: string): boolean {
  return role === 'front' && PLAIN_FRONT_ARCHETYPE_IDS.has(archetypeId ?? '');
}

// ─── Row item types (module-level so cluster helpers can reference them) ──────

type RowItem  = { code: string; image: string; name: string; materialName: string; isSelected: boolean; isRecommended: boolean; matchesAll: boolean; archetypeId: string };
type ClusterCell = { representative: RowItem; siblings: RowItem[] };

/** Group pre-sorted RowItems by cluster_id. First item in each group = representative. */
function buildClusters(items: RowItem[], clusterIdByCode: Map<string, string | null>): ClusterCell[] {
  const groups = new Map<string, RowItem[]>();
  for (const item of items) {
    const key = clusterIdByCode.get(item.code) ?? item.code;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.values()).map(members => ({
    representative: members[0],
    siblings: members.slice(1),
  }));
}

export default function MaterialSlotPicker({
  slot,
  selections,
  onSelect,
  onClose,
  onClear,
  otherMaterialCodes,
  sameRoleMaterialCodes,
  selectedMaterialCode,
  getRecommendedCodes,
  getAllRankedCodes,
  getClusteredRankedCodes,
  graphMaterials,
  filterEmptyArchetypes = false,
  inline = false,
  subHeader,
}: MaterialSlotPickerProps) {
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  // Which archetype chip is expanded (user-driven)
  const [activeArchetypeId, setActiveArchetypeId] = useState<string | null>(null);
  // Code search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Material request
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  // Which cluster's sibling row is currently expanded (keyed by representative code)
  const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
  // Center of the 3×3 grid in inline mode (null = derive from selection/ranking)
  const [gridCenterCode, setGridCenterCode] = useState<string | null>(null);
  // Which direction swatch was last clicked — drives the alternatives strip
  const [activeDirection, setActiveDirection] = useState<DirectionId | null>(null);
  // Neutral browse mode — bypasses direction scoring, shows all archetype materials by lightness
  const [browseAll, setBrowseAll] = useState(false);
  const browseGridRef = useRef<HTMLDivElement>(null);
  const inlineDragHandleRef = useRef<HTMLDivElement>(null);
  const inlineDragStartY = useRef(0);
  const inlineDragging = useRef(false);

  // Reset internal state when slot changes
  useEffect(() => {
    setActiveArchetypeId(null);
    setSearchOpen(false);
    setSearchQuery("");
    setShowRequestDialog(false);
    setExpandedClusterKey(null);
    setGridCenterCode(null);
    setActiveDirection(null);
    setActiveScoringDirection(null);
    setBrowseAll(false);
  }, [slot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset grid center when selection is cleared (flatlay reset) so the center
  // re-derives from best-ranked rather than showing the stale previous pick.
  useEffect(() => {
    if (!selectedMaterialCode) setGridCenterCode(null);
  }, [selectedMaterialCode]);

  // Scroll browse grid into view when it opens — on mobile the grid renders below
  // the tab strip and the user won't see it without scrolling.
  useEffect(() => {
    if (browseAll && browseGridRef.current) {
      setTimeout(() => browseGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }, [browseAll]);

  // ─── Per-chip palette-best candidate ─────────────────────────────────────
  // For every archetype chip: which material is the palette's top pick right now?
  // Only runs when otherMaterialCodes is non-empty — no palette context → no palette score.
  const perChipBestCode = useMemo((): Map<string, string | null> => {
    if (!slot || !getClusteredRankedCodes || !graphMaterials?.length) return new Map();
    const role = SLOT_KEY_TO_ROLE[slot];
    const map = new Map<string, string | null>();
    for (const { id } of getArchetypesByRole(role)) {
      const entries = getClusteredRankedCodes(otherMaterialCodes ?? [], role, id);
      // One representative per direction (best by finalScore, same logic as directionGroups)
      const topByDirection = new Map<string, RankedClusteredEntry>();
      const usedCodes = new Set<string>();
      for (const e of entries) {
        if (!e.direction) continue;
        if (!topByDirection.has(e.direction) && !usedCodes.has(e.code)) {
          topByDirection.set(e.direction, e);
          usedCodes.add(e.code);
        }
      }
      const dirReps = [...topByDirection.values()].filter(e => !!getMaterialByCode(e.code)?.imageUrl);

      // Determine which directions are already occupied by placed same-archetype materials.
      // Placed codes are excluded from the scoring pool — score each directly to find its direction.
      const samePlaced = (otherMaterialCodes ?? []).filter(code => {
        const mat = getMaterialByCode(code);
        if (!mat || !mat.role.includes(role)) return false;
        return isPlainFrontChip(id, role) ? mat.texture === 'plain' : mat.archetypeId === id;
      });
      const occupiedDirections = new Set<DirectionId>();
      for (const placedCode of samePlaced) {
        const ctx = (otherMaterialCodes ?? []).filter(c => c !== placedCode);
        if (ctx.length === 0) continue;
        const debug = getV2DebugForCode(placedCode, ctx, role, id);
        if (debug?.directionId) occupiedDirections.add(debug.directionId);
      }

      // Pick first unoccupied direction: canonical first, then rest of DIRECTIONS_BY_ARCHETYPE order.
      const canonicalDir = CANONICAL_DIRECTION[id]?.[role];
      const directionOrder = DIRECTIONS_BY_ARCHETYPE[id] ?? [];
      const orderedDirs: DirectionId[] = canonicalDir
        ? [canonicalDir, ...directionOrder.filter(d => d !== canonicalDir)]
        : directionOrder;

      let picked = false;
      for (const dir of orderedDirs) {
        if (occupiedDirections.has(dir)) continue;
        const rep = topByDirection.get(dir);
        if (rep && getMaterialByCode(rep.code)?.imageUrl) {
          map.set(id, rep.code);
          picked = true;
          break;
        }
      }
      if (picked) continue;

      // Fallback: no canonical direction or all directions occupied — pick best by harmony + pairing.
      const maxPairCount = Math.max(...dirReps.map(e => getPairCountByCode(e.code)), 1);
      const best = dirReps.sort((a, b) => {
          const generalA = getPairCountByCode(a.code) / maxPairCount;
          const generalB = getPairCountByCode(b.code) / maxPairCount;
          const pairA = 0.5 * a.pairScore + 0.5 * generalA;
          const pairB = 0.5 * b.pairScore + 0.5 * generalB;
          return (b.harmonyScore * GENERAL_PALETTE_WEIGHT + pairB * (1 - GENERAL_PALETTE_WEIGHT)) -
                 (a.harmonyScore * GENERAL_PALETTE_WEIGHT + pairA * (1 - GENERAL_PALETTE_WEIGHT));
        })[0];
      map.set(id, best?.code ?? null);
    }
    return map;
  }, [slot, getClusteredRankedCodes, otherMaterialCodes, graphMaterials]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Archetype chips data (sorted by priority) ────────────────────────────
  const availableWithImages = useMemo(() => {
    if (!slot) return [];
    const role = SLOT_KEY_TO_ROLE[slot];

    const recommendedCodes = new Set(
      getRecommendedCodes
        ? getRecommendedCodes(null, otherMaterialCodes ?? [], role)
        : []
    );

    const mats = graphMaterials ?? [];
    const graphLoaded = mats.length > 0;

    return getArchetypesByRole(role)
      .map((a) => {
        const archetypeMats = mats.filter((m) =>
          (isPlainFrontChip(a.id, role) ? m.texture === 'plain' : m.archetypeId === a.id) && m.role.includes(role)
        );
        const recommendedMat = archetypeMats.find((m) => recommendedCodes.has(m.technicalCode));

        let displayImage: string | null | undefined;
        let resolvedCode: string | undefined;
        let isRecommended: boolean;

        if (selectedMaterialCode && a.id === selections[slot]) {
          displayImage = getMaterialByCode(selectedMaterialCode)?.imageUrl;
          resolvedCode = selectedMaterialCode;
          isRecommended = recommendedCodes.size > 0 && recommendedCodes.has(selectedMaterialCode);
        } else {
          const withImage = archetypeMats.filter(m => !!m.imageUrl);
          let primaryMat: typeof archetypeMats[0] | undefined;
          // Prefer palette-best candidate for this archetype (available when other slots are filled)
          const bestCode = perChipBestCode.get(a.id);
          if (bestCode) {
            primaryMat = withImage.find(m => m.technicalCode === bestCode) ?? withImage[0];
          }
          // Fallback: no palette context yet — use popularity sort
          if (!primaryMat && withImage.length > 0) {
            primaryMat = archetypeMats.reduce((best, m) => {
              const descM    = getDescriptorScore(m.technicalCode, otherMaterialCodes ?? []);
              const descBest = getDescriptorScore(best.technicalCode, otherMaterialCodes ?? []);
              if (descM !== descBest) return descM > descBest ? m : best;
              return getPairCountByCode(m.technicalCode) > getPairCountByCode(best.technicalCode) ? m : best;
            });
          }
          resolvedCode = primaryMat?.technicalCode;
          if (filterEmptyArchetypes && graphLoaded && !resolvedCode && role !== "accent") {
            return { archetype: a, displayImage: null as null, isRecommended: false, resolvedCode: undefined };
          }
          if (!resolvedCode) {
            resolvedCode = a.id;
          }
          displayImage = resolvedCode ? getMaterialByCode(resolvedCode)?.imageUrl : null;
          isRecommended = recommendedCodes.size > 0 && !!recommendedMat;
        }

        const archetypeDescriptorScore = archetypeMats.reduce(
          (sum, m) => sum + getDescriptorScore(m.technicalCode, otherMaterialCodes ?? []), 0
        );
        return { archetype: a, displayImage, isRecommended, resolvedCode, archetypeDescriptorScore };
      })
      .filter((item): item is { archetype: Archetype; displayImage: string; isRecommended: boolean; resolvedCode: string | undefined; archetypeDescriptorScore: number } =>
        item.displayImage !== null && item.displayImage !== undefined
      )
      .sort((a, b) => {
        // Fixed canonical order — chips must not jump as materials are placed.
        const order = getArchetypesByRole(role);
        return order.findIndex(x => x.id === a.archetype.id) - order.findIndex(x => x.id === b.archetype.id);
      });
  }, [slot, selections, otherMaterialCodes, selectedMaterialCode, getRecommendedCodes, graphMaterials, filterEmptyArchetypes, perChipBestCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Effective active archetype ───────────────────────────────────────────
  const effectiveActiveId = useMemo(() => {
    if (activeArchetypeId && availableWithImages.some(i => i.archetype.id === activeArchetypeId)) return activeArchetypeId;
    const selId = slot ? selections[slot] : null;
    if (selId && availableWithImages.some(i => i.archetype.id === selId)) return selId;
    // If same-role slots already have materials, open the first archetype not yet used in this role.
    // Use selections (not m.archetypeId) — plain front materials have archetypeId=null so the
    // chip must be read from selections. Search canonical archetype order, not descriptor-score order.
    if (sameRoleMaterialCodes?.length && slot) {
      const role = SLOT_KEY_TO_ROLE[slot];
      const usedIds = new Set(
        (Object.keys(SLOT_KEY_TO_ROLE) as (keyof typeof SLOT_KEY_TO_ROLE)[])
          .filter(k => k !== slot && SLOT_KEY_TO_ROLE[k] === role && !!selections[k])
          .map(k => selections[k])
          .filter((id): id is string => !!id)
      );
      const available = new Set(availableWithImages.map(i => i.archetype.id));
      const next = getArchetypesByRole(role).find(a => !usedIds.has(a.id) && available.has(a.id));
      if (next) return next.id;
    }
    // Default: first archetype in canonical order that has materials available.
    if (slot) {
      const role = SLOT_KEY_TO_ROLE[slot];
      const available = new Set(availableWithImages.map(i => i.archetype.id));
      const first = getArchetypesByRole(role).find(a => available.has(a.id));
      if (first) return first.id;
    }
    return availableWithImages[0]?.archetype.id ?? null;
  }, [activeArchetypeId, availableWithImages, slot, selections, sameRoleMaterialCodes, graphMaterials]);

  // Collapse sibling expansion + reset grid center when archetype changes
  useEffect(() => {
    setExpandedClusterKey(null);
    setGridCenterCode(null);
  }, [effectiveActiveId]); // eslint-disable-line react-hooks/exhaustive-deps

  // All materials — no layout_pattern filtering (layout is display metadata, not a picker filter)
  const filteredMaterials = graphMaterials ?? [];

  // ─── Global palette rank map (all materials, no pair filter) ─────────────
  const paletteRankByCode = useMemo((): Map<string, number> => {
    if (!SHOW_COLOUR_SCORES || !slot || !getAllRankedCodes) return new Map();
    const role = SLOT_KEY_TO_ROLE[slot];
    const chipId = isPlainFrontChip(effectiveActiveId, role) ? effectiveActiveId : undefined;
    const codes = getAllRankedCodes(otherMaterialCodes ?? [], role, undefined, chipId);
    return new Map(codes.map((code, i) => [code, i + 1]));
  }, [slot, getAllRankedCodes, otherMaterialCodes, effectiveActiveId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Grid data (inline mode) ──────────────────────────────────────────────

  // Full ranked list for the current slot — chip-aware for plain front archetypes
  const allRankedCodes = useMemo((): string[] => {
    if (!slot || !getAllRankedCodes) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const chipId = isPlainFrontChip(effectiveActiveId, role) ? effectiveActiveId : undefined;
    return getAllRankedCodes(otherMaterialCodes ?? [], role, undefined, chipId);
  }, [slot, getAllRankedCodes, otherMaterialCodes, effectiveActiveId]); // eslint-disable-line react-hooks/exhaustive-deps

  // All materials in the active archetype with images (grid pool)
  const gridPool = useMemo((): SupabaseMaterial[] => {
    if (!slot || !effectiveActiveId || !graphMaterials?.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    return graphMaterials.filter(m =>
      (isPlainFrontChip(effectiveActiveId, role) ? m.texture === 'plain' : m.archetypeId === effectiveActiveId)
      && m.role.includes(role) && !!m.imageUrl
    );
  }, [slot, effectiveActiveId, graphMaterials]);

  // The material at the center of the 3×3 grid
  const effectiveGridCenter = useMemo((): SupabaseMaterial | null => {
    const role = slot ? SLOT_KEY_TO_ROLE[slot] : '';
    const plainChip = isPlainFrontChip(effectiveActiveId, role);
    const inChip = (m: SupabaseMaterial) => plainChip ? m.texture === 'plain' : m.archetypeId === effectiveActiveId;
    // User-navigated center
    if (gridCenterCode) {
      const m = graphMaterials?.find(m => m.technicalCode === gridCenterCode);
      if (m && inChip(m)) return m;
    }
    // Currently selected material (if it belongs to the active archetype)
    if (selectedMaterialCode) {
      const m = graphMaterials?.find(m => m.technicalCode === selectedMaterialCode);
      if (m && inChip(m)) return m;
    }
    // Best ranked in this archetype
    if (allRankedCodes.length > 0 && gridPool.length > 0) {
      const rankIndex = new Map(allRankedCodes.map((c, i) => [c, i]));
      const ranked = gridPool
        .filter(m => rankIndex.has(m.technicalCode))
        .sort((a, b) => rankIndex.get(a.technicalCode)! - rankIndex.get(b.technicalCode)!);
      return ranked[0] ?? gridPool[0];
    }
    // No ranked context (nothing else selected) — mirror the chip's fallback:
    // most pair entries as primary signal, descriptor score as tiebreaker.
    if (gridPool.length > 0) {
      return gridPool.reduce((best, m) => {
        const descM    = getDescriptorScore(m.technicalCode, otherMaterialCodes ?? []);
        const descBest = getDescriptorScore(best.technicalCode, otherMaterialCodes ?? []);
        if (descM !== descBest) return descM > descBest ? m : best;
        return getPairCountByCode(m.technicalCode) > getPairCountByCode(best.technicalCode) ? m : best;
      });
    }
    return null;
  }, [gridCenterCode, graphMaterials, effectiveActiveId, selectedMaterialCode, allRankedCodes, gridPool, otherMaterialCodes]);



  // Non-center cells for the alternatives strip, sorted by palette rank
  // Best palette-ranked code per archetype (used for chip image + click target)
  const bestCodeByArchetypeId = useMemo((): Map<string, string> => {
    const map = new Map<string, string>();
    for (const { archetype, resolvedCode } of availableWithImages) {
      const best = perChipBestCode.get(archetype.id);
      if (best) { map.set(archetype.id, best); continue; }
      if (resolvedCode) map.set(archetype.id, resolvedCode);
    }
    return map;
  }, [availableWithImages, perChipBestCode]);

// ─── Inline row data ──────────────────────────────────────────────────────

  // Cluster id lookup — needed for deduplication in recommended and flat rows
  const clusterIdByCode = useMemo(
    () => new Map((graphMaterials ?? []).map(m => [m.technicalCode, m.clusterId ?? null])),
    [graphMaterials],
  );

  // Recommended section: all materials ranked by compatibility score
  // Not applicable to accents — they use archetypeId as code and pair with everything
  const recommendedItems = useMemo((): RowItem[] => {
    if (!slot || !graphMaterials?.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    if (role === "accent") return [];
    const recCodes = getRecommendedCodes
      ? getRecommendedCodes(null, otherMaterialCodes ?? [], role)
      : [];
    if (recCodes.length === 0) return [];
    const recIndex = new Map(recCodes.map((c, i) => [c, i]));
    return graphMaterials
      .filter(m =>
        m.role.includes(role) && m.imageUrl && recIndex.has(m.technicalCode) &&
        !wouldTriggerWoodWarning(m.technicalCode, sameRoleMaterialCodes ?? [], (otherMaterialCodes ?? []).filter(c => !(sameRoleMaterialCodes ?? []).includes(c))) &&
        !wouldTriggerBusyPatternWarning(m.technicalCode, otherMaterialCodes ?? [])
      )
      .sort((a, b) => recIndex.get(a.technicalCode)! - recIndex.get(b.technicalCode)!)
      .map(m => ({
        code: m.technicalCode,
        image: m.imageUrl!,
        name: m.name?.[lang] ?? m.technicalCode,
        materialName: m.name?.[lang] ?? m.technicalCode,
        isSelected: m.technicalCode === selectedMaterialCode,
        isRecommended: true,
        matchesAll: matchesAllOtherCodes(m.technicalCode, otherMaterialCodes ?? []),
        archetypeId: m.archetypeId!,
      }));
  }, [slot, graphMaterials, otherMaterialCodes, sameRoleMaterialCodes, getRecommendedCodes, selectedMaterialCode, lang]);

  // De-duplicate recommended by cluster — one representative per cluster (highest-scored first)
  const clusteredRecommendedItems = useMemo((): RowItem[] => {
    const seen = new Set<string>();
    return recommendedItems.filter(item => {
      const key = clusterIdByCode.get(item.code) ?? item.code;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [recommendedItems, clusterIdByCode]);

  // Only the shown representatives are excluded from the flat row —
  // siblings remain available there for expansion
  const recommendedCodes = useMemo(() => new Set(clusteredRecommendedItems.map(r => r.code)), [clusteredRecommendedItems]);

  // Row 1: best-ranked material per archetype (excluding recommended — those appear above).
  // Representative is chosen by global palette rank so the row always surfaces the best overall
  // match. Within-cluster ranking is reserved for ordering the expanded siblings view.
  const row1Items = useMemo((): RowItem[] => {
    if (!slot || !graphMaterials?.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    return availableWithImages.map(({ archetype }) => {
      const candidates = graphMaterials.filter(m =>
        (isPlainFrontChip(archetype.id, role) ? m.texture === 'plain' : m.archetypeId === archetype.id)
        && m.role.includes(role) && m.imageUrl && !recommendedCodes.has(m.technicalCode)
      );
      if (candidates.length === 0) return null;

      const hasRanks = paletteRankByCode.size > 0;
      const best = candidates.slice().sort((a, b) => hasRanks
        ? (paletteRankByCode.get(a.technicalCode) ?? Infinity) - (paletteRankByCode.get(b.technicalCode) ?? Infinity)
        : getCompatibilityScore(b.technicalCode, otherMaterialCodes ?? []) - getCompatibilityScore(a.technicalCode, otherMaterialCodes ?? []) ||
          getPairCountByCode(b.technicalCode) - getPairCountByCode(a.technicalCode) ||
          getDescriptorScore(b.technicalCode, otherMaterialCodes ?? []) - getDescriptorScore(a.technicalCode, otherMaterialCodes ?? [])
      )[0];

      return { code: best.technicalCode, image: best.imageUrl!, name: archetype.label[lang],
               materialName: best.name?.[lang] ?? best.technicalCode,
               isSelected: best.technicalCode === selectedMaterialCode, isRecommended: false, matchesAll: false,
               archetypeId: archetype.id };
    }).filter((x): x is RowItem => x !== null)
      .sort((a, b) =>
        Number(b.isSelected) - Number(a.isSelected) ||
        (paletteRankByCode.size > 0
          ? (paletteRankByCode.get(a.code) ?? Infinity) - (paletteRankByCode.get(b.code) ?? Infinity)
          : 0)
      );
  }, [slot, graphMaterials, availableWithImages, recommendedCodes, selectedMaterialCode, lang, paletteRankByCode, otherMaterialCodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Variants for modal mode ──────────────────────────────────────────────
  const activeVariants = useMemo(() => {
    if (!slot || !effectiveActiveId || !filteredMaterials.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    return filteredMaterials
      .filter(m =>
        (isPlainFrontChip(effectiveActiveId, role) ? m.texture === 'plain' : m.archetypeId === effectiveActiveId)
        && m.role.includes(role) && m.imageUrl
      )
      .map(m => ({
        code: m.technicalCode, image: m.imageUrl!,
        name: m.name?.[lang] ?? m.technicalCode,
        isSelected: m.technicalCode === selectedMaterialCode,
        isRecommended: recommendedCodes.size > 0 && recommendedCodes.has(m.technicalCode),
        matchesAll: recommendedCodes.has(m.technicalCode) && matchesAllOtherCodes(m.technicalCode, otherMaterialCodes ?? []),
      }))
      .sort((a, b) =>
        Number(b.isSelected) - Number(a.isSelected) ||
        Number(b.isRecommended) - Number(a.isRecommended) ||
        getCompatibilityScore(b.code, otherMaterialCodes ?? []) - getCompatibilityScore(a.code, otherMaterialCodes ?? []) ||
        getPairCountByCode(b.code) - getPairCountByCode(a.code) ||
        getDescriptorScore(b.code, otherMaterialCodes ?? []) - getDescriptorScore(a.code, otherMaterialCodes ?? [])
      );
  }, [slot, effectiveActiveId, filteredMaterials, recommendedCodes, selectedMaterialCode, lang]);

  // All materials in the active archetype, excluding row 1's representative
  const archetypeFlatItems = useMemo((): RowItem[] => {
    if (!slot || !effectiveActiveId || !filteredMaterials.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const row1Code = row1Items.find(r => r.archetypeId === effectiveActiveId)?.code;
    const candidates = filteredMaterials.filter(m =>
      (isPlainFrontChip(effectiveActiveId, role) ? m.texture === 'plain' : m.archetypeId === effectiveActiveId) &&
      m.role.includes(role) &&
      m.imageUrl &&
      m.technicalCode !== row1Code &&
      !recommendedCodes.has(m.technicalCode)
    );

    const sorted = candidates.slice().sort((a, b) => paletteRankByCode.size > 0
      ? (paletteRankByCode.get(a.technicalCode) ?? Infinity) - (paletteRankByCode.get(b.technicalCode) ?? Infinity)
      : getDescriptorScore(b.technicalCode, otherMaterialCodes ?? []) - getDescriptorScore(a.technicalCode, otherMaterialCodes ?? []) ||
        getPairCountByCode(b.technicalCode) - getPairCountByCode(a.technicalCode)
    );

    return sorted.map(m => ({
      code: m.technicalCode,
      image: m.imageUrl!,
      name: m.name?.[lang] ?? m.technicalCode,
      materialName: m.name?.[lang] ?? m.technicalCode,
      isSelected: m.technicalCode === selectedMaterialCode,
      isRecommended: recommendedCodes.has(m.technicalCode),
      matchesAll: false,
      archetypeId: effectiveActiveId,
    }));
  }, [slot, effectiveActiveId, filteredMaterials, row1Items, recommendedCodes, selectedMaterialCode, lang, paletteRankByCode, otherMaterialCodes]); // eslint-disable-line

  // ─── v2: direction-grouped candidates for the "Explore similar" section ──────
  // Only computed when the parent passes getClusteredRankedCodes (v2 engine path).
  // Pass effectiveActiveId unconditionally so the hook scopes the pool by archetype
  // (otherwise stone floor materials leak into the wood floor chip, etc.).
  // After scoring, filter to the showroom pool: getClusteredRankedCodes scores against
  // the full _cached.graphMaterials, but graphMaterials prop is already showroom-filtered.
  const clusteredRankedV2 = useMemo((): RankedClusteredEntry[] => {
    if (!slot || !effectiveActiveId || !getClusteredRankedCodes) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const entries = getClusteredRankedCodes(otherMaterialCodes ?? [], role, effectiveActiveId);
    if (!graphMaterials?.length) return entries;
    const allowed = new Set(graphMaterials.map(m => m.technicalCode));
    return entries.filter(e => allowed.has(e.code));
  }, [slot, effectiveActiveId, otherMaterialCodes, getClusteredRankedCodes, graphMaterials]); // eslint-disable-line react-hooks/exhaustive-deps

  const directionGroups = useMemo((): Array<[DirectionId, RankedClusteredEntry]> => {
    if (!effectiveActiveId) return [];
    const order = DIRECTIONS_BY_ARCHETYPE[effectiveActiveId] ?? [];
    if (order.length === 0) return [];

    // Pass 1: find best directionScore per direction and collect all candidates per direction.
    // Don't claim usedCodes yet — directions that don't pass the threshold shouldn't block candidates.
    const maxScoreByDirection = new Map<DirectionId, number>();
    const candidatesByDirection = new Map<DirectionId, RankedClusteredEntry[]>();
    for (const c of clusteredRankedV2) {
      if (!c.direction) continue;
      const prev = maxScoreByDirection.get(c.direction) ?? 0;
      if (c.directionScore > prev) maxScoreByDirection.set(c.direction, c.directionScore);
      if (!candidatesByDirection.has(c.direction)) candidatesByDirection.set(c.direction, []);
      candidatesByDirection.get(c.direction)!.push(c);
    }

    // Pass 2: keep only directions that pass the threshold.
    const passingSet = new Set(order.filter(d => {
      const threshold = directionMinScore(effectiveActiveId, d);
      return threshold === 0 || (maxScoreByDirection.get(d) ?? 0) >= threshold;
    }));

    // Claim in CLAIMING_PRIORITY order so tonal_match (most specific) gets first pick,
    // not lighter_echo just because it appears first in the display order.
    const claimingOrder = (CLAIMING_PRIORITY[effectiveActiveId] ?? order) as DirectionId[];
    const usedCodes = new Set<string>();
    const topByDirection = new Map<DirectionId, RankedClusteredEntry>();
    for (const d of claimingOrder) {
      if (!passingSet.has(d)) continue;
      for (const c of candidatesByDirection.get(d) ?? []) {
        if (!usedCodes.has(c.code)) {
          topByDirection.set(d, c);
          usedCodes.add(c.code);
          break;
        }
      }
    }

    const pairs = order
      .filter(d => passingSet.has(d) && topByDirection.has(d))
      .map((d): [DirectionId, RankedClusteredEntry] => [d, topByDirection.get(d)!]);

    // Wood: sort by representative material lightness so swatches read light → dark.
    if (effectiveActiveId === 'wood') {
      pairs.sort(([, a], [, b]) =>
        (getMaterialByCode(b.code)?.lightness ?? 50) - (getMaterialByCode(a.code)?.lightness ?? 50)
      );
    }
    return pairs;
  }, [clusteredRankedV2, effectiveActiveId]);


  // When there's only one direction, auto-activate it so alternatives show without clicking.
  const effectiveDirection = activeDirection ?? (directionGroups.length === 1 ? directionGroups[0][0] : null);

  // Top 8 alternatives from the active direction (selected item stays and shows checkmark)
  const directionTopItems = useMemo((): RowItem[] => {
    if (!effectiveDirection || !slot) return [];
    const seen = new Set<string>();
    const items: RowItem[] = [];
    for (const e of clusteredRankedV2) {
      if (e.direction !== effectiveDirection) continue;
      if (seen.has(e.code)) continue;
      seen.add(e.code);
      const mat = getMaterialByCode(e.code);
      if (!mat?.imageUrl) continue;
      items.push({
        code: e.code,
        image: mat.imageUrl,
        name: mat.name?.[lang] ?? e.code,
        materialName: mat.name?.[lang] ?? e.code,
        isSelected: e.code === selectedMaterialCode,
        isRecommended: false,
        matchesAll: false,
        archetypeId: effectiveActiveId ?? '',
      });
      if (items.length >= 8) break;
    }
    return items;
  }, [effectiveDirection, clusteredRankedV2, selectedMaterialCode, slot, lang, effectiveActiveId]);

  // Browse-all mode: auto-activates when no directions qualify; user can also trigger manually.
  // Shows a 3×3 grid centered on the current/best material, with 8 neighbors spread across L/W space.
  const effectiveBrowse = browseAll || directionGroups.length === 0;

  const BROWSE_DELTA_L = 22;
  const BROWSE_DELTA_W = 0.18;
  // [row][col] → [deltaL, deltaW]
  // Rows: top=warmer (+W), middle=neutral, bottom=cooler (-W)
  // Cols: left=lighter (+L), middle=same, right=darker (-L)
  const BROWSE_OFFSETS: [number, number][][] = [
    [[+BROWSE_DELTA_L, +BROWSE_DELTA_W], [0, +BROWSE_DELTA_W], [-BROWSE_DELTA_L, +BROWSE_DELTA_W]],
    [[+BROWSE_DELTA_L, 0              ], [0, 0              ], [-BROWSE_DELTA_L, 0              ]],
    [[+BROWSE_DELTA_L, -BROWSE_DELTA_W], [0, -BROWSE_DELTA_W], [-BROWSE_DELTA_L, -BROWSE_DELTA_W]],
  ];

  const browseGridCells = useMemo((): (SupabaseMaterial | null)[][] => {
    const center = effectiveGridCenter;
    if (!center || gridPool.length === 0) return [];
    const available = new Set(gridPool.map(m => m.technicalCode));

    // Neighbors must be on the correct side of center on each constrained axis.
    // dL > 0 → candidate must be lighter; dL < 0 → must be darker; dL = 0 → unconstrained.
    // Same for dW. Returns null if no qualifying material exists (shows placeholder).
    const closest = (targetL: number, targetW: number, dL: number, dW: number): SupabaseMaterial | null => {
      let best: SupabaseMaterial | null = null;
      let bestDist = Infinity;
      const cW = center.warmth ?? 0;
      for (const m of gridPool) {
        if (!available.has(m.technicalCode)) continue;
        if (dL > 0 && m.lightness <= center.lightness) continue;
        if (dL < 0 && m.lightness >= center.lightness) continue;
        if (dW > 0 && (m.warmth ?? 0) <= cW) continue;
        if (dW < 0 && (m.warmth ?? 0) >= cW) continue;
        const d = Math.abs(m.lightness - targetL) / 40 + Math.abs((m.warmth ?? 0) - targetW) / 0.20;
        if (d < bestDist) { bestDist = d; best = m; }
      }
      return best;
    };

    const result: (SupabaseMaterial | null)[][] = [[null,null,null],[null,null,null],[null,null,null]];
    result[1][1] = center;
    available.delete(center.technicalCode);

    // Edges before corners so the most constrained directions claim their best match first
    const scanOrder: [number, number][] = [[0,1],[1,0],[1,2],[2,1],[0,0],[0,2],[2,0],[2,2]];
    for (const [r, c] of scanOrder) {
      const [dL, dW] = BROWSE_OFFSETS[r][c];
      const m = closest(center.lightness + dL, (center.warmth ?? 0) + dW, dL, dW);
      result[r][c] = m;
      if (m) available.delete(m.technicalCode);
    }
    return result;
  }, [effectiveGridCenter, gridPool]);

  const hasBrowseGrid = !!effectiveGridCenter && gridPool.length > 0;

  // Search results — code substring match within the current slot's role
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchOpen || !q || !slot || !filteredMaterials.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    return filteredMaterials.filter(
      (m) => m.role.includes(role) && m.imageUrl && m.technicalCode.toLowerCase().includes(q)
    );
  }, [searchOpen, searchQuery, slot, filteredMaterials]);

  const selectedId = slot ? selections[slot] : null;
  const isFirstPick = !selectedId;
  const activeArchetypeLabel = availableWithImages.find(i => i.archetype.id === effectiveActiveId)?.archetype.label[lang] ?? "";

  // ─── Modal-mode handlers ──────────────────────────────────────────────────
  const handleArchetypeClick = (archetypeId: string, resolvedCode?: string) => {
    if (slot && SLOT_KEY_TO_ROLE[slot] === "accent") {
      onSelect(slot, archetypeId, archetypeId);
      setTimeout(onClose, 200);
      return;
    }
    if (isFirstPick) {
      onSelect(slot!, archetypeId, resolvedCode);
      setTimeout(onClose, 200);
      return;
    }
    setActiveArchetypeId(archetypeId);
  };

  const handleVariantSelect = (code: string) => {
    if (!slot || !effectiveActiveId) return;
    onSelect(slot, effectiveActiveId, code);
    setTimeout(onClose, 200);
  };

  // ─── Cluster helpers ──────────────────────────────────────────────────────

  const archetypeClusters = useMemo(
    () => buildClusters(archetypeFlatItems, clusterIdByCode),
    [archetypeFlatItems, clusterIdByCode],
  );

  // Expand the cluster containing the selected material; collapse if no cluster matches.
  useEffect(() => {
    for (const cluster of archetypeClusters) {
      if (cluster.siblings.length === 0) continue;
      if (cluster.representative.isSelected || cluster.siblings.some(s => s.isSelected)) {
        setExpandedClusterKey(cluster.representative.code);
        return;
      }
    }
    setExpandedClusterKey(null);
  }, [archetypeClusters]); // eslint-disable-line react-hooks/exhaustive-deps

  const RankBadge = ({ code }: { code: string }) => {
    const rank = paletteRankByCode.get(code);
    if (!rank) return null;
    return (
      <div className="absolute flex items-center justify-center" style={{ top: 3, right: 3, width: 15, height: 15, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <span className="text-[7px] font-bold text-white leading-none">{rank}</span>
      </div>
    );
  };

  // ─── Inline render ────────────────────────────────────────────────────────

  const SWATCH_SIZE = 64;
  const SWATCH_RADIUS = 16;
  const ALT_SWATCH_SIZE = 60;
  const ALT_SWATCH_RADIUS = 12;

  const SwatchRow = ({ children, alignItems = "center", className: extraClass = "" }: { children: React.ReactNode; alignItems?: "center" | "start"; className?: string }) => (
    <div
      className={`flex gap-2.5 px-4 overflow-x-auto flex-shrink-0 ${extraClass}`}
      style={{ scrollbarWidth: "none", alignItems } as React.CSSProperties}
    >
      {children}
    </div>
  );

  const SwatchButton = ({ children, onClick, isActive, size = SWATCH_SIZE, radius = SWATCH_RADIUS }: { children: React.ReactNode; onClick: () => void; isActive: boolean; size?: number; radius?: number }) => (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 active:scale-95"
      style={{
        width: size, height: size,
        borderRadius: radius,
        overflow: "hidden",
        border: isActive ? "2px solid #647d75" : "2px solid transparent",
        transition: "border-color 0.15s, transform 0.1s",
      }}
    >
      {children}
    </button>
  );

  const SwatchDivider = () => (
    <div className="mx-4 flex-shrink-0" style={{ height: "0.5px", backgroundColor: "#e8e4e0" }} />
  );

  if (inline && !slot) return null;

  // pickerBody is shared between inline (div wrapper) and Drawer wrapper
  const pickerBody = (
    <>
        {/* Header: slot title + search icon + optional reset button */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: "0.5px solid #e8e4e0" }}
        >
          {searchOpen ? (
            /* Search input — expands to fill header */
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#647d75" }} strokeWidth={1.6} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={t("surface.searchByCode")}
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: "#1a1a1a" }}
              />
            </div>
          ) : (
            <span className="text-[15px] font-medium flex-1" style={{ color: "#1a1a1a" }}>
              {t(`surface.${slot}`)}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {/* Search toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); setSearchOpen(!searchOpen); setSearchQuery(""); }}
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: searchOpen ? "#647d75" : "#f5f2ef" }}
            >
              {searchOpen ? (
                <X className="w-3 h-3 text-white" strokeWidth={2.5} />
              ) : (
                <Search className="w-3.5 h-3.5" style={{ color: "#9ca3af" }} strokeWidth={1.8} />
              )}
            </button>
            {/* Clear selection — hidden while search is open */}
            {!searchOpen && selectedId && onClear && slot && (
              <button
                onClick={() => onClear(slot)}
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#f5f2ef", color: "#9ca3af" }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            )}
            {/* Close picker */}
            {!searchOpen && (
              <button
                onClick={onClose}
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#f5f2ef" }}
                aria-label="Close picker"
              >
                <X className="w-3.5 h-3.5" style={{ color: "#9ca3af" }} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>

        {/* Surface type pills or other sub-header content */}
        {subHeader}

        {/* Swatch rows — each row scrolls independently */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto justify-start pt-3">

        {searchOpen ? (
          /* ── Search results ── */
          searchResults.length > 0 && searchQuery.trim() ? (
            <SwatchRow alignItems="start" className="pt-3 pb-3 flex-wrap">
              {searchResults.map((mat) => {
                const isSelected = mat.technicalCode === selectedMaterialCode;
                return (
                  <div key={mat.technicalCode} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: SWATCH_SIZE }}>
                    <SwatchButton
                      onClick={() => {
                        if (slot) onSelect(slot, mat.archetypeId ?? mat.technicalCode, mat.technicalCode);
                      }}
                      isActive={isSelected}
                    >
                      <img src={mat.imageUrl!} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#647d75" }}>
                          <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </SwatchButton>
                    <span className="text-[9px] text-center w-full truncate leading-tight font-mono"
                      style={{ color: isSelected ? "#647d75" : "#9ca3af" }}>
                      {mat.technicalCode}
                    </span>
                  </div>
                );
              })}
            </SwatchRow>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{t("surface.searchNoResults")}</p>
            </div>
          )
        ) : (
          <>

          {/* Archetype chips — hidden when only one archetype is available (directions shown directly) */}
          {availableWithImages.length > 1 && (
          <div
            className="flex gap-2.5 px-4 pb-3 overflow-x-auto flex-shrink-0"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {availableWithImages.map(({ archetype, displayImage, resolvedCode }) => {
              const isActive = archetype.id === activeArchetypeId;
              const isChosen = !!selectedMaterialCode && !!slot && selections[slot] === archetype.id;
              // Prefer palette-ranked best; fall back to availableWithImages resolvedCode
              const bestCode = bestCodeByArchetypeId.get(archetype.id) ?? resolvedCode;
              // Chip shows the chosen texture when one exists, otherwise the top-ranked recommendation
              const chipImage = isChosen
                ? (getMaterialByCode(selectedMaterialCode!)?.imageUrl ?? displayImage)
                : (bestCode ? (getMaterialByCode(bestCode)?.imageUrl ?? displayImage) : displayImage);
              return (
                <button
                  key={`chip-${archetype.id}`}
                  onClick={() => {
                    setActiveArchetypeId(archetype.id);
                    setActiveDirection(null);
                    setGridCenterCode(bestCode ?? null);
                    if (slot && bestCode && !isChosen) onSelect(slot, archetype.id, bestCode);
                  }}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div
                    className="relative w-[68px] h-[68px] overflow-hidden"
                    style={{
                      borderRadius: 14,
                      border: isActive || isChosen ? "2px solid #647d75" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img src={chipImage} alt={archetype.label[lang]} className="w-full h-full object-cover" />
                    {isChosen && (
                      <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#647d75' }}>
                        <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[10px] whitespace-nowrap leading-none"
                    style={{
                      color: isActive || isChosen ? "#1a1a1a" : "#9ca3af",
                      fontWeight: isActive || isChosen ? 500 : 400,
                    }}
                  >
                    {archetype.label[lang]}
                  </span>
                </button>
              );
            })}
          </div>
          )}

          {/* Direction groups — shown immediately when one archetype, or after chip click when multiple */}
          {(activeArchetypeId || availableWithImages.length === 1) && (
          <div style={{ animation: "msPickerFadeIn 0.2s ease both", backgroundColor: "#ffffff" }}>
            <style>{`@keyframes msPickerFadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes cellPopIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>

          <SwatchDivider />

          {availableWithImages.length > 1 && (
          <div className="px-4 pt-3 pb-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.35)", fontWeight: 500 }}>
              {t("surface.otherOptionsPrefix")}{activeArchetypeLabel}{t("surface.otherOptionsSuffix")}
            </span>
          </div>
          )}

          {/* Direction swatches — one per direction, plus a Browse tab for neutral exploration. */}
          {(directionGroups.length > 0 || hasBrowseGrid) ? (
            <div
              className="flex gap-2.5 px-4 pt-4 pb-4 overflow-x-auto flex-shrink-0"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              {directionGroups.map(([direction, entry]) => {
                const camel = direction.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
                const label = t(`surface.direction.${camel}`);
                const mat = entry ? getMaterialByCode(entry.code) : null;
                const hasMatch = !!mat?.imageUrl;
                const isSelected = hasMatch && mat!.technicalCode === selectedMaterialCode;

                if (!hasMatch) {
                  return (
                    <div
                      key={`dir-${direction}`}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      style={{ width: SWATCH_SIZE }}
                      title="No candidate in the current pool maps to this direction"
                    >
                      <div
                        className="flex-shrink-0"
                        style={{
                          width: SWATCH_SIZE,
                          height: SWATCH_SIZE,
                          borderRadius: SWATCH_RADIUS,
                          backgroundColor: '#f0ede9',
                          border: '1px dashed #d8d4cf',
                        }}
                      />
                      <span
                        className="text-[10px] text-center leading-tight"
                        style={{ color: 'rgba(0,0,0,0.30)', maxWidth: SWATCH_SIZE + 12 }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={`dir-${direction}`}
                    onClick={() => {
                      setActiveDirection(direction);
                      setActiveScoringDirection(direction);
                      setBrowseAll(false);
                      if (slot && effectiveActiveId && entry) onSelect(slot, effectiveActiveId, entry.code);
                    }}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    style={{ width: SWATCH_SIZE }}
                  >
                    <div
                      className="relative flex-shrink-0 active:scale-95"
                      style={{
                        width: SWATCH_SIZE,
                        height: SWATCH_SIZE,
                        borderRadius: SWATCH_RADIUS,
                        overflow: 'hidden',
                        border: isSelected ? '2px solid #647d75' : '2px solid transparent',
                        transition: 'border-color 0.15s, transform 0.1s',
                      }}
                    >
                      <img src={mat!.imageUrl!} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#647d75' }}>
                          <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[10px] text-center leading-tight"
                      style={{
                        color: isSelected ? '#647d75' : 'rgba(0,0,0,0.55)',
                        fontWeight: isSelected ? 500 : 400,
                        maxWidth: SWATCH_SIZE + 12,
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
              {/* Browse tab — always last; bypasses direction scoring, shows full 3×3 grid */}
              {hasBrowseGrid && (
                <button
                  onClick={() => { setBrowseAll(true); setActiveDirection(null); setActiveScoringDirection(null); setGridCenterCode(null); }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                  style={{ width: SWATCH_SIZE }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: SWATCH_SIZE,
                      height: SWATCH_SIZE,
                      borderRadius: SWATCH_RADIUS,
                      backgroundColor: '#f0ede9',
                      border: effectiveBrowse ? '2px solid #647d75' : '2px solid transparent',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="1" y="1" width="6" height="6" rx="1.5" fill={effectiveBrowse ? '#647d75' : 'rgba(0,0,0,0.25)'} />
                      <rect x="11" y="1" width="6" height="6" rx="1.5" fill={effectiveBrowse ? '#647d75' : 'rgba(0,0,0,0.25)'} />
                      <rect x="1" y="11" width="6" height="6" rx="1.5" fill={effectiveBrowse ? '#647d75' : 'rgba(0,0,0,0.25)'} />
                      <rect x="11" y="11" width="6" height="6" rx="1.5" fill={effectiveBrowse ? '#647d75' : 'rgba(0,0,0,0.25)'} />
                    </svg>
                  </div>
                  <span
                    className="text-[10px] text-center leading-tight"
                    style={{
                      color: effectiveBrowse ? '#647d75' : 'rgba(0,0,0,0.55)',
                      fontWeight: effectiveBrowse ? 500 : 400,
                      maxWidth: SWATCH_SIZE + 12,
                    }}
                  >
                    {t('surface.direction.browse')}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{t("surface.searchNoResults")}</p>
            </div>
          )}

          {/* Browse 3×3 grid — center = current/best material, 8 neighbors spread in L/W space */}
          {effectiveBrowse && hasBrowseGrid && (
            <>
              <SwatchDivider />
              <div ref={browseGridRef} className="pt-2 pb-4 flex-shrink-0 flex justify-center">
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {/* Column headers */}
                  <div style={{ display: 'flex', gap: 6, paddingLeft: 20 }}>
                    {[t('surface.browse.light'), '', t('surface.browse.dark')].map((label, c) => (
                      <div key={c} style={{ width: SWATCH_SIZE, flexShrink: 0, textAlign: c === 2 ? 'right' : 'left' }}>
                        <span className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(0,0,0,0.30)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Data rows */}
                  {browseGridCells.map((rowCells, r) => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="text-[8px] uppercase tracking-wide" style={{
                          color: 'rgba(0,0,0,0.30)',
                          writingMode: 'vertical-lr' as const,
                          transform: 'rotate(180deg)',
                          lineHeight: 1,
                        }}>
                          {r === 0 ? t('surface.browse.warm') : r === 2 ? t('surface.browse.cool') : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {rowCells.map((mat, c) => {
                          const isCenter = r === 1 && c === 1;
                          const isSelected = mat?.technicalCode === selectedMaterialCode;
                          const dist = Math.max(Math.abs(r - 1), Math.abs(c - 1));
                          const cellStyle = {
                            width: SWATCH_SIZE, height: SWATCH_SIZE, flexShrink: 0,
                            borderRadius: SWATCH_RADIUS, overflow: 'hidden' as const,
                            border: isSelected ? '2px solid #647d75' : isCenter ? '2px solid rgba(0,0,0,0.15)' : '2px solid transparent',
                            transition: 'border-color 0.15s, transform 0.1s',
                            animation: `cellPopIn 0.22s ease-out ${dist * 60}ms both`,
                          };
                          return mat ? (
                            <button key={c} onClick={() => {
                              if (slot && effectiveActiveId) {
                                setGridCenterCode(mat.technicalCode);
                                onSelect(slot, effectiveActiveId, mat.technicalCode);
                              }
                            }}
                              className="relative active:scale-95" style={cellStyle}>
                              <img src={mat.imageUrl!} alt="" className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#647d75' }}>
                                  <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                                </div>
                              )}
                            </button>
                          ) : (
                            <div key={c} style={{ ...cellStyle, backgroundColor: '#f5f4f2', border: '1px dashed #d8d4cf' }} />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Direction alternatives strip — top items from the active direction */}
          {!effectiveBrowse && effectiveDirection && directionTopItems.length > 0 && (
            <>
              <SwatchDivider />
              <div className="px-4 pt-4 pb-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.35)", fontWeight: 500 }}>
                  {t("surface.similarShades")}
                </span>
              </div>
              <div
                className="flex gap-2 px-4 pb-5 pt-2 overflow-x-auto flex-shrink-0"
                style={{ scrollbarWidth: "none" } as React.CSSProperties}
              >
                {directionTopItems.map(item => (
                  <button
                    key={`dtop-${item.code}`}
                    onClick={() => { if (slot && effectiveActiveId) onSelect(slot, effectiveActiveId, item.code); }}
                    className="relative flex-shrink-0 active:scale-95"
                    style={{
                      width: ALT_SWATCH_SIZE,
                      height: ALT_SWATCH_SIZE,
                      borderRadius: ALT_SWATCH_RADIUS,
                      overflow: "hidden",
                      border: item.isSelected ? "2px solid #647d75" : "2px solid transparent",
                      transition: "border-color 0.15s, transform 0.1s",
                    }}
                  >
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                    {item.isSelected && (
                      <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#647d75' }}>
                        <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Request link */}
          <div className="flex justify-center px-4 pt-2 pb-4 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowRequestDialog(true); }}
              className="text-[11px] underline underline-offset-2"
              style={{ color: "rgba(0,0,0,0.35)" }}
            >
              {t("materialRequest.link")}
            </button>
          </div>

          </div>
          )}

          </>
        )}

        </div>

      <MaterialRequestDialog
        isOpen={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        slotLabel={slot ? t(`surface.${slot}`) : ""}
      />
    </>
  );

  if (inline) {
    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "#f9f8f7" }}>
        <div
          ref={inlineDragHandleRef}
          style={{ touchAction: "none", padding: "8px 0 4px", flexShrink: 0, cursor: "grab" }}
          onPointerDown={(e) => {
            inlineDragStartY.current = e.clientY;
            inlineDragging.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            const panel = inlineDragHandleRef.current?.parentElement as HTMLElement | null;
            if (panel) panel.style.transition = "none";
          }}
          onPointerMove={(e) => {
            if (!inlineDragging.current) return;
            const dy = Math.max(0, e.clientY - inlineDragStartY.current);
            const panel = inlineDragHandleRef.current?.parentElement as HTMLElement | null;
            if (panel) panel.style.opacity = String(Math.max(0.25, 1 - dy / 160));
          }}
          onPointerUp={(e) => {
            if (!inlineDragging.current) return;
            inlineDragging.current = false;
            const dy = e.clientY - inlineDragStartY.current;
            const panel = inlineDragHandleRef.current?.parentElement as HTMLElement | null;
            if (dy > 60) {
              onClose();
            } else if (panel) {
              panel.style.transition = "opacity 0.15s";
              panel.style.opacity = "";
              setTimeout(() => { if (panel) panel.style.transition = ""; }, 150);
            }
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e0dbd5", margin: "0 auto" }} />
        </div>
        {pickerBody}
      </div>
    );
  }

  // ─── Modal (Drawer) render ─────────────────────────────────────────────────
  return (
    <Drawer open={slot !== null} onOpenChange={(open) => !open && onClose()} shouldScaleBackground={false}>
      <DrawerContent
        className="p-0 overflow-hidden h-[62vh] sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2"
        aria-describedby={undefined}
      >
        <DrawerTitle className="sr-only">{slot ? t(`surface.${slot}`) : ""}</DrawerTitle>
        {pickerBody}
      </DrawerContent>
    </Drawer>
  );
}
