import { Info } from "lucide-react";

interface DesignerInsightProps {
  tier: "Budget" | "Standard" | "Premium";
}

const insights: Record<string, string> = {
  Budget: "Smart Choice: Laminate flooring provides excellent durability at a fraction of hardwood costs, perfect for high-traffic areas.",
  Standard: "Designer Tip: Vinyl flooring offers the warmth of wood but is 100% waterproof, saving maintenance costs.",
  Premium: "Investment Focus: Natural stone worktops historically add 5-8% to property resale value.",
};

const DesignerInsight = ({ tier }: DesignerInsightProps) => {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl">
      <div className="flex-shrink-0 mt-0.5">
        <Info size={16} className="text-blue-700" />
      </div>
      <p className="text-sm text-blue-900 leading-relaxed">
        {insights[tier]}
      </p>
    </div>
  );
};

export default DesignerInsight;
