import { useState } from "react";
import { User, Mail, Instagram, Globe, MapPin, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
}

const DesignerProfileSheet = ({
  isOpen,
  onClose,
  designerId,
  designerTitle,
}: DesignerProfileSheetProps) => {
  const { t } = useLanguage();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const profile = getDesignerWithFallback(designerId, designerTitle);
  const profileImage = getDesignerImage(designerId);

  const bioAndCta = (
    <>
      {/* Bio */}
      <div className={isMobile ? "px-6 pb-6" : "pb-6"}>
        <p className="text-sm text-text-secondary leading-relaxed">
          {profile.bio}
        </p>
      </div>

      {/* Work with Me Section */}
      {profile.email && (
        <div className={isMobile ? "px-6 pb-6" : "pb-6"}>
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
            {t("designer.workWithMe")}
          </h4>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="w-full py-3.5 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
          >
            <Mail size={16} />
            {t("designer.contactForProject")}
          </button>
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
    </>
  );

  const contactModal = (
    <DesignerContactModal
      isOpen={isContactModalOpen}
      onClose={() => setIsContactModalOpen(false)}
      designerName={profile.name}
      designerEmail={profile.email}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <div className="overflow-y-auto pb-safe">
            <DrawerHeader className="flex flex-col items-center pt-6 pb-4">
              <div className="w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center mb-4 overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-text-muted" />
                )}
              </div>
              <DrawerTitle className="text-2xl font-serif text-center">{profile.name}</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">{profile.title}</p>
              {profile.cities && profile.cities.length > 0 && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <MapPin size={12} />
                  {profile.cities.map(city => city.charAt(0).toUpperCase() + city.slice(1)).join(", ")}
                </p>
              )}
            </DrawerHeader>
            {bioAndCta}
          </div>
          {contactModal}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md p-6 gap-0" hideCloseButton aria-describedby={undefined}>
          <DialogTitle className="sr-only">{profile.name}</DialogTitle>
          <div className="overflow-y-auto pb-safe">
            {/* Header */}
            <div className="flex flex-col items-center pt-2 pb-4 relative">
              <button
                onClick={onClose}
                className="absolute top-2 right-0 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center mb-4 overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-text-muted" />
                )}
              </div>
              <h2 className="text-2xl font-serif text-center">{profile.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{profile.title}</p>
              {profile.cities && profile.cities.length > 0 && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <MapPin size={12} />
                  {profile.cities.map(city => city.charAt(0).toUpperCase() + city.slice(1)).join(", ")}
                </p>
              )}
            </div>
            {bioAndCta}
            {collectionsSection}
          </div>
          {contactModal}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesignerProfileSheet;
