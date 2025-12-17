import { useHaptic } from "@/hooks/use-haptic";

interface SpaceCategoryPillsProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  disabled?: boolean;
}

const categories = [
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Hallway",
];

const SpaceCategoryPills = ({ selectedCategory, onSelectCategory, disabled = false }: SpaceCategoryPillsProps) => {
  const haptic = useHaptic();

  const handleSelect = (category: string) => {
    if (disabled) return;
    haptic.light();
    onSelectCategory(category);
  };

  return (
    <div className={`w-full transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      <p className={`text-xs md:text-sm mb-2 md:mb-3 transition-colors duration-300 ${
        disabled ? 'text-muted-foreground' : 'text-foreground font-medium'
      }`}>
        {disabled ? 'Select room type (after upload)' : 'What room is this?'}
      </p>
      {/* Mobile: Horizontal scroll | Desktop: Flex wrap */}
      <div className="flex md:flex-wrap md:justify-center gap-2 md:gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleSelect(category)}
            disabled={disabled}
            aria-disabled={disabled}
            className={`pill-button whitespace-nowrap text-xs md:text-sm px-4 md:px-5 py-2.5 md:py-2.5 min-h-[44px] touch-manipulation transition-all duration-200 snap-start flex-shrink-0 ${
              disabled 
                ? 'cursor-not-allowed' 
                : 'active:scale-95'
            } ${
              selectedCategory === category ? "pill-button-active" : ""
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpaceCategoryPills;
