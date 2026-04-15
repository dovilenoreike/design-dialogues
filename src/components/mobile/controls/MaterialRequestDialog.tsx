import { useState, useEffect, useRef } from "react";
import { Camera, Link } from "lucide-react";
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
type Mode = "upload" | "url";

interface MaterialRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  slotLabel: string;
}

const MaterialRequestDialog = ({ isOpen, onClose, slotLabel }: MaterialRequestDialogProps) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("upload");
  // Upload mode
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // URL mode
  const [imageUrl, setImageUrl] = useState("");
  const [urlPreviewError, setUrlPreviewError] = useState(false);
  // Shared
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("Standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setUrlPreviewError(false);
  }, [imageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "url") {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
    } else {
      setImageUrl("");
      setUrlPreviewError(false);
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMode("upload");
    setFile(null);
    setPreviewUrl(null);
    setImageUrl("");
    setUrlPreviewError(false);
    setDescription("");
    setEmail("");
    setTier("Standard");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const hasImage = mode === "upload" ? !!file : !!imageUrl.trim();
  const hasContent = description.trim().length > 0 || hasImage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) {
      toast.error(t("materialRequest.errorEmpty"));
      return;
    }
    if (!email.trim()) {
      toast.error(t("materialRequest.errorNoEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl: string | null = null;

      if (mode === "upload" && file) {
        const compressed = await compressImage(file, 1280);
        const path = `${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("inspirations")
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inspirations").getPublicUrl(path);
        finalImageUrl = urlData.publicUrl;
      } else if (mode === "url" && imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      await sendEmail("material-slot-request", {
        slot: slotLabel,
        description: description.trim() || null,
        imageUrl: finalImageUrl,
        email: email.trim(),
        tier,
      });

      toast.success(t("materialRequest.success"));
      handleClose();
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const urlTrimmed = imageUrl.trim();
  const showUrlPreview = mode === "url" && urlTrimmed.length > 0 && !urlPreviewError;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {t("materialRequest.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("materialRequest.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Slot context */}
        <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          {t("materialRequest.surface")}: <span className="font-medium" style={{ color: "#1a1a1a" }}>{slotLabel}</span>
        </p>

        <div className="flex flex-col gap-3">
          {/* Description */}
          <Textarea
            placeholder={t("materialRequest.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none h-20 text-xs"
          />

          {/* Image — optional, mode toggle */}
          <div className="flex rounded-full p-0.5 gap-0.5" style={{ backgroundColor: "#f0ede9" }}>
            {(["upload", "url"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-full text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: mode === m ? "white" : "transparent",
                  color: mode === m ? "#1a1a1a" : "rgba(0,0,0,0.4)",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {m === "upload"
                  ? <><Camera size={12} strokeWidth={1.8} />{t("inspiration.modeUpload")}</>
                  : <><Link size={12} strokeWidth={1.8} />{t("inspiration.modeUrl")}</>
                }
              </button>
            ))}
          </div>

          {mode === "upload" ? (
            <>
              <label className="cursor-pointer block" onClick={(e) => e.stopPropagation()}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-36 object-cover rounded-xl" />
                ) : (
                  <div
                    className="w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                    style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  >
                    <Camera size={24} style={{ color: "#647d75", opacity: 0.4 }} strokeWidth={1.5} />
                    <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>
                      {t("inspiration.uploadHint")} ({t("materialRequest.optional")})
                    </p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              {previewUrl && (
                <label className="text-[11px] text-center block cursor-pointer -mt-1" style={{ color: "#647d75" }}>
                  {t("inspiration.replace")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </>
          ) : (
            <>
              <Input
                type="url"
                placeholder={t("inspiration.urlPlaceholder")}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-xs"
              />
              {showUrlPreview && (
                <img
                  src={urlTrimmed}
                  alt="Preview"
                  className="w-full h-36 object-cover rounded-xl"
                  onError={() => setUrlPreviewError(true)}
                />
              )}
              {urlPreviewError && (
                <p className="text-[11px] text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
                  {t("inspiration.urlPreviewFailed")}
                </p>
              )}
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Tier */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                {t("materialRequest.tierLabel")}
              </p>
              <TierSelector selectedTier={tier} onSelectTier={setTier} />
            </div>

            <Input
              type="email"
              placeholder={t("materialRequest.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs"
            />
            <button
              type="submit"
              disabled={isSubmitting || !hasContent}
              className="w-full h-9 rounded-full text-[11px] font-medium tracking-[0.03em] text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
            >
              {isSubmitting ? "…" : t("materialRequest.submit")}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialRequestDialog;
