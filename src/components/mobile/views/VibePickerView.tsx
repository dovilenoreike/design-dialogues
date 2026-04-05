import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMaterialByCode } from "@/hooks/useGraphMaterials";
import type { Language } from "@/contexts/LanguageContext";
import type { VibeTag } from "@/data/collections/types";

// Material codes that represent each vibe — images come from Supabase
const VIBES: {
  id: VibeTag;
  code: string;
  legend: Record<Language, string>;
}[] = [
  {
    id: "light-and-airy",
    code: "velvet-7393",
    legend: { en: "NATURAL PLASTER • WHITE CONCRETE", lt: "NATŪRALUS TINKAS • BALTAS BETONAS" },
  },
  {
    id: "warm-and-grounded",
    code: "egger-natural-casella-oak",
    legend: { en: "NATURAL OAK • SAND PLASTER", lt: "NATŪRALUS ĄŽUOLAS • SMĖLIO TINKAS" },
  },
  {
    id: "bold-and-moody",
    code: "icono-marquina-cava",
    legend: { en: "BLACK MARBLE • MATTE METAL", lt: "JUODAS MARMURAS • MATINIS METALAS" },
  },
];

export default function VibePickerView() {
  const { setVibeTag, skipVibePicker } = useDesign();
  const { t, language } = useLanguage();

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-6 lg:px-0 lg:pt-0 lg:pb-0">

      {/* Prompt label */}
      <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center mb-4 shrink-0 lg:hidden">
        {t("vibe.prompt")}
      </p>

      {/* Desktop: full-height gallery wrapper */}
      <div className="flex-1 flex flex-col min-h-0 lg:max-w-7xl lg:mx-auto lg:w-full lg:px-8 lg:py-10">

        {/* Desktop prompt */}
        <p className="hidden lg:block text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center mb-6 shrink-0">
          {t("vibe.prompt")}
        </p>

        {/* Cards row */}
        <div
          className="flex flex-col gap-3 flex-1 min-h-0 lg:flex-row lg:gap-4"
          style={{ maxHeight: "80vh" }}
        >
          {VIBES.map((vibe, i) => (
            <button
              key={vibe.id}
              onClick={() => setVibeTag(vibe.id)}
              className="
                group relative flex-1 min-h-0 rounded-2xl overflow-hidden
                active:scale-[0.98] transition-all duration-500
                lg:min-h-[600px] lg:hover:flex-[1.4_1_0%]
              "
              aria-label={t(`vibe.${vibe.id}`)}
            >
              {/* Texture photo — slightly desaturated at rest, full color on hover */}
              <img
                src={getMaterialByCode(vibe.code)?.imageUrl ?? ""}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 lg:saturate-[0.65] lg:group-hover:saturate-100"
                draggable={false}
              />

              {/* Bottom-half gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Index — top-left */}
              <span className="absolute top-5 left-5 text-[10px] tracking-[0.2em] text-white/60 lg:top-6 lg:left-6">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Title + material legend — bottom-left */}
              <div className="absolute inset-0 flex items-end p-5 lg:p-7">
                <div>
                  <span className="font-serif text-xl tracking-wide text-white block">
                    {t(`vibe.${vibe.id}`)}
                  </span>
                  <span className="hidden lg:block text-[9px] tracking-[0.2em] font-medium text-white/55 mt-1.5 uppercase">
                    {vibe.legend[language]}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Skip link */}
        <button
          onClick={skipVibePicker}
          className="mt-3 text-[10px] text-muted-foreground/70 underline underline-offset-2 self-center shrink-0"
        >
          {t("vibe.seeAll")}
        </button>

      </div>
    </div>
  );
}
