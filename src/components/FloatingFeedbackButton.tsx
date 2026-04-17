import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FloatingFeedbackButtonProps {
  onClick: () => void;
}

export default function FloatingFeedbackButton({ onClick }: FloatingFeedbackButtonProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      aria-label={t("feedback.button")}
      className="fixed bottom-[calc(56px+12px)] right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 shadow-sm transition-colors"
    >
      <MessageSquare size={13} strokeWidth={1.75} />
      {t("feedback.button")}
    </button>
  );
}
