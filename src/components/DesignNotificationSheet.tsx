import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { joinFeatureWaitlist } from "@/lib/feature-waitlist";
import { useToast } from "@/hooks/use-toast";
import { getArchetypeById } from "@/data/archetypes";
import type { SlotSelections } from "./mobile/controls/MaterialSlotPicker";

export interface MaterialEntry {
  /** Display label (e.g. translated surface name) */
  label: string;
  /** Display name (e.g. material description or archetype name) */
  name: string;
  /** ID recorded in preferences (e.g. archetype ID or material code) */
  id: string;
}

interface DesignNotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  featureId?: string;
  /** Overrides the default sheet description text */
  description?: string;
  /** When provided, overrides the moodboard localStorage data for both display and preferences */
  materials?: MaterialEntry[];
}

export function DesignNotificationSheet({
  isOpen,
  onClose,
  featureId = "visualizer",
  description,
  materials,
}: DesignNotificationSheetProps) {
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fall back to moodboard localStorage when no materials are passed in
  const moodboardEntries = useMemo(() => {
    if (materials) return null;
    try {
      const saved = localStorage.getItem("moodboard-slot-selections");
      if (saved) {
        const parsed = JSON.parse(saved) as SlotSelections;
        return (Object.entries(parsed) as [string, string | null][])
          .filter(([, id]) => id !== null)
          .map(([slot, id]) => ({
            label: t(`surface.${slot}`),
            name: getArchetypeById(id!)?.displayName[lang] ?? id!,
            id: id!,
          }));
      }
    } catch {}
    return [];
  }, [isOpen, materials]); // re-read whenever sheet opens

  const entries: MaterialEntry[] = materials ?? moodboardEntries ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({ title: t("comingSoon.errorMessage"), variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const preferences = entries.length > 0
      ? entries.map(({ label, id }) => `${label}=${id}`).join("|")
      : undefined;

    const result = await joinFeatureWaitlist(featureId, email, name || undefined, preferences);

    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setEmail("");
        setName("");
        onClose();
        sonnerToast.success(t("comingSoon.notificationToast"));
      }, 2000);
    } else {
      toast({ title: t("comingSoon.errorMessage"), variant: "destructive" });
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
            {t("comingSoon.designSuccessMessage")}
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
            {entries.length > 0 ? (
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {entries.map(({ label, name: matName }, i) => (
                  <>
                    <span key={`${i}-l`} className="text-text-secondary text-sm">{label}</span>
                    <span key={`${i}-n`} className="text-text-primary font-medium text-sm truncate">{matName}</span>
                  </>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                {description ?? t("comingSoon.designSheetDescription")}
              </p>
            )}
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
              {description ?? t("comingSoon.designSheetDescription")}
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
          {description ?? t("comingSoon.designSheetDescription")}
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
