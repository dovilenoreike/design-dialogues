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

export default function RoomPillBar() {
  const { design, handleSelectCategory } = useDesign();
  const { selectedCategory } = design;
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {rooms.map((room) => {
        const isSelected = selectedCategory === room.name;
        const Icon = room.icon;

        return (
          <button
            key={room.id}
            onClick={() => handleSelectCategory(room.name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
              isSelected
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t(roomTranslationKey[room.id] || room.name)}
          </button>
        );
      })}
    </div>
  );
}
