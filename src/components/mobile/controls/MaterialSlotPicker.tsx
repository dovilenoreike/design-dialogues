import { useMemo, useState, useEffect } from "react";
import { Check, CheckCheck, Trash2, X, Search, RotateCcw } from "lucide-react";
import { SHOW_COLOUR_SCORES } from "@/lib/material-generation-utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArchetypesByRole } from "@/data/archetypes";
import { getMaterialByCode, getPairCountByCode, getCompatibilityScore, matchesAllOtherCodes, wouldTriggerWoodWarning, wouldTriggerBusyPatternWarning, getDescriptorScore } from "@/hooks/useGraphMaterials";
import type { MaterialRole } from "@/types/material-types";
import type { Archetype } from "@/data/archetypes/types";
import type { SupabaseMaterial } from "@/hooks/useGraphMaterials";
import MaterialRequestDialog from "./MaterialRequestDialog";
import { buildMaterialGrid, type GridCell } from "@/lib/material-grid";

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
  getAllRankedCodes?: (otherCodes: string[], role: string) => string[];
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
  graphMaterials,
  filterEmptyArchetypes = false,
  inline = false,
  subHeader,
  isCompatibleWithOthers,
  isCompatibleWithEvery,
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

  // Reset internal state when slot changes
  useEffect(() => {
    setActiveArchetypeId(null);
    setSearchOpen(false);
    setSearchQuery("");
    setShowRequestDialog(false);
    setExpandedClusterKey(null);
    setGridCenterCode(null);
  }, [slot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset grid center when selection is cleared (flatlay reset) so the center
  // re-derives from best-ranked rather than showing the stale previous pick.
  useEffect(() => {
    if (!selectedMaterialCode) setGridCenterCode(null);
  }, [selectedMaterialCode]);

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
        const archetypeMats = mats.filter((m) => m.archetypeId === a.id && m.role.includes(role));
        const recommendedMat = archetypeMats.find((m) => recommendedCodes.has(m.technicalCode));

        let displayImage: string | null | undefined;
        let resolvedCode: string | undefined;
        let isRecommended: boolean;

        if (selectedMaterialCode && a.id === selections[slot]) {
          displayImage = getMaterialByCode(selectedMaterialCode)?.imageUrl;
          resolvedCode = selectedMaterialCode;
          isRecommended = recommendedCodes.size > 0 && recommendedCodes.has(selectedMaterialCode);
        } else {
          const primaryMat = recommendedMat ?? (
            archetypeMats.length > 0
              ? archetypeMats.reduce((best, m) => {
                  const descM    = getDescriptorScore(m.technicalCode, otherMaterialCodes ?? []);
                  const descBest = getDescriptorScore(best.technicalCode, otherMaterialCodes ?? []);
                  if (descM !== descBest) return descM > descBest ? m : best;
                  return getPairCountByCode(m.technicalCode) > getPairCountByCode(best.technicalCode) ? m : best;
                })
              : undefined
          );
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
      .sort((a, b) =>
        Number(b.isRecommended) - Number(a.isRecommended) ||
        b.archetypeDescriptorScore - a.archetypeDescriptorScore
      );
  }, [slot, selections, otherMaterialCodes, selectedMaterialCode, getRecommendedCodes, graphMaterials, filterEmptyArchetypes]);

  // ─── Effective active archetype ───────────────────────────────────────────
  const effectiveActiveId = useMemo(() => {
    if (activeArchetypeId && availableWithImages.some(i => i.archetype.id === activeArchetypeId)) return activeArchetypeId;
    const selId = slot ? selections[slot] : null;
    if (selId && availableWithImages.some(i => i.archetype.id === selId)) return selId;
    return availableWithImages[0]?.archetype.id ?? null;
  }, [activeArchetypeId, availableWithImages, slot, selections]);

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
    const codes = getAllRankedCodes(otherMaterialCodes ?? [], role);
    return new Map(codes.map((code, i) => [code, i + 1]));
  }, [slot, getAllRankedCodes, otherMaterialCodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Grid data (inline mode) ──────────────────────────────────────────────

  // Full ranked list for the current slot (not gated by SHOW_COLOUR_SCORES)
  const allRankedCodes = useMemo((): string[] => {
    if (!slot || !getAllRankedCodes) return [];
    return getAllRankedCodes(otherMaterialCodes ?? [], SLOT_KEY_TO_ROLE[slot]);
  }, [slot, getAllRankedCodes, otherMaterialCodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // All materials in the active archetype with images (grid pool)
  const gridPool = useMemo((): SupabaseMaterial[] => {
    if (!slot || !effectiveActiveId || !graphMaterials?.length) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    return graphMaterials.filter(
      m => m.archetypeId === effectiveActiveId && m.role.includes(role) && !!m.imageUrl
    );
  }, [slot, effectiveActiveId, graphMaterials]);

  // The material at the center of the 3×3 grid
  const effectiveGridCenter = useMemo((): SupabaseMaterial | null => {
    // User-navigated center
    if (gridCenterCode) {
      const m = graphMaterials?.find(m => m.technicalCode === gridCenterCode);
      if (m?.archetypeId === effectiveActiveId) return m;
    }
    // Currently selected material (if it belongs to the active archetype)
    if (selectedMaterialCode) {
      const m = graphMaterials?.find(m => m.technicalCode === selectedMaterialCode);
      if (m?.archetypeId === effectiveActiveId) return m;
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

  // 3×3 grid cells
  const materialGrid = useMemo((): GridCell[] => {
    if (!effectiveGridCenter || gridPool.length === 0) return [];
    const pool = gridPool.filter(m => m.technicalCode !== effectiveGridCenter.technicalCode);
    return buildMaterialGrid(effectiveGridCenter, pool, allRankedCodes);
  }, [effectiveGridCenter, gridPool, allRankedCodes]);

  // Best palette-ranked code per archetype (used for chip image + click target)
  const bestCodeByArchetypeId = useMemo((): Map<string, string> => {
    if (!slot || !graphMaterials?.length || allRankedCodes.length === 0) return new Map();
    const role = SLOT_KEY_TO_ROLE[slot];
    const rankIndex = new Map(allRankedCodes.map((c, i) => [c, i]));
    const map = new Map<string, string>();
    for (const { archetype } of availableWithImages) {
      const candidates = graphMaterials.filter(
        m => m.archetypeId === archetype.id && m.role.includes(role) && !!m.imageUrl && rankIndex.has(m.technicalCode)
      );
      if (candidates.length === 0) continue;
      candidates.sort((a, b) => rankIndex.get(a.technicalCode)! - rankIndex.get(b.technicalCode)!);
      map.set(archetype.id, candidates[0].technicalCode);
    }
    return map;
  }, [slot, graphMaterials, allRankedCodes, availableWithImages]);

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
        m.role.includes(role) && m.imageUrl && recIndex.has(m.technicalCode) && !!m.archetypeId &&
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
      const candidates = graphMaterials.filter(
        m => m.archetypeId === archetype.id && m.role.includes(role) && m.imageUrl && !recommendedCodes.has(m.technicalCode)
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
      .filter(m => m.archetypeId === effectiveActiveId && m.role.includes(role) && m.imageUrl)
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
      m.archetypeId === effectiveActiveId &&
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

  // ─── Inline-mode handlers ─────────────────────────────────────────────────
  const handleRecommendedClick = (item: RowItem) => {
    if (!slot) return;
    setActiveArchetypeId(item.archetypeId);
    onSelect(slot, item.archetypeId, item.code);
  };

  const handleRow1Click = (item: RowItem) => {
    setActiveArchetypeId(item.archetypeId);
    if (!slot) return;
    onSelect(slot, item.archetypeId, item.code);
  };

  const handleRow3Click = (item: RowItem) => {
    if (slot) onSelect(slot, item.archetypeId, item.code);
  };

  const handleGridCellClick = (cell: GridCell) => {
    if (!cell.material || !slot || !effectiveActiveId) return;
    setGridCenterCode(cell.material.technicalCode);
    onSelect(slot, effectiveActiveId, cell.material.technicalCode);
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

  function renderClusterRow(clusters: ClusterCell[]): React.ReactNode {
    return clusters.map((cluster) => {
      const rep = cluster.representative;
      const hasSiblings = cluster.siblings.length > 0;
      const clusterKey = rep.code;
      const isExpanded = expandedClusterKey === clusterKey;
      // A sibling is selected — show border to indicate this cluster has a pick, but no check mark
      const siblingSelected = cluster.siblings.some(s => s.isSelected);

      return (
        <div key={`cl-${clusterKey}`} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: SWATCH_SIZE }}>
          <SwatchButton
            onClick={() => {
              handleRow3Click(rep);
              if (hasSiblings) setExpandedClusterKey(prev => prev === clusterKey ? null : clusterKey);
            }}
            isActive={rep.isSelected || (isExpanded && !siblingSelected)}
          >
            <img src={rep.image} alt="" className="w-full h-full object-cover" />
            {SHOW_COLOUR_SCORES && <RankBadge code={rep.code} />}

            {rep.isSelected && (
              <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#647d75" }}>
                <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
              </div>
            )}
            {siblingSelected && !rep.isSelected && (
              <div className="absolute" style={{ bottom: 5, right: 5, width: 6, height: 6, borderRadius: "50%", backgroundColor: "#647d75" }} />
            )}
          </SwatchButton>
        </div>
      );
    });
  }

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

  // Swatch sizes: recommended section is larger to signal priority
  const REC_SWATCH_SIZE = 80;
  const REC_SWATCH_RADIUS = 20;
  const SWATCH_SIZE = 64;
  const SWATCH_RADIUS = 16;

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

  if (inline) {
    if (!slot) return null;

    return (
      <>
      <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "#f9f8f7" }}>
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

          {/* Archetype chips — one per archetype, showing best palette suggestion */}
          <div
            className="flex gap-2.5 px-4 pt-3 pb-3 overflow-x-auto flex-shrink-0"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {availableWithImages.map(({ archetype, displayImage, resolvedCode, isRecommended }) => {
              const isActive = archetype.id === effectiveActiveId;
              // Prefer palette-ranked best; fall back to availableWithImages resolvedCode
              const bestCode = bestCodeByArchetypeId.get(archetype.id) ?? resolvedCode;
              const chipImage = bestCode ? (getMaterialByCode(bestCode)?.imageUrl ?? displayImage) : displayImage;
              const showResetHint = isActive && !!selectedMaterialCode && !!bestCode && bestCode !== selectedMaterialCode;
              return (
                <button
                  key={`chip-${archetype.id}`}
                  onClick={() => {
                    setActiveArchetypeId(archetype.id);
                    setGridCenterCode(bestCode ?? null);
                    if (slot && bestCode) onSelect(slot, archetype.id, bestCode);
                  }}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                  style={{ opacity: isActive || isRecommended ? 1 : 0.45, transition: "opacity 0.15s" }}
                >
                  <div
                    className="relative w-[52px] h-[52px] overflow-hidden"
                    style={{
                      borderRadius: 11,
                      border: isActive ? "2px solid #647d75" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img src={chipImage} alt={archetype.label[lang]} className="w-full h-full object-cover" />
                    {showResetHint && (
                      <div className="absolute flex items-center justify-center" style={{ bottom: 3, right: 3, width: 14, height: 14, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.45)" }}>
                        <RotateCcw className="w-2 h-2 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[10px] whitespace-nowrap leading-none"
                    style={{
                      color: isActive ? "#1a1a1a" : "#9ca3af",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {archetype.label[lang]}
                  </span>
                </button>
              );
            })}
          </div>

          <SwatchDivider />

          {/* 3×3 warmth × lightness grid */}
          {effectiveGridCenter ? (
            <div className="flex flex-col items-center px-4 py-4 gap-2 flex-shrink-0">
              {([0, 1, 2] as const).map((row) => (
                <div key={row} className="flex gap-2">
                  {([0, 1, 2] as const).map((col) => {
                    const cell = materialGrid.find(c => c.row === row && c.col === col);
                    const mat = cell?.material ?? null;
                    const isSelected = mat?.technicalCode === selectedMaterialCode;
                    const isCenter = mat?.technicalCode === effectiveGridCenter.technicalCode;

                    if (!mat) {
                      return (
                        <div
                          key={`${row}-${col}`}
                          className="flex-shrink-0"
                          style={{ width: 88, height: 88, borderRadius: 16, backgroundColor: "#d1cdc8", opacity: 0.2 }}
                        />
                      );
                    }

                    return (
                      <button
                        key={`${row}-${col}`}
                        onClick={() => handleGridCellClick({ row, col, material: mat })}
                        className="relative flex-shrink-0 active:scale-95"
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 16,
                          overflow: "hidden",
                          border: (isSelected || isCenter) ? "2px solid #647d75" : "2px solid transparent",
                          transition: "border-color 0.15s, transform 0.1s",
                        }}
                      >
                        <img src={mat.imageUrl!} alt="" className="w-full h-full object-cover" />
                        {/* Selection indicator — bottom-right */}
                        {isSelected && (
                          <div className="absolute flex items-center justify-center" style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#647d75" }}>
                            <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                        {/* V/VV compatibility badge — bottom-left, shown on all cells including selected */}
                        {(() => {
                          const others = otherMaterialCodes ?? [];
                          if (others.length === 0 || (!isCompatibleWithOthers && !isCompatibleWithEvery)) return null;
                          const isVV = isCompatibleWithEvery?.(mat.technicalCode, others) ?? false;
                          const isV  = !isVV && (isCompatibleWithOthers?.(mat.technicalCode, others) ?? false);
                          if (!isVV && !isV) return null;
                          return (
                            <div className="absolute flex items-center justify-center" style={{ bottom: 4, left: 4, width: 16, height: 16, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.45)" }}>
                              {isVV
                                ? <CheckCheck className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                                : <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                              }
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{t("surface.searchNoResults")}</p>
            </div>
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

          </>
        )}

        </div>

      </div>

      <MaterialRequestDialog
        isOpen={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        slotLabel={slot ? t(`surface.${slot}`) : ""}
      />
      </>
    );
  }

  // ─── Modal (Sheet) render — unchanged ─────────────────────────────────────
  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      {/* [&>button.absolute]:hidden suppresses the SheetContent built-in X button */}
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl overflow-hidden sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2 [&>button.absolute]:hidden"
        aria-describedby={undefined}
      >
        {/* Accessible title (screen-reader only) */}
        <SheetTitle className="sr-only">{slot ? t(`surface.${slot}`) : ""}</SheetTitle>

        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full mx-auto mt-2.5" style={{ backgroundColor: "#e0dbd5" }} />

        {/* Header: slot title + close button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-[17px] font-medium" style={{ color: "#1a1a1a" }}>
            {slot ? t(`surface.${slot}`) : ""}
          </span>
          <SheetClose asChild>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#f5f2ef", color: "#6b7280" }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </SheetClose>
        </div>

        {/* "Material type" label */}
        <p className="text-[11px] font-medium tracking-[0.06em] uppercase px-4 mt-0.5 mb-2" style={{ color: "#9ca3af" }}>
          {t("surface.materialType")}
        </p>

        {/* Archetype chips — horizontal scroll */}
        <div
          className="flex gap-2.5 px-4 pb-1 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {availableWithImages.map(({ archetype, displayImage, resolvedCode, isRecommended }) => {
            const isActive = !isFirstPick && archetype.id === effectiveActiveId;
            const hasSelection = selectedId === archetype.id;
            return (
              <button
                key={`chip-${archetype.role}-${archetype.id}`}
                onClick={() => handleArchetypeClick(archetype.id, resolvedCode)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
                style={{ opacity: (hasSelection || isActive || isRecommended) ? 1 : 0.45, transition: "opacity 0.15s" }}
              >
                <div
                  className="w-[52px] h-[52px] rounded-xl overflow-hidden relative flex-shrink-0"
                  style={{
                    border: (hasSelection || isActive) ? "2px solid #647d75" : "2px solid transparent",
                    transition: "border-color 0.15s",
                  }}
                >
                  <img src={displayImage} alt={archetype.label[lang]} className="w-full h-full object-cover" />
                  {isRecommended && (
                    <div className="absolute top-1 inset-x-1 flex justify-center">
                      <span className="text-[8px] font-medium text-white rounded-full px-1.5 py-0.5 leading-none truncate" style={{ backgroundColor: "rgba(0,0,0,0.72)" }}>
                        {t("surface.matchingMaterials")}
                      </span>
                    </div>
                  )}
                  {hasSelection && (
                    <div
                      className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#647d75" }}
                    >
                      <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <span
                  className="text-[11px] whitespace-nowrap leading-none"
                  style={{
                    color: (hasSelection || isActive) ? "#1a1a1a" : "#9ca3af",
                    fontWeight: (hasSelection || isActive) ? 500 : 400,
                    transition: "color 0.15s",
                  }}
                >
                  {archetype.label[lang]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Variants row — only when changing an existing selection */}
        {!isFirstPick && activeVariants.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 mt-3.5 mb-2">
              <span className="text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: "#9ca3af" }}>
                {activeArchetypeLabel}
              </span>
              <span
                className="text-[10px] rounded-full px-2 py-0.5"
                style={{ backgroundColor: "#f3f4f6", color: "#9ca3af" }}
              >
                {activeVariants.length}
              </span>
            </div>

            <div
              className="flex gap-2.5 px-4 pb-1 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              {activeVariants.map((v) => (
                <button
                  key={v.code}
                  onClick={() => handleVariantSelect(v.code)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px]"
                >
                  <div
                    className="w-[72px] h-[72px] rounded-[14px] overflow-hidden relative flex-shrink-0"
                    style={{
                      border: v.isSelected ? "2px solid #647d75" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                    {v.isRecommended && (
                      <div className="absolute top-1 inset-x-1 flex justify-center">
                        <span className="text-[8px] font-medium rounded-full px-1.5 py-0.5 leading-none truncate" style={v.matchesAll ? { backgroundColor: "rgba(0,0,0,0.72)", color: "#ffffff" } : { backgroundColor: "rgba(255,255,255,0.82)", color: "rgba(0,0,0,0.6)" }}>
                          {t("surface.matchingMaterials")}
                        </span>
                      </div>
                    )}
                    {v.isSelected && (
                      <div
                        className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#647d75" }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[11px] w-full text-center truncate leading-tight"
                    style={{
                      color: v.isSelected ? "#1a1a1a" : "#9ca3af",
                      fontWeight: v.isSelected ? 500 : 400,
                    }}
                  >
                    {v.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Remove material button */}
        {selectedId && onClear && slot && (
          <button
            onClick={() => { onClear(slot); onClose(); }}
            className="mx-4 mt-3.5 mb-4 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl w-[calc(100%-32px)] text-[13px]"
            style={{
              border: "0.5px solid #e8e4e0",
              color: "#9ca3af",
            }}
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
            {t("surface.remove")}
          </button>
        )}

        {!(selectedId && onClear && slot) && <div className="pb-4" />}
      </SheetContent>
    </Sheet>
  );
}
