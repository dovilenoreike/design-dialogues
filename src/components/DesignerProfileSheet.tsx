import { User, Instagram, Globe, ChevronRight, Mail } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { palettes } from "@/data/palettes";

// Import thumbnail images
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

interface DesignerProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer: string;
  designerTitle: string;
  currentPaletteId: string;
  onSelectPalette: (paletteId: string) => void;
}

const DesignerProfileSheet = ({
  open,
  onOpenChange,
  designer,
  designerTitle,
  currentPaletteId,
  onSelectPalette,
}: DesignerProfileSheetProps) => {
  // Get other palettes by the same designer
  const otherPalettes = palettes.filter(
    (p) => p.designer === designer && p.id !== currentPaletteId
  );

  const handlePaletteClick = (paletteId: string) => {
    onSelectPalette(paletteId);
    onOpenChange(false);
  };

  const handleInquiry = () => {
    window.location.href = `mailto:hello@designdialogues.com?subject=Project Inquiry for ${designer}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-center pb-4">
          {/* Large Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-surface-muted flex items-center justify-center">
              <User size={40} className="text-text-tertiary" />
            </div>
          </div>
          
          {/* Name & Title */}
          <SheetTitle className="font-serif text-2xl">{designer}</SheetTitle>
          <p className="text-text-secondary text-sm">{designerTitle}</p>
        </SheetHeader>

        {/* Bio */}
        <div className="mt-6">
          <p className="text-text-secondary text-sm leading-relaxed text-center px-4">
            With over 15 years of experience in residential design, I specialize in creating 
            spaces that balance timeless elegance with modern functionality. My approach focuses 
            on natural materials, thoughtful lighting, and curated color palettes that reflect 
            each client's unique personality.
          </p>
        </div>

        {/* Work with Me Section */}
        <div className="mt-8 space-y-4">
          <Button 
            onClick={handleInquiry}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
          >
            <Mail size={16} className="mr-2" />
            Send Project Inquiry
          </Button>

          {/* Social Links */}
          <div className="flex justify-center gap-6">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Instagram size={20} />
              <span className="text-sm">Instagram</span>
            </a>
            <a 
              href="https://example.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Globe size={20} />
              <span className="text-sm">Website</span>
            </a>
          </div>
        </div>

        {/* My Collections */}
        {otherPalettes.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3">
              My Collections
            </h4>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-6 px-6">
              {otherPalettes.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => handlePaletteClick(palette.id)}
                  className="flex-shrink-0 snap-start w-28 rounded-xl overflow-hidden border border-ds-border-default hover:border-ds-border-strong transition-colors"
                >
                  <div className="aspect-square">
                    <img
                      src={paletteThumbnails[palette.id]}
                      alt={palette.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <p className="font-serif text-xs truncate">{palette.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-6" /> {/* Bottom spacing */}
      </SheetContent>
    </Sheet>
  );
};

export default DesignerProfileSheet;
