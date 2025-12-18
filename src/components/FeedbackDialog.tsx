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

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error(t("feedback.errorEmpty"));
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(t("feedback.success"));
    setFeedback("");
    setEmail("");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Textarea
            placeholder={t("feedback.placeholder")}
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
