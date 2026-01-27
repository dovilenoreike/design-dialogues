import heyaStudio from "@/assets/designers/heya_studio.jpg";
import athenaBlackbird from "@/assets/designers/athena_blackbird.webp";
import gnInteriordesign from "@/assets/designers/gn_interiordesign.jpg";
import impeka from "@/assets/designers/impeka.jpg";

export const designerImages: Record<string, string> = {
  heya_studio: heyaStudio,
  athena_blackbird: athenaBlackbird,
  gn_interiordesign: gnInteriordesign,
  impeka: impeka,
};

export function getDesignerImage(designerId: string): string | undefined {
  return designerImages[designerId];
}
