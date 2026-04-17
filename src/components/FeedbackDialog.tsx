import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { sendEmail } from "@/lib/send-email";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Topic = "broke" | "missing" | "idea" | null;

const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { t } = useLanguage();
  const [topic, setTopic] = useState<Topic>(null);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chips: { key: Topic; label: string; placeholder: string }[] = [
    { key: "broke", label: t("feedback.chipBroke"), placeholder: t("feedback.placeholderBroke") },
    { key: "missing", label: t("feedback.chipMissing"), placeholder: t("feedback.placeholderMissing") },
    { key: "idea", label: t("feedback.chipIdea"), placeholder: t("feedback.placeholderIdea") },
  ];

  const activePlaceholder =
    chips.find((c) => c.key === topic)?.placeholder ?? t("feedback.placeholder");

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error(t("feedback.errorEmpty"));
      return;
    }

    setIsSubmitting(true);

    const topicLabel = chips.find((c) => c.key === topic)?.label;
    const body = topicLabel ? `[${topicLabel}]\n\n${feedback}` : feedback;

    try {
      await sendEmail("feedback", { feedback: body, email });
      toast.success(t("feedback.success"));
      setFeedback("");
      setEmail("");
      setTopic(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTopic(null);
      setFeedback("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {t("feedback.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("feedback.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex gap-2 flex-wrap">
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setTopic(topic === chip.key ? null : chip.key)}
                className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                  topic === chip.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <Textarea
            placeholder={activePlaceholder}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] resize-none"
          />

          <Input
            type="email"
            placeholder={t("feedback.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t("feedback.sending") : t("feedback.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Trigger button for desktop header
export const FeedbackTrigger = ({ onClick }: { onClick: () => void }) => {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
    >
      <MessageSquare size={14} />
      {t("feedback.button")}
    </button>
  );
};

// Trigger for mobile drawer
export const FeedbackMobileItem = ({ onClick }: { onClick: () => void }) => {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
    >
      <MessageSquare size={18} />
      {t("feedback.mobileButton")}
    </button>
  );
};

export default FeedbackDialog;
