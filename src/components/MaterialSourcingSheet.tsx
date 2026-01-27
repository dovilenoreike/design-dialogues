import { MapPin, Clock, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCity, CITIES, CITY_LABELS } from "@/contexts/CityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getShowroomsForMaterial, getProvidersForMaterial, getSpecialtyForMaterial } from "@/data/sourcing";

// Map specialty to translation key
const specialtyToTranslationKey: Record<string, string> = {
  Cabinetry: "sourcing.findCarpenter",
  Flooring: "sourcing.findFlooringInstaller",
  "Tile Installation": "sourcing.findTileInstaller",
};

export interface MaterialInfo {
  name: string;
  materialType?: string;
  technicalCode?: string;
  imageUrl?: string;
  showroomIds?: string[];
}

interface MaterialSourcingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialInfo | null;
}

const MaterialSourcingSheet = ({
  isOpen,
  onClose,
  material,
}: MaterialSourcingSheetProps) => {
  const { t } = useLanguage();
  const { city, setCity } = useCity();

  if (!material) return null;

  const showroomResult = getShowroomsForMaterial(city, material.showroomIds);
  const providers = getProvidersForMaterial(city, material.materialType);
  const specialty = getSpecialtyForMaterial(material.materialType);

  const hasShowrooms = showroomResult.available.length > 0;
  const hasOtherCities = showroomResult.otherCities.length > 0;
  const hasProviders = providers.length > 0;

  // Get dynamic title for provider section
  const providerSectionTitle = specialty && specialtyToTranslationKey[specialty]
    ? t(specialtyToTranslationKey[specialty])
    : t("sourcing.findCarpenter");

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto pb-safe">
          {/* Header */}
          <DrawerHeader className="pb-4">
            <div className="flex items-start gap-4">
              {/* Material Image */}
              {material.imageUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-muted">
                  <img
                    src={material.imageUrl}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-base font-medium text-foreground text-left">
                  {material.name}
                </DrawerTitle>
                {material.technicalCode && (
                  <div className="mt-1.5 text-left">
                    <span className="inline-block bg-muted rounded-md px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {material.technicalCode}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DrawerHeader>

          {/* City Selector */}
          <div className="px-6 pb-5">
            <Select value={city} onValueChange={(value) => setCity(value as City)}>
              <SelectTrigger className="w-full gap-2 justify-start">
                <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                <SelectValue className="text-left" />
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

          {/* Where to Buy Section */}
          <div className="px-6 pb-5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">
              {t("sourcing.whereToBuy")}
            </p>

            {hasShowrooms ? (
              <div className="space-y-2">
                {showroomResult.available.map((showroom) => (
                  <a
                    key={showroom.id}
                    href={showroom.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{showroom.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {showroom.address}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
                  </a>
                ))}
              </div>
            ) : hasOtherCities ? (
              <div className="flex items-center gap-2 p-4 bg-background border border-border rounded-xl">
                <MapPin size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t("sourcing.availableIn")}: {showroomResult.otherCities.map(c => CITY_LABELS[c]).join(", ")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-background border border-border rounded-xl">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("sourcing.comingSoon")}</span>
              </div>
            )}
          </div>

          {/* Find Installer Section */}
          <div className="px-6 pb-6">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">
              {providerSectionTitle}
            </p>

            {hasProviders ? (
              <div className="space-y-2">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-3 p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{provider.name}</p>
                      {provider.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {provider.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-background border border-border rounded-xl">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("sourcing.comingSoon")}</span>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MaterialSourcingSheet;
