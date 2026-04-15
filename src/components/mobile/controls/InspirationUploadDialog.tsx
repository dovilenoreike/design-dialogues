import { useState, useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { sendEmail } from "@/lib/send-email";
import { compressImage } from "@/lib/image-utils";
import { supabase } from "@/integrations/supabase/client";
import TierSelector from "@/components/TierSelector";

type Tier = "Budget" | "Standard" | "Premium";

interface InspirationUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const InspirationUploadDialog = ({ isOpen, onClose }: InspirationUploadDialogProps) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("Standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setMessage("");
    setEmail("");
    setTier("Standard");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error(t("inspiration.errorNoImage"));
      return;
    }
    if (!email.trim()) {
      toast.error(t("inspiration.errorNoEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      const compressed = await compressImage(file, 1280);
      const path = `${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("inspirations")
        .upload(path, compressed, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("inspirations")
        .getPublicUrl(path);

      await sendEmail("inspiration-upload", {
        imageUrl: urlData.publicUrl,
        message: message.trim() || null,
        email: email.trim(),
        tier,
      });

      toast.success(t("inspiration.success"));
      handleClose();
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {t("inspiration.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("inspiration.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-1">
          {/* Upload zone */}
          <label className="cursor-pointer block">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl"
              />
            ) : (
              <div
                className="w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                <Camera size={28} style={{ color: "#647d75", opacity: 0.5 }} strokeWidth={1.5} />
                <p className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {t("inspiration.uploadHint")}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Replace link */}
          {previewUrl && (
            <label
              className="text-[11px] text-center block cursor-pointer -mt-1"
              style={{ color: "#647d75" }}
            >
              {t("inspiration.replace")}
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Price tier */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                {t("inspiration.tierLabel")}
              </p>
              <TierSelector selectedTier={tier} onSelectTier={setTier} />
            </div>

            <Textarea
              placeholder={t("inspiration.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none h-20 text-xs"
            />
            <Input
              type="email"
              placeholder={t("inspiration.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs"
            />
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="w-full h-9 rounded-full text-[11px] font-medium tracking-[0.03em] text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
            >
              {isSubmitting ? "…" : t("inspiration.submit")}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspirationUploadDialog;
