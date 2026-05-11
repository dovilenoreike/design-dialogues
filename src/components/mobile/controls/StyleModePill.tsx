import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StyleMode } from "@/lib/palette-scoring";

const MODES: StyleMode[] = ['quiet', 'grounded', 'intentional'];

export default function StyleModePill() {
  const { styleMode, setStyleMode } = useDesign();
  const { t } = useLanguage();

  const cycle = () => {
    const next = MODES[(MODES.indexOf(styleMode) + 1) % MODES.length];
    setStyleMode(next);
  };

  return (
    <button
      onClick={cycle}
      className="text-[11px] font-medium tracking-[0.04em] uppercase active:opacity-40 transition-opacity"
      style={{ color: "rgba(0,0,0,0.45)" }}
    >
      {t(`styleMode.${styleMode}`)} ›
    </button>
  );
}
