import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tier } from "@/contexts/DesignContext";
import { Mail } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { joinPaletteWaitlist } from "@/lib/palette-waitlist";
import { useToast } from "@/hooks/use-toast";

interface ComingSoonPaletteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  paletteId: string;
  paletteName: string;
  selectedTier: Tier;
}

export function ComingSoonPaletteSheet({
  isOpen,
  onClose,
  paletteId,
  paletteName,
  selectedTier,
}: ComingSoonPaletteSheetProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: t("comingSoon.errorMessage"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const result = await joinPaletteWaitlist(paletteId, email, selectedTier, name || undefined);

    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setEmail("");
        setName("");
        onClose();
        // Show notification toast after modal closes
        sonnerToast.success(t("comingSoon.notificationToast"));
      }, 2000);
    } else {
      toast({
        title: t("comingSoon.errorMessage"),
        variant: "destructive",
      });
    }
  };

  const content = (
    <div className={isMobile ? "px-6 pb-6" : "pb-6"}>
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#647d7520' }}>
            <Mail size={32} style={{ color: '#647d75' }} />
          </div>
          <p className="text-center text-text-secondary">
            {t("comingSoon.successMessage").replace("{paletteName}", paletteName)}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("comingSoon.emailPlaceholder")}
              className="w-full px-4 py-3 rounded-lg bg-surface-muted border border-border-subtle focus:outline-none focus:ring-2 focus:ring-foreground text-text-primary"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("comingSoon.namePlaceholder")}
              className="w-full px-4 py-3 rounded-lg bg-surface-muted border border-border-subtle focus:outline-none focus:ring-2 focus:ring-foreground text-text-primary"
              disabled={isLoading}
            />
          </div>

          <div className="bg-surface-muted rounded-lg p-4 border border-border-subtle">
            <p className="text-sm font-medium text-text-primary mb-1">
              {t("comingSoon.tierLabel").replace("{tier}", t(`tier.${selectedTier.toLowerCase()}`))}
            </p>
            <p className="text-xs text-text-secondary">
              {t("comingSoon.tierNote")}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={16} />
            {isLoading ? "..." : t("comingSoon.submitButton")}
          </button>
        </form>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-2xl font-serif">
              {t("comingSoon.sheetTitle")}
            </DrawerTitle>
            <DrawerDescription className="text-text-secondary mt-2">
              {t("comingSoon.sheetDescription")}
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6" hideCloseButton>
        <DialogTitle className="text-2xl font-serif text-center">
          {t("comingSoon.sheetTitle")}
        </DialogTitle>
        <DialogDescription className="text-text-secondary text-center mt-2">
          {t("comingSoon.sheetDescription")}
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
