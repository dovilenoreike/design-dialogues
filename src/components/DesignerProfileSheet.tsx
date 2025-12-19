import { User, ChevronRight, Mail, Instagram, Globe } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { palettes, getPaletteById } from "@/data/palettes";
import type { Palette, DesignerProfile } from "@/types/palette";

// Import palette thumbnails
import fogInTheForestImg from "@/assets/materials/fog-in-the-forest.jpg";
import behindTheLightsImg from "@/assets/materials/behind-the-lights.jpg";
import chocolateWabiSabiImg from "@/assets/materials/chocolate-wabi-sabi.jpg";
import morningForestImg from "@/assets/materials/morning-forest.jpg";

const paletteThumbnails: Record<string, string> = {
  "fog-in-the-forest": fogInTheForestImg,
  "behind-the-lights": behindTheLightsImg,
  "chocolate-wabi-sabi": chocolateWabiSabiImg,
  "morning-forest": morningForestImg,
};

// Default profiles for designers (can be extended)
const defaultDesignerProfiles: Record<string, DesignerProfile> = {
  "Sigita Kulikajeva": {
    name: "Sigita Kulikajeva",
    title: "Interior Architect",
    bio: "Award-winning interior architect specializing in contemporary residential design. With over 15 years of experience, I create spaces that balance functionality with timeless aesthetics, drawing inspiration from natural materials and Scandinavian minimalism.",
    email: "hello@sigitadesign.com",
    instagram: "sigita.design",
    website: "https://sigitadesign.com",
  },
  "Athena Blackbird": {
    name: "Athena Blackbird",
    title: "Interior Architect",
    bio: "Award-winning interior architect specializing in contemporary residential design. With over 15 years of experience, I create spaces that balance functionality with timeless aesthetics, drawing inspiration from natural materials and Scandinavian minimalism.",
    email: "hello@athenablackbird.com",
    instagram: "athenablackbird.design",
    website: "https://athenadesign.com",
  },
};

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
  // Get designer profile
  const profile = defaultDesignerProfiles[designerName] || {
    name: designerName,
    title: designerTitle,
    bio: "Interior designer passionate about creating beautiful, functional spaces.",
  };

  // Get other palettes by this designer
  const otherPalettes = palettes.filter(
    (p) => p.designer === designerName && p.id !== currentPaletteId
  );

  const handleEmailClick = () => {
    if (profile.email) {
      window.location.href = `mailto:${profile.email}?subject=Project Inquiry from Design Dialogues`;
    }
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
              Work with Me
            </h4>
            
            {/* Primary CTA */}
            <button
              onClick={handleEmailClick}
              className="w-full py-3.5 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
            >
              <Mail size={16} />
              Send Project Inquiry
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

          {/* My Collections */}
          {otherPalettes.length > 0 && (
            <div className="pb-8 px-6">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
                My Collections
              </h4>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
                {otherPalettes.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => {
                      onSelectPalette?.(palette.id);
                      onClose();
                    }}
                    className="flex-shrink-0 w-32 snap-start text-left hover:opacity-80 active:scale-[0.98] transition-all touch-manipulation"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-surface-muted mb-2">
                      <img
                        src={paletteThumbnails[palette.id]}
                        alt={palette.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="font-serif text-sm truncate">{palette.name}</p>
                    <p className="text-[10px] text-muted-foreground">{palette.temp}</p>
                  </button>
                ))}
                <div className="flex-shrink-0 w-6" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DesignerProfileSheet;
