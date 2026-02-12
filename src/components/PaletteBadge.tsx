import { useLanguage } from "@/contexts/LanguageContext";

interface PaletteBadgeProps {
  status?: "available" | "coming-soon";
}

export function PaletteBadge({ status }: PaletteBadgeProps) {
  const { t } = useLanguage();

  if (!status || status === "available") {
    return null;
  }

  return (
    <div className="absolute top-1.5 right-1.5 z-10">
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-semibold uppercase tracking-tight bg-black/70 text-white backdrop-blur-sm shadow-sm border border-white/20 whitespace-nowrap">
        {t("comingSoon.badge")}
      </span>
    </div>
  );
}
