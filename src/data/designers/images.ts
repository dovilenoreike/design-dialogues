import heyaStudio from "@/assets/designers/heya_studio.jpg";
import athenaBlackbird from "@/assets/designers/athena_blackbird.webp";
import gnInteriordesign from "@/assets/designers/gn_interiordesign.jpg";
import impeka from "@/assets/designers/impeka.jpg";
import dizaino_dialogai from "@/assets/designers/design-dialogues.jpg";

export const designerImages: Record<string, string> = {
  heya_studio: heyaStudio,
  athena_blackbird: athenaBlackbird,
  gn_interiordesign: gnInteriordesign,
  impeka: impeka,
  dizaino_dialogai: dizaino_dialogai,
};

export function getDesignerImage(designerId: string): string | undefined {
  return designerImages[designerId];
}
