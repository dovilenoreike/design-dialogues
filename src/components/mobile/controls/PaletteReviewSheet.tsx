import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/send-email";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";

export interface ReviewMaterial {
  slot: string;
  name: string;
  code: string;
  compatible: boolean;
}

interface PaletteReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  materials: ReviewMaterial[];
  onShare: () => Promise<string | null>;
}

export default function PaletteReviewSheet({ isOpen, onClose, materials, onShare }: PaletteReviewSheetProps) {
  const { t } = useLanguage();
  const { activeShowroom } = useShowroom();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incompatible = materials.filter((m) => !m.compatible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const shareId = await onShare();
      const shareUrl = shareId ? `${window.location.origin}/share/${shareId}` : null;
      await sendEmail("palette-review", {
        materials,
        message: message || null,
        email: email || null,
        shareUrl,
        showroomId: activeShowroom?.id ?? null,
        showroomName: activeShowroom?.name ?? null,
      });
      toast({ title: t("moodboard.reviewSent") });
      setMessage("");
      setEmail("");
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to send. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">{t("moodboard.reviewTitle")}</DialogTitle>
          <DialogDescription className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
            {t("moodboard.reviewDesc")}
          </DialogDescription>
        </DialogHeader>

        {/* Material summary */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#e8e4e0", borderWidth: "0.5px" }}>
          {materials.map((m) => (
            <div
              key={m.slot}
              className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "#e8e4e0", borderWidth: "0.5px" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.04em] shrink-0"
                  style={{ color: "rgba(0,0,0,0.35)", width: "88px" }}
                >
                  {t(`surface.${m.slot}`)}
                </span>
                <span className="text-xs truncate" style={{ color: "rgba(0,0,0,0.7)" }}>{m.name}</span>
              </div>
              <span
                className="text-[10px] font-mono shrink-0 ml-2"
                style={{ color: m.compatible ? '#647d75' : '#9a3412' }}
              >
                {m.compatible ? "✓" : "✗"} {m.code}
              </span>
            </div>
          ))}
        </div>

        {incompatible.length > 0 && (
          <p className="text-[11px]" style={{ color: '#9a3412' }}>
            {incompatible.map((m) => t(`surface.${m.slot}`)).join(", ")} — {t("moodboard.someNotPairing").toLowerCase()}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("moodboard.reviewMessage")}
            className="resize-none h-20 text-xs"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("moodboard.reviewEmail")}
            className="text-xs"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 rounded-full text-[11px] font-medium tracking-[0.03em] text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          >
            {isSubmitting ? "…" : t("moodboard.reviewSubmit")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
