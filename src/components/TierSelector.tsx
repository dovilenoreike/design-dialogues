import { useHaptic } from "@/hooks/use-haptic";
import { useLanguage } from "@/contexts/LanguageContext";

interface TierSelectorProps {
  selectedTier: "Budget" | "Standard" | "Premium";
  onSelectTier: (tier: "Budget" | "Standard" | "Premium") => void;
}

const tiers: Array<"Budget" | "Standard" | "Premium"> = ["Budget", "Standard", "Premium"];

const TierSelector = ({ selectedTier, onSelectTier }: TierSelectorProps) => {
  const haptic = useHaptic();
  const { t } = useLanguage();

  const tierLabel: Record<"Budget" | "Standard" | "Premium", string> = {
    Budget: t("tier.budget"),
    Standard: t("tier.standard"),
    Premium: t("tier.premium"),
  };

  const handleSelect = (tier: "Budget" | "Standard" | "Premium") => {
    haptic.light();
    onSelectTier(tier);
  };

  return (
    <div className="segmented-control w-full">
      {tiers.map((tier) => (
        <button
          key={tier}
          onClick={() => handleSelect(tier)}
          className={`segmented-item flex-1 text-xs md:text-sm px-3 md:px-6 py-2.5 md:py-2.5 min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform ${
            selectedTier === tier ? "segmented-item-active" : ""
          }`}
        >
          {tierLabel[tier]}
        </button>
      ))}
    </div>
  );
};

export default TierSelector;
