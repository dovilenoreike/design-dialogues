import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDesign } from "@/contexts/DesignContext";

export const EARLY_ACCESS_BANNER_KEY = "earlyAccessBannerSeen";

interface EarlyAccessBannerProps {
  onDismiss: () => void;
}

export default function EarlyAccessBanner({ onDismiss }: EarlyAccessBannerProps) {
  const { t } = useLanguage();
  const { isSharedSession } = useDesign();
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (isSharedSession || localStorage.getItem(EARLY_ACCESS_BANNER_KEY)) return;
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [isSharedSession]);

  const dismiss = () => {
    setHiding(true);
    localStorage.setItem(EARLY_ACCESS_BANNER_KEY, "1");
    onDismiss();
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        hiding ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted border-b border-border">
        <p className="flex-1 text-xs text-muted-foreground leading-snug">
          {t("earlyAccess.bannerText")}
        </p>
        <button
          onClick={dismiss}
          aria-label={t("earlyAccess.bannerDismiss")}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
