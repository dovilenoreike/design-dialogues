import { useDesign, Tier } from "@/contexts/DesignContext";
import { useHaptic } from "@/hooks/use-haptic";

const tiers: Tier[] = ["Budget", "Standard", "Premium"];

export default function TierControlBar() {
  const { selectedTier, setSelectedTier } = useDesign();
  const haptic = useHaptic();

  const handleSelect = (tier: Tier) => {
    haptic.light();
    setSelectedTier(tier);
  };

  return (
    <div className="h-full flex items-center justify-center bg-background px-4">
      <div className="flex gap-8">
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => handleSelect(tier)}
            className={`relative py-3 text-[11px] uppercase tracking-widest min-h-[44px] touch-manipulation transition-colors ${
              selectedTier === tier
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {tier}
            {selectedTier === tier && (
              <span className="absolute bottom-2 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
