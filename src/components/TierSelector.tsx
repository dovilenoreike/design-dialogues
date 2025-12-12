interface TierSelectorProps {
  selectedTier: "Budget" | "Standard" | "Premium";
  onSelectTier: (tier: "Budget" | "Standard" | "Premium") => void;
}

const tiers: Array<"Budget" | "Standard" | "Premium"> = ["Budget", "Standard", "Premium"];

const TierSelector = ({ selectedTier, onSelectTier }: TierSelectorProps) => {
  return (
    <div className="segmented-control w-full">
      {tiers.map((tier) => (
        <button
          key={tier}
          onClick={() => onSelectTier(tier)}
          className={`segmented-item flex-1 ${
            selectedTier === tier ? "segmented-item-active" : ""
          }`}
        >
          {tier}
        </button>
      ))}
    </div>
  );
};

export default TierSelector;
