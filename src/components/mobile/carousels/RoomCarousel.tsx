import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { rooms } from "@/data/rooms";

// Map room id to translation key
const roomTranslationKey: Record<string, string> = {
  "kitchen": "space.kitchen",
  "living-room": "space.livingRoom",
  "bedroom": "space.bedroom",
  "bathroom": "space.bathroom",
};

export default function RoomCarousel() {
  const { design, handleSelectCategory } = useDesign();
  const { selectedCategory } = design;
  const { t } = useLanguage();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex gap-4 px-4">
        {rooms.map((room) => {
          const isSelected = selectedCategory === room.name;
          const Icon = room.icon;

          return (
            <button
              key={room.id}
              onClick={() => handleSelectCategory(room.name)}
              className="flex flex-col items-center gap-1 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isSelected ? "text-background" : "text-muted-foreground"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isSelected ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t(roomTranslationKey[room.id] || room.name)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
