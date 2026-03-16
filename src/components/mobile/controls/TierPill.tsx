import { useLanguage } from "@/contexts/LanguageContext";

export default function TierPill() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted text-muted-foreground">
      {t("tier.standard")}
    </div>
  );
}
