import { useDesign, Tier } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";

const tiers: Tier[] = ["Budget", "Standard", "Premium"];

// Map tier to translation key
const tierTranslationKey: Record<string, string> = {
  "Budget": "tier.budget",
  "Standard": "tier.standard",
  "Premium": "tier.premium",
};

export default function TierPill() {
  const { selectedTier, setSelectedTier } = useDesign();
  const { t } = useLanguage();

  const cycleNext = () => {
    const currentIndex = tiers.indexOf(selectedTier);
    const nextIndex = (currentIndex + 1) % tiers.length;
    setSelectedTier(tiers[nextIndex]);
  };

  return (
    <button
      onClick={cycleNext}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 bg-muted text-muted-foreground hover:bg-muted/80"
    >
      {t(tierTranslationKey[selectedTier] || selectedTier)}
    </button>
  );
}
