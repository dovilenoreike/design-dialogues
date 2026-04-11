import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SupabaseMaterial } from "@/hooks/useGraphMaterials";

interface MaterialDetailModalProps {
  material: SupabaseMaterial | null;
  onClose: () => void;
}

export default function MaterialDetailModal({ material, onClose }: MaterialDetailModalProps) {
  const { language } = useLanguage();
  const lang = language as "en" | "lt";

  return (
    <Sheet open={material !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl overflow-hidden sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2 [&>button.absolute]:hidden"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">
          {material?.name?.[lang] ?? material?.technicalCode ?? ""}
        </SheetTitle>

        {material && (
          <div>
            {/* Hero image — 16:9 */}
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              {material.imageUrl ? (
                <img
                  src={material.imageUrl}
                  alt={material.name?.[lang] ?? material.technicalCode}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: "#e8e4e0" }} />
              )}
              {/* Close button overlaid on image */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(4px)" }}
              >
                <X className="w-4 h-4" style={{ color: "#1a1a1a" }} strokeWidth={2} />
              </button>
            </div>

            {/* Info */}
            <div className="px-4 pt-3 pb-6">
              <h2 className="text-xl font-medium leading-snug" style={{ color: "#1a1a1a" }}>
                {material.name?.[lang] ?? material.technicalCode}
              </h2>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="font-mono text-[11px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                >
                  {material.technicalCode}
                </span>
                {material.materialType && (
                  <span className="text-[12px]" style={{ color: "#9ca3af" }}>
                    {material.materialType}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
