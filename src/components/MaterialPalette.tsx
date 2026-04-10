import { useHaptic } from "@/hooks/use-haptic";

interface MaterialPaletteProps {
  freestyleDescription: string;
  onFreestyleChange: (description: string) => void;
}

const MaterialPalette = ({
  freestyleDescription,
  onFreestyleChange,
}: MaterialPaletteProps) => {
  useHaptic();

  return (
    <div>
      <h3 className="text-base md:text-lg font-serif mb-1">Material Vision</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-4">Describe your desired materials</p>
      <textarea
        value={freestyleDescription}
        onChange={(e) => onFreestyleChange(e.target.value)}
        placeholder="Describe your vision...&#10;e.g., Black matte kitchen facades, white quartz worktops, warm oak flooring, brass accents"
        className="w-full h-32 p-4 text-sm bg-white border border-ds-border-default rounded-xl resize-none placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-interactive-default/10 focus:border-ds-border-strong transition-all"
      />
    </div>
  );
};

export default MaterialPalette;
