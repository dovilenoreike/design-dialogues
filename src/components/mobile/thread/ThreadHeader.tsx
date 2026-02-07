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
  const { formData } = useDesign();
  const { city, setCity, cityLabel } = useCity();
  const { t, language } = useLanguage();

  // Build area label if area exists
  const areaLabel = formData?.area
    ? `${formData.area} M² ${language === "lt" ? "BUTAS" : "APARTMENT"}`
    : null;

  return (
    <header className="mb-8">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-2">
        {areaLabel && (
          <>
            <span>{areaLabel}</span>
            <span>•</span>
          </>
        )}
        <Select value={city} onValueChange={(value) => setCity(value as City)}>
          <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 gap-1 text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-500 hover:text-neutral-700 focus:ring-0 focus:ring-offset-0">
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
      <h1 className="text-2xl font-serif text-neutral-900">
        {t("thread.title")}
      </h1>
    </header>
  );
}
