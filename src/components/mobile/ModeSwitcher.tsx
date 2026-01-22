import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";

const modes: ControlMode[] = ["rooms", "styles", "palettes"];

export default function ModeSwitcher() {
  const { activeMode, setActiveMode } = useDesign();
  const { t } = useLanguage();

  return (
    <div className="flex gap-5 px-4 py-1.5 border-b border-border bg-background">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => setActiveMode(mode)}
          className={`relative pb-1 text-xs font-medium transition-colors ${
            activeMode === mode
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          {t(`modes.${mode}`)}
          {activeMode === mode && (
            <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground" />
          )}
        </button>
      ))}
    </div>
  );
}
