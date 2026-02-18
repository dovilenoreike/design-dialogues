import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendEmail } from "@/lib/send-email";

interface DesignerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  designerName: string;
  designerEmail?: string;
}

export default function DesignerContactModal({
  isOpen,
  onClose,
  designerName,
  designerEmail,
}: DesignerContactModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendEmail("designer-inquiry", {
        name,
        email,
        project,
        designerName,
        designerEmail,
      });

      toast.success(t("designer.successTitle"), {
        description: t("designer.successDescription").replace("{name}", designerName),
        position: "top-center",
      });

      // Reset form
      setName("");
      setEmail("");
      setProject("");
      onClose();
    } catch (error) {
      toast.error(t("error.sendEmailFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {t("designer.contactTitle").replace("{name}", designerName)}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {t("designer.contactDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("designer.formName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("designer.formName")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("designer.formEmail")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">{t("designer.formProject")}</Label>
            <Textarea
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder={t("designer.formProjectPlaceholder")}
              className="resize-none h-28"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("designer.sending") : t("designer.sendInquiryButton")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
