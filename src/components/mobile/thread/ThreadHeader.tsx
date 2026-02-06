import { useDesign } from "@/contexts/DesignContext";
import { useCity } from "@/contexts/CityContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function ThreadHeader() {
  const { formData } = useDesign();
  const { cityLabel } = useCity();
  const { t } = useLanguage();

  // Build project label based on available data
  const projectLabel = formData?.area
    ? t("thread.projectLabel")
        .replace("{{area}}", String(formData.area))
        .replace("{{city}}", cityLabel.toUpperCase())
    : t("thread.projectLabelCityOnly").replace("{{city}}", cityLabel.toUpperCase());

  return (
    <header className="mb-8">
      <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-2">
        {projectLabel}
      </p>
      <h1 className="text-2xl font-serif text-neutral-900">
        {t("thread.title")}
      </h1>
    </header>
  );
}
