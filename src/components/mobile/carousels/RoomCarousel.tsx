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
      <div className="flex gap-5 px-4 overflow-x-auto scrollbar-hide">
        {rooms.map((room) => {
          const isSelected = selectedCategory === room.name;
          const Icon = room.icon;

          return (
            <button
              key={room.id}
              onClick={() => handleSelectCategory(room.name)}
              className="flex flex-col items-center gap-1.5 transition-all active:scale-95"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isSelected
                    ? "border border-neutral-900"
                    : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isSelected ? "text-neutral-900" : "text-neutral-400"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <span
                className={`text-[9px] font-medium tracking-[0.2em] uppercase transition-colors ${
                  isSelected ? "text-neutral-900" : "text-neutral-500"
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
