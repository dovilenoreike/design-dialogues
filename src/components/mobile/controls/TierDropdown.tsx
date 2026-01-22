import { useDesign, Tier } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tiers: Tier[] = ["Budget", "Standard", "Premium"];

// Map tier to translation key
const tierTranslationKey: Record<string, string> = {
  "Budget": "tier.budget",
  "Standard": "tier.standard",
  "Premium": "tier.premium",
};

export default function TierDropdown() {
  const { selectedTier, setSelectedTier } = useDesign();
  const { t } = useLanguage();

  return (
    <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as Tier)}>
      <SelectTrigger className="flex-1 bg-muted/50 border-0 rounded-full px-4 py-2.5 text-xs font-medium justify-center gap-1 h-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tiers.map((tier) => (
          <SelectItem key={tier} value={tier}>
            {t(tierTranslationKey[tier] || tier)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
