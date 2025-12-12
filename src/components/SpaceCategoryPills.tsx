interface SpaceCategoryPillsProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}

const categories = [
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Hallway",
];

const SpaceCategoryPills = ({ selectedCategory, onSelectCategory }: SpaceCategoryPillsProps) => {
  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-3">Space Category</p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`pill-button whitespace-nowrap ${
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
