import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LayoutGrid, PenLine, Camera } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UploadType } from "@/types/design-state";

interface UploadMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: UploadType) => void;
}

export default function UploadMenuSheet({
  open,
  onOpenChange,
  onSelect,
}: UploadMenuSheetProps) {
  const { t } = useLanguage();

  const options: { icon: typeof LayoutGrid; label: string; tip: string; type: UploadType; comingSoon?: boolean; accuracy: string; colors: string[] }[] = [
    {
      icon: Camera,
      label: t("mobile.uploadMenu.photo"),
      tip: t("mobile.uploadMenu.photoTip"),
      type: "photo",
      accuracy: "80–95%",
      colors: ["#647d75"],
    },
    {
      icon: PenLine,
      label: t("mobile.uploadMenu.sketch"),
      tip: t("mobile.uploadMenu.sketchTip"),
      type: "sketch",
      accuracy: "60–95%",
      colors: ["#ca8a04", "#647d75"],
    },
    {
      icon: LayoutGrid,
      label: t("mobile.uploadMenu.2dPlan"),
      tip: t("mobile.uploadMenu.2dPlanTip"),
      type: "floorplan",
      comingSoon: false,
      accuracy: "50–80%",
      colors: ["#ca8a04"],
    },
  ];

  const handleSelect = (type: UploadType) => {
    onOpenChange(false);
    onSelect(type);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="sr-only">
          {t("mobile.uploadMenu.title")}
        </DrawerTitle>
        <div className="px-6 pt-3 pb-10 bg-white">
          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-5 text-center">
            {t("mobile.uploadMenu.sectionHeader")}
          </p>

          <div className="divide-y divide-neutral-200">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => !opt.comingSoon && handleSelect(opt.type)}
                disabled={opt.comingSoon}
                className={`flex items-center gap-4 w-full py-6 text-left transition-colors ${opt.comingSoon ? "opacity-40 cursor-not-allowed" : "active:bg-neutral-50"}`}
              >
                <opt.icon
                  className="w-5 h-5 text-neutral-900 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-[15px] text-neutral-900">
                      {opt.label}
                    </span>
                    {opt.comingSoon && (
                      <span className="text-[10px] tracking-widest uppercase text-neutral-400">
                        Coming Soon
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {opt.colors.map((c, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: c }} />
                      ))}
                      <span className="text-[10px] tracking-wide" style={{ color: opt.colors[opt.colors.length - 1] }}>
                        {opt.accuracy} {t("mobile.uploadMenu.accuracy")}
                      </span>
                    </span>
                  </div>
                  <span className="text-[12px] text-neutral-500 leading-relaxed">
                    {opt.tip}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
