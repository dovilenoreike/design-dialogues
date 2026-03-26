import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VibeTag } from "@/data/collections/types";
import imgVelvet7393 from "@/assets/materials/sleeping-earth/material4.jpg";
import imgEggerNaturalCasellaOak from "@/assets/materials/cabinet-fronts/egger-natural-casella-oak.jpg";
import imgIconoMarquinaCava from "@/assets/materials/worktops/icono_C35_marquina_cava.jpg";

const VIBES: {
  id: VibeTag;
  image: string;
}[] = [
  { id: "light-and-airy",    image: imgVelvet7393 },
  { id: "warm-and-grounded", image: imgEggerNaturalCasellaOak },
  { id: "bold-and-moody",    image: imgIconoMarquinaCava },
];

export default function VibePickerView() {
  const { setVibeTag, skipVibePicker } = useDesign();
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-6">
      <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center mb-4 shrink-0">
        {t("vibe.prompt")}
      </p>

      <div className="flex flex-col gap-3 flex-1 min-h-0" style={{ maxHeight: "80vh" }}>
        {VIBES.map((vibe, i) => (
          <button
            key={vibe.id}
            onClick={() => setVibeTag(vibe.id)}
            className="relative flex-1 min-h-0 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            aria-label={t(`vibe.${vibe.id}`)}
          >
            {/* Texture photo */}
            <img
              src={vibe.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            {/* Bottom gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            {/* Index number — top-left */}
            <span className="absolute top-6 left-6 text-[10px] tracking-[0.2em] text-white/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* Title — bottom-left */}
            <div className="absolute inset-0 flex items-end p-6">
              <span className="font-serif text-xl tracking-wide text-white">
                {t(`vibe.${vibe.id}`)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={skipVibePicker}
        className="mt-3 text-[10px] text-muted-foreground/70 underline underline-offset-2 self-center shrink-0"
      >
        {t("vibe.seeAll")}
      </button>
    </div>
  );
}
