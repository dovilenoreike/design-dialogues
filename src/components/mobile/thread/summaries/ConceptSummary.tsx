import { useMemo } from "react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";

// Room config: URL slug -> display name for category selection
const ROOM_CONFIG = [
  { slug: "kitchen", displayName: "Kitchen", translationKey: "space.kitchen" },
  { slug: "living-room", displayName: "Living Room", translationKey: "space.livingRoom" },
  { slug: "bedroom", displayName: "Bedroom", translationKey: "space.bedroom" },
  { slug: "bathroom", displayName: "Bathroom", translationKey: "space.bathroom" },
];

interface RoomImage {
  src: string;
  roomDisplayName: string;
  translationKey: string;
  slug: string;
}

export function ConceptSummary() {
  const { design, generation, setActiveTab, handleSelectCategory } = useDesign();
  const { t } = useLanguage();

  // Build room images array - always 4 rooms
  const roomImages = useMemo(() => {
    const result: RoomImage[] = [];

    ROOM_CONFIG.forEach(room => {
      const uploadedImage = design.uploadedImages[room.displayName];
      const generatedImage = generation.generatedImages[room.displayName];

      // Priority: generated > uploaded > pregenerated
      if (generatedImage) {
        result.push({
          src: generatedImage,
          roomDisplayName: room.displayName,
          translationKey: room.translationKey,
          slug: room.slug,
        });
      } else if (uploadedImage) {
        result.push({
          src: uploadedImage,
          roomDisplayName: room.displayName,
          translationKey: room.translationKey,
          slug: room.slug,
        });
      } else if (design.selectedMaterial && design.selectedStyle) {
        // Fall back to pregenerated
        result.push({
          src: `/visualisations/${design.selectedMaterial}/${design.selectedStyle}/${room.slug}.webp`,
          roomDisplayName: room.displayName,
          translationKey: room.translationKey,
          slug: room.slug,
        });
      }
    });

    return result;
  }, [design.uploadedImages, design.selectedMaterial, design.selectedStyle, generation.generatedImages]);

  // Determine Hero room - last selected, or first room with content
  const heroRoom = useMemo(() => {
    if (roomImages.length === 0) return null;

    // If user has a last selected room, use it
    if (design.lastSelectedRoom) {
      const found = roomImages.find(r => r.roomDisplayName === design.lastSelectedRoom);
      if (found) return found;
    }

    // Otherwise use first room (Kitchen)
    return roomImages[0];
  }, [roomImages, design.lastSelectedRoom]);

  // Triplets are the remaining rooms
  const triplets = useMemo(() => {
    if (!heroRoom) return [];
    return roomImages.filter(r => r.roomDisplayName !== heroRoom.roomDisplayName);
  }, [roomImages, heroRoom]);

  const handleImageClick = (e: React.MouseEvent, roomDisplayName: string) => {
    e.stopPropagation();
    handleSelectCategory(roomDisplayName);
    setActiveTab("design");
  };

  if (roomImages.length === 0) return null;

  return (
    <div className="space-y-3 max-w-md">
      {/* Header */}
      <div>
        <h3 className="font-serif text-base text-neutral-900">
          {t("thread.fullHomeVision")}
        </h3>
        {design.selectedStyle && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            {t(`style.${design.selectedStyle}`)}
          </p>
        )}
      </div>

      {/* Hero Image */}
      {heroRoom && (
        <div
          onClick={(e) => handleImageClick(e, heroRoom.roomDisplayName)}
          className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100 cursor-pointer"
        >
          <img
            src={heroRoom.src}
            alt={t(heroRoom.translationKey)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Triplets */}
      {triplets.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {triplets.map((room) => (
            <div
              key={room.slug}
              onClick={(e) => handleImageClick(e, room.roomDisplayName)}
              className="aspect-square rounded-lg overflow-hidden bg-neutral-100 cursor-pointer"
            >
              <img
                src={room.src}
                alt={t(room.translationKey)}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
