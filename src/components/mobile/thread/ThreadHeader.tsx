import { useMemo } from "react";
import { useDesign } from "@/contexts/DesignContext";
import { useCity, CITIES, CITY_LABELS, City } from "@/contexts/CityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThreadHeader() {
  const { formData, selectedTier } = useDesign();
  const { city, setCity } = useCity();
  const { t } = useLanguage();
  // 1. Project ID (mock for now, persists in session)
  const projectId = useMemo(() => {
    const stored = sessionStorage.getItem('projectId');
    if (stored) return stored;
    const id = `#${Math.floor(Math.random() * 90000) + 10000}`;
    sessionStorage.setItem('projectId', id);
    return id;
  }, []);

  // 2. Area
  const area = formData?.area ? `${formData.area} M²` : "– M²";

  // 3. Tier
  const tier = selectedTier
    ? `${t(`tier.${selectedTier.toLowerCase()}`).toUpperCase()} ${t("tier.label").toUpperCase()}`
    : `${t("tier.standard").toUpperCase()} ${t("tier.label").toUpperCase()}`;

  // 4. Scope
  const scope = useMemo(() => {
    if (!formData?.services) return t("budget.noScope").toUpperCase();

    const count = Object.values(formData.services).filter(Boolean).length;
    const total = Object.values(formData.services).length;

    if (count === total) return t("budget.fullScope").toUpperCase();
    if (count === 0) return t("budget.noScope").toUpperCase();
    return t("budget.partialScope").toUpperCase();
  }, [formData?.services, t]);

  // 5. Check if parameters are defined
  const hasArea = formData?.area && formData.area > 0;
  const hasServices = formData?.services && Object.values(formData.services).some(Boolean);
  const parametersAreDefined = hasArea && hasServices;

  return (
    <header className="relative pl-8">
      {/* Thread line starting from header */}
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border" />

      {/* Project Identity Bar */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400">
          {projectId} •
        </span>
        <Select value={city} onValueChange={(value) => setCity(value as City)}>
          <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 gap-1 text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 hover:text-neutral-500 focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CITY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parameter Data String */}
      <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
        {parametersAreDefined ? `${area} • ${tier} • ${scope}` : t("thread.defineParameters").toUpperCase()}
      </p>
    </header>
  );
}
