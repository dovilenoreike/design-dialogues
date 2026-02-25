import { useEffect } from "react";
import { useDesign } from "@/contexts/DesignContext";
import RoomCarousel from "./carousels/RoomCarousel";
import PaletteCarousel from "./carousels/PaletteCarousel";
import StyleCarousel from "./carousels/StyleCarousel";

export default function ControlCenter() {
  const { design, activeMode, setActiveMode } = useDesign();
  const { uploadedImages, selectedCategory, selectedMaterial, selectedStyle } = design;
  const uploadedImage = uploadedImages[selectedCategory || "Kitchen"] || null;

  // Smart auto-switch: guide user to what's missing
  useEffect(() => {
    // Only auto-switch after upload and when something is missing
    if (!uploadedImage) return;

    // If style is missing, switch to styles (regardless of palette state)
    if (!selectedStyle && activeMode !== "styles") {
      const timer = setTimeout(() => {
        setActiveMode("styles");
      }, 300);
      return () => clearTimeout(timer);
    }

    // If style exists but palette is missing, switch to palettes
    if (selectedStyle && !selectedMaterial && activeMode !== "palettes") {
      const timer = setTimeout(() => {
        setActiveMode("palettes");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [uploadedImage, selectedStyle, selectedMaterial, activeMode, setActiveMode]);

  return (
    <div className="pt-4 h-[104px] overflow-hidden bg-background">
      {activeMode === "rooms" && <RoomCarousel />}
      {activeMode === "palettes" && <PaletteCarousel />}
      {activeMode === "styles" && <StyleCarousel />}
    </div>
  );
}
