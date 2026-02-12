import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { rooms } from "@/data/rooms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Map room id to translation key
const roomTranslationKey: Record<string, string> = {
  "kitchen": "space.kitchen",
  "living-room": "space.livingRoom",
  "bedroom": "space.bedroom",
  "bathroom": "space.bathroom",
};

export default function RoomDropdown() {
  const { design, handleSelectCategory } = useDesign();
  const { selectedCategory } = design;
  const { t } = useLanguage();

  return (
    <Select value={selectedCategory || "Kitchen"} onValueChange={handleSelectCategory}>
      <SelectTrigger className="flex-1 bg-muted/50 border-0 rounded-full px-4 py-2.5 text-xs font-medium justify-center gap-1 h-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {rooms.map((room) => (
          <SelectItem key={room.id} value={room.name}>
            {t(roomTranslationKey[room.id] || room.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
