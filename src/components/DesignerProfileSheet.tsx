import { useState } from "react";
import { User, Mail, Instagram, Globe, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { palettes } from "@/data/palettes";
import { paletteThumbnails } from "@/data/palettes/thumbnails";
import { getDesignerWithFallback } from "@/data/designers";
import DesignerContactModal from "@/components/mobile/DesignerContactModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface DesignerProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  designerName: string;
  designerTitle: string;
  currentPaletteId?: string;
  onSelectPalette?: (paletteId: string) => void;
}

const DesignerProfileSheet = ({
  isOpen,
  onClose,
  designerName,
  designerTitle,
  currentPaletteId,
  onSelectPalette,
}: DesignerProfileSheetProps) => {
  const { t } = useLanguage();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Get designer profile from centralized data
  const profile = getDesignerWithFallback(designerName, designerTitle);

  // Get all palettes by this designer
  const designerPalettes = palettes.filter(
    (p) => p.designer === designerName
  );

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto pb-safe">
          {/* Header with Avatar */}
          <DrawerHeader className="flex flex-col items-center pt-6 pb-4">
            <div className="w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center mb-4">
              <User size={32} className="text-text-muted" />
            </div>
            <DrawerTitle className="text-2xl font-serif text-center">
              {profile.name}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground mt-1">{profile.title}</p>
          </DrawerHeader>

          {/* Bio */}
          <div className="px-6 pb-6">
            <p className="text-sm text-text-secondary leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {/* Work with Me Section */}
          <div className="px-6 pb-6">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
              {t("designer.workWithMe")}
            </h4>

            {/* Primary CTA */}
            <button
              onClick={handleContactClick}
              className="w-full py-3.5 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
            >
              <Mail size={16} />
              {t("designer.contactForProject")}
            </button>

            {/* Social Links */}
            {(profile.instagram || profile.website) && (
              <div className="flex items-center justify-center gap-4 mt-4">
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-surface-muted hover:bg-surface-sunken transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} className="text-text-secondary" />
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-surface-muted hover:bg-surface-sunken transition-colors"
                    aria-label="Website"
                  >
                    <Globe size={20} className="text-text-secondary" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Curated Palettes */}
          {designerPalettes.length > 0 && (
            <div className="pb-8 px-6">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
                {t("designer.curatedPalettes")}
              </h4>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 py-1">
                {designerPalettes.map((palette) => {
                  const isCurrentPalette = palette.id === currentPaletteId;
                  return (
                    <button
                      key={palette.id}
                      onClick={() => {
                        onSelectPalette?.(palette.id);
                        onClose();
                      }}
                      className="flex-shrink-0 w-32 snap-start text-left hover:opacity-80 active:scale-[0.98] transition-all touch-manipulation"
                    >
                      <div className={`relative aspect-square rounded-lg overflow-hidden bg-surface-muted mb-2 ${
                        isCurrentPalette ? "ring-2 ring-foreground ring-offset-2" : ""
                      }`}>
                        <img
                          src={paletteThumbnails[palette.id]}
                          alt={palette.name}
                          className="w-full h-full object-cover"
                        />
                        {isCurrentPalette && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <p className={`font-serif text-sm truncate ${isCurrentPalette ? "font-medium" : ""}`}>
                        {t(`palette.${palette.id}`) || palette.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{palette.temp}</p>
                    </button>
                  );
                })}
                <div className="flex-shrink-0 w-6" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>
      </DrawerContent>

      {/* Contact Modal */}
      <DesignerContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        designerName={profile.name}
        designerEmail={profile.email}
      />
    </Drawer>
  );
};

export default DesignerProfileSheet;
