/**
 * Cost insight data for each category and tier
 * Used by CostInsightSheet to display detailed breakdowns
 * All content is sourced from locale files via t()
 */

export interface TierSpecificContent {
  lifespan: string;
  save: { title: string; items: string[] };
  risk: { title: string; items: string[] };
}

export interface CategoryInsight {
  definition: string;
  budget: TierSpecificContent;
  standard: TierSpecificContent;
  premium: TierSpecificContent;
}

/** Mapping from insightKey (used in useCostCalculation) to locale key prefix */
const insightKeyToLocaleKey: Record<string, string> = {
  "Interior Design": "interiorDesign",
  "Construction & Finish": "constructionFinish",
  "Materials": "materials",
  "Kitchen": "kitchen",
  "Wardrobes": "wardrobes",
  "Appliances": "appliances",
  "Furniture": "furniture",
  "Prep Work": "prepWork",
};

/** Collect numbered items (save1, save2, ... or risk1, risk2, ...) */
function collectItems(t: (key: string) => string, prefix: string): string[] {
  const items: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const key = `${prefix}${i}`;
    const val = t(key);
    if (val === key) break; // t() returns the key itself when not found
    items.push(val);
  }
  return items;
}

function buildTierContent(t: (key: string) => string, prefix: string): TierSpecificContent {
  return {
    lifespan: t(`${prefix}.lifespan`),
    save: {
      title: t(`${prefix}.saveTitle`),
      items: collectItems(t, `${prefix}.save`),
    },
    risk: {
      title: t(`${prefix}.riskTitle`),
      items: collectItems(t, `${prefix}.risk`),
    },
  };
}

export function getCategoryInsight(
  t: (key: string) => string,
  insightKey: string,
): CategoryInsight | null {
  const localeKey = insightKeyToLocaleKey[insightKey];
  if (!localeKey) return null;

  const prefix = `insights.${localeKey}`;
  return {
    definition: t(`${prefix}.definition`),
    budget: buildTierContent(t, `${prefix}.budget`),
    standard: buildTierContent(t, `${prefix}.standard`),
    premium: buildTierContent(t, `${prefix}.premium`),
  };
}

/**
 * Tier badge configuration for display
 */
export const tierConfig = {
  budget: {
    labelKey: "tier.budget",
    className: "bg-surface-muted text-text-secondary text-[10px] uppercase tracking-widest"
  },
  standard: {
    labelKey: "tier.standard",
    className: "border border-ds-border-strong bg-transparent text-text-secondary text-[10px] uppercase tracking-widest"
  },
  premium: {
    labelKey: "tier.premium",
    className: "bg-interactive text-background text-[10px] uppercase tracking-widest"
  }
} as const;
