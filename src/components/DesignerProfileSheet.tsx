import { useState } from "react";
import { User, Mail, Instagram, Globe, Check, MapPin, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { palettes } from "@/data/palettes";
import { paletteThumbnails } from "@/data/palettes/thumbnails";
import { getDesignerWithFallback } from "@/data/designers";
import { getDesignerImage } from "@/data/designers/images";
import DesignerContactModal from "@/components/mobile/DesignerContactModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DesignerProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  designerId: string;
  designerTitle: string;
  currentPaletteId?: string;
  onSelectPalette?: (paletteId: string) => void;
}

const DesignerProfileSheet = ({
  isOpen,
  onClose,
  designerId,
  designerTitle,
  currentPaletteId,
  onSelectPalette,
}: DesignerProfileSheetProps) => {
  const { t } = useLanguage();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get designer profile from centralized data
  const profile = getDesignerWithFallback(designerId, designerTitle);
  const profileImage = getDesignerImage(designerId);

  // Get all palettes by this designer
  const designerPalettes = palettes.filter(
    (p) => p.designer === designerId
  );

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const content = (
    <div className="overflow-y-auto pb-safe">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center pt-6 pb-4 relative">
        {!isMobile && (
          <button
            onClick={onClose}
            className="absolute top-2 right-0 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        )}
        <div className="w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center mb-4 overflow-hidden">
          {profileImage ? (
            <img
              src={profileImage}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={32} className="text-text-muted" />
          )}
        </div>
        <h2 className="text-2xl font-serif text-center">
          {profile.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{profile.title}</p>
        {profile.cities && profile.cities.length > 0 && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <MapPin size={12} />
            {profile.cities.map(city => city.charAt(0).toUpperCase() + city.slice(1)).join(", ")}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className={isMobile ? "px-6 pb-6" : "pb-6"}>
        <p className="text-sm text-text-secondary leading-relaxed">
          {profile.bio}
        </p>
      </div>

      {/* Work with Me Section - only show if email is available */}
      {profile.email && (
        <div className={isMobile ? "px-6 pb-6" : "pb-6"}>
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
      )}

      {/* Curated Palettes */}
      {designerPalettes.length > 0 && (
        <div className={isMobile ? "pb-8 px-6" : "pb-8"}>
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
            {t("designer.curatedPalettes")}
          </h4>
          <div className={`flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-1 ${isMobile ? "-mx-6 px-6" : ""}`}>
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

      {/* Contact Modal */}
      <DesignerContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        designerName={profile.name}
        designerEmail={profile.email}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <div className="overflow-y-auto pb-safe">
            {/* Header with Avatar */}
            <DrawerHeader className="flex flex-col items-center pt-6 pb-4">
              <div className="w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center mb-4 overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-text-muted" />
                )}
              </div>
              <DrawerTitle className="text-2xl font-serif text-center">
                {profile.name}
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">{profile.title}</p>
              {profile.cities && profile.cities.length > 0 && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <MapPin size={12} />
                  {profile.cities.map(city => city.charAt(0).toUpperCase() + city.slice(1)).join(", ")}
                </p>
              )}
            </DrawerHeader>

            {/* Bio */}
            <div className="px-6 pb-6">
              <p className="text-sm text-text-secondary leading-relaxed">
                {profile.bio}
              </p>
            </div>

            {/* Work with Me Section - only show if email is available */}
            {profile.email && (
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
            )}

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
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md p-6 gap-0" hideCloseButton aria-describedby={undefined}>
          <DialogTitle className="sr-only">{profile.name}</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesignerProfileSheet;
