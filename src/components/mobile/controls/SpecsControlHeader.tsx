import { useDesign, Tier } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { rooms } from "@/data/rooms";
import { useHaptic } from "@/hooks/use-haptic";

const tiers: Tier[] = ["Budget", "Standard", "Premium"];

// Map room id to translation key
const roomTranslationKey: Record<string, string> = {
  "kitchen": "space.kitchen",
  "living-room": "space.livingRoom",
  "bedroom": "space.bedroom",
  "bathroom": "space.bathroom",
};

// Map tier to translation key
const tierTranslationKey: Record<string, string> = {
  "Budget": "tier.budget",
  "Standard": "tier.standard",
  "Premium": "tier.premium",
};

export default function SpecsControlHeader() {
  const { design, handleSelectCategory, selectedTier, setSelectedTier } = useDesign();
  const { selectedCategory } = design;
  const { t } = useLanguage();
  const haptic = useHaptic();

  const handleRoomSelect = (roomName: string) => {
    haptic.light();
    handleSelectCategory(roomName);
  };

  const handleTierSelect = (tier: Tier) => {
    haptic.light();
    setSelectedTier(tier);
  };

  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Room Pills (horizontal scroll) */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3">
            {rooms.map((room) => {
              const isSelected = selectedCategory === room.name;
              return (
                <button
                  key={room.id}
                  onClick={() => handleRoomSelect(room.name)}
                  className={`relative whitespace-nowrap text-[11px] py-1 transition-colors ${
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {t(roomTranslationKey[room.id] || room.name)}
                  {isSelected && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Tier Switcher (compact) */}
        <div className="flex-shrink-0 flex gap-3">
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => handleTierSelect(tier)}
                className={`relative text-[10px] uppercase tracking-wider py-1 transition-colors ${
                  isSelected
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {t(tierTranslationKey[tier] || tier)}
                {isSelected && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
