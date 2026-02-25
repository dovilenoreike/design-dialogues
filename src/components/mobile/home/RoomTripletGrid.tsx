import { useMemo } from "react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getVisualization } from "@/data/visualisations";

const ROOM_CONFIG = [
  { slug: "kitchen", displayName: "Kitchen", translationKey: "space.kitchen" },
  { slug: "living-room", displayName: "Living Room", translationKey: "space.livingRoom" },
  { slug: "bedroom", displayName: "Bedroom", translationKey: "space.bedroom" },
  { slug: "bathroom", displayName: "Bathroom", translationKey: "space.bathroom" },
];

interface RoomTripletGridProps {
  onRoomSelect: (roomDisplayName: string) => void;
}

export default function RoomTripletGrid({ onRoomSelect }: RoomTripletGridProps) {
  const { design, generation } = useDesign();
  const { t } = useLanguage();

  const currentRoom = design.selectedCategory || "Kitchen";

  const triplets = useMemo(() => {
    return ROOM_CONFIG
      .filter((room) => room.displayName !== currentRoom)
      .map((room) => {
        const generatedImage = generation.generatedImages[room.displayName];
        const uploadedImage = design.uploadedImages[room.displayName];
        const visualizationImage = getVisualization(
          design.selectedMaterial,
          room.displayName,
          design.selectedStyle
        );
        return {
          ...room,
          src: generatedImage || uploadedImage || visualizationImage,
        };
      });
  }, [currentRoom, design.uploadedImages, design.selectedMaterial, design.selectedStyle, generation.generatedImages]);

  if (triplets.length === 0) return null;

  return (
    <section className="px-4 py-5">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {t("home.fullHomeConcept")}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {triplets.map((room) => (
          <button
            key={room.slug}
            onClick={() => onRoomSelect(room.displayName)}
            className="flex flex-col items-start active:scale-95 transition-transform"
          >
            <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
              {t(room.translationKey)}
            </span>
            <div className="w-full aspect-square rounded-md overflow-hidden border border-neutral-200">
              <img
                src={room.src}
                alt={t(room.translationKey)}
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
