import { useDesign } from "@/contexts/DesignContext";
import ModeSwitcher from "./ModeSwitcher";
import RoomCarousel from "./carousels/RoomCarousel";
import PaletteCarousel from "./carousels/PaletteCarousel";
import StyleCarousel from "./carousels/StyleCarousel";

export default function ControlCenter() {
  const { activeMode } = useDesign();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Layer 1: Compact Mode Switcher */}
      <ModeSwitcher />

      {/* Layer 2: Filmstrip Area */}
      <div className="flex-1 overflow-hidden">
        {activeMode === "rooms" && <RoomCarousel />}
        {activeMode === "palettes" && <PaletteCarousel />}
        {activeMode === "styles" && <StyleCarousel />}
      </div>
    </div>
  );
}
