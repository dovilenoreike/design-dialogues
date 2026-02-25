import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LayoutGrid, PenLine, Camera } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
}

export default function UploadMenuSheet({
  open,
  onOpenChange,
  onSelect,
}: UploadMenuSheetProps) {
  const { t } = useLanguage();

  const options = [
    {
      icon: LayoutGrid,
      label: t("mobile.uploadMenu.2dPlan"),
      tip: t("mobile.uploadMenu.2dPlanTip"),
    },
    {
      icon: PenLine,
      label: t("mobile.uploadMenu.sketch"),
      tip: t("mobile.uploadMenu.sketchTip"),
    },
    {
      icon: Camera,
      label: t("mobile.uploadMenu.photo"),
      tip: t("mobile.uploadMenu.photoTip"),
    },
  ];

  const handleSelect = () => {
    onOpenChange(false);
    onSelect();
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
                onClick={handleSelect}
                className="flex items-center gap-4 w-full py-6 text-left transition-colors active:bg-neutral-50"
              >
                <opt.icon
                  className="w-5 h-5 text-neutral-900 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-[15px] text-neutral-900">
                    {opt.label}
                  </span>
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
