import { useState, useEffect } from "react";
import { useConsent } from "@/contexts/ConsentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDesign } from "@/contexts/DesignContext";

export default function CookieConsentBanner() {
  const { consentGiven, acceptAll, declineAll } = useConsent();
  const { t } = useLanguage();
  const { isSharedSession } = useDesign();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consentGiven !== null || isSharedSession) return;
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [consentGiven, isSharedSession]);

  if (consentGiven !== null || !visible) return null;

  const handleAccept = () => acceptAll();
  const handleDecline = () => declineAll();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-background border-t border-border px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <p className="flex-1 text-xs text-muted-foreground leading-snug">
          {t("cookies.bannerText")}
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {t("cookies.decline")}
          </button>
          <button
            onClick={handleAccept}
            className="text-xs px-3 py-1.5 rounded-md text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#647d75" }}
          >
            {t("cookies.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
