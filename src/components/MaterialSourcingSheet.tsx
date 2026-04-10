import { useState } from "react";
import { MapPin, Clock, ChevronRight, X, Phone, Globe } from "lucide-react";
import type { ProviderBrand } from "@/data/sourcing/types";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCity, CITIES, CITY_LABELS, type City } from "@/contexts/CityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getShowroomsForMaterial, getProvidersForMaterial, getSpecialtyForMaterial } from "@/data/sourcing";
import { useProvider } from "@/contexts/ProviderContext";
import { sendEmail } from "@/lib/send-email";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const isMobile = useIsMobile();
  const { activeProvider } = useProvider();
  const [contactProvider, setContactProvider] = useState<ProviderBrand | null>(null);
  const [msgName, setMsgName] = useState("");
  const [msgEmail, setMsgEmail] = useState("");
  const [msgText, setMsgText] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const handleProviderMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactProvider) return;
    setIsSendingMsg(true);
    try {
      await sendEmail("provider-inquiry", {
        name: msgName,
        email: msgEmail,
        message: msgText,
        providerName: contactProvider.name,
        providerPhone: contactProvider.phone,
      });
      toast.success(t("provider.successTitle"), {
        description: t("provider.successDescription").replace("{name}", contactProvider.name),
        position: "top-center",
      });
      setMsgName("");
      setMsgEmail("");
      setMsgText("");
      setContactProvider(null);
    } catch {
      toast.error(t("error.sendEmailFailed"));
    } finally {
      setIsSendingMsg(false);
    }
  };

  if (!material) return null;

  const showroomResult = getShowroomsForMaterial(city, material.showroomIds);
  const specialty = getSpecialtyForMaterial(material.materialType);
  const allProviders = getProvidersForMaterial(city, material.materialType);
  const providers = activeProvider
    ? (activeProvider.specialty === specialty ? [activeProvider] : [])
    : allProviders;

  const hasShowrooms = showroomResult.available.length > 0;
  const hasOtherCities = showroomResult.otherCities.length > 0;
  const hasProviders = providers.length > 0;

  // Get dynamic title for provider section
  const providerSectionTitle = specialty && specialtyToTranslationKey[specialty]
    ? t(specialtyToTranslationKey[specialty])
    : t("sourcing.findCarpenter");

  // Desktop-only content (hero bleeds edge-to-edge via p-0 on DialogContent)
  const desktopContent = (
    <div className="overflow-y-auto">
      {/* Hero Image */}
      <div className="relative w-full bg-muted overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {material.imageUrl ? (
          <img
            src={material.imageUrl}
            alt={material.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Meta */}
      <div className="px-5 pt-4">
        <h2 className="text-xl font-medium text-foreground leading-snug">{material.name}</h2>
        {material.technicalCode && (
          <span className="inline-block mt-1.5 bg-muted rounded-md px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            {material.technicalCode}
          </span>
        )}
      </div>

      <div className="h-px bg-border mx-5 mt-4" />

      {/* City Selector */}
      <div className="px-5 pt-4 pb-5">
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
      <div className="px-5 pb-5">
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
      <div className="px-5 pb-6">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">
          {providerSectionTitle}
        </p>

        {hasProviders ? (
          <div className="space-y-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setContactProvider(provider)}
                className="w-full flex items-center gap-3 p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors text-left"
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
              </button>
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
  );

  if (isMobile) {
    return (
      <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerTitle className="sr-only">{material.name}</DrawerTitle>

          {/* Hero Image */}
          <div className="relative w-full mt-3 bg-muted overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {material.imageUrl ? (
              <img
                src={material.imageUrl}
                alt={material.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Meta */}
          <div className="px-4 pt-3.5">
            <h2 className="text-xl font-medium text-foreground leading-snug">{material.name}</h2>
            {material.technicalCode && (
              <span className="inline-block mt-1.5 bg-muted rounded-md px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                {material.technicalCode}
              </span>
            )}
          </div>

          <div className="h-px bg-border mx-4 mt-3.5" />

          <div className="overflow-y-auto pb-safe">
            {/* City Selector */}
            <div className="px-4 pt-4 pb-5">
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
            <div className="px-4 pb-5">
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
            <div className="px-4 pb-6">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">
                {providerSectionTitle}
              </p>

              {hasProviders ? (
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setContactProvider(provider)}
                      className="w-full flex items-center gap-3 p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors text-left"
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
                    </button>
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
      {contactProvider && (
        <Dialog open={!!contactProvider} onOpenChange={(open) => !open && setContactProvider(null)}>
          <DialogContent className="max-w-sm p-6" aria-describedby={undefined}>
            <DialogTitle className="font-serif text-xl">
              {t("provider.contactTitle").replace("{name}", contactProvider.name)}
            </DialogTitle>
            {contactProvider.description && (
              <p className="text-sm text-muted-foreground -mt-2">{contactProvider.description}</p>
            )}
            <div className="space-y-3 mt-1">
              {contactProvider.phone && (
                <a
                  href={`tel:${contactProvider.phone}`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/70 transition-colors"
                >
                  <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{contactProvider.phone}</span>
                </a>
              )}
              {contactProvider.website && (
                <a
                  href={contactProvider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/70 transition-colors"
                >
                  <Globe size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{t("sourcing.visitWebsite")}</span>
                </a>
              )}
            </div>
            <div className="border-t border-border pt-4 mt-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                {t("provider.sendMessage")}
              </p>
              <form onSubmit={handleProviderMessage} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prov-name">{t("designer.formName")}</Label>
                  <Input
                    id="prov-name"
                    value={msgName}
                    onChange={(e) => setMsgName(e.target.value)}
                    placeholder={t("designer.formName")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prov-email">{t("designer.formEmail")}</Label>
                  <Input
                    id="prov-email"
                    type="email"
                    value={msgEmail}
                    onChange={(e) => setMsgEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prov-msg">{t("provider.formMessage")}</Label>
                  <Textarea
                    id="prov-msg"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={t("provider.formMessagePlaceholder")}
                    className="resize-none h-24"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSendingMsg}>
                  {isSendingMsg ? t("designer.sending") : t("provider.sendMessageButton")}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden" hideCloseButton aria-describedby={undefined}>
          <DialogTitle className="sr-only">{material.name}</DialogTitle>
          {desktopContent}
        </DialogContent>
      </Dialog>
      {contactProvider && (
        <Dialog open={!!contactProvider} onOpenChange={(open) => !open && setContactProvider(null)}>
          <DialogContent className="max-w-sm p-6" aria-describedby={undefined}>
            <DialogTitle className="font-serif text-xl">
              {t("provider.contactTitle").replace("{name}", contactProvider.name)}
            </DialogTitle>
            {contactProvider.description && (
              <p className="text-sm text-muted-foreground -mt-2">{contactProvider.description}</p>
            )}
            <div className="space-y-3 mt-1">
              {contactProvider.phone && (
                <a
                  href={`tel:${contactProvider.phone}`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/70 transition-colors"
                >
                  <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{contactProvider.phone}</span>
                </a>
              )}
              {contactProvider.website && (
                <a
                  href={contactProvider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/70 transition-colors"
                >
                  <Globe size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{t("sourcing.visitWebsite")}</span>
                </a>
              )}
            </div>
            <div className="border-t border-border pt-4 mt-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                {t("provider.sendMessage")}
              </p>
              <form onSubmit={handleProviderMessage} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prov-name">{t("designer.formName")}</Label>
                  <Input
                    id="prov-name"
                    value={msgName}
                    onChange={(e) => setMsgName(e.target.value)}
                    placeholder={t("designer.formName")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prov-email">{t("designer.formEmail")}</Label>
                  <Input
                    id="prov-email"
                    type="email"
                    value={msgEmail}
                    onChange={(e) => setMsgEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prov-msg">{t("provider.formMessage")}</Label>
                  <Textarea
                    id="prov-msg"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={t("provider.formMessagePlaceholder")}
                    className="resize-none h-24"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSendingMsg}>
                  {isSendingMsg ? t("designer.sending") : t("provider.sendMessageButton")}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MaterialSourcingSheet;
