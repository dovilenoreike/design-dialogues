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
      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Space Category</p>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`pill-button whitespace-nowrap text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 ${
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
