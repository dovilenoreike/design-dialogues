import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FormData, ServiceSelection } from "@/types/calculator";

interface ProcessingOverlayProps {
  isVisible: boolean;
  onComplete: (formData: FormData) => void;
}

const ProcessingOverlay = ({ isVisible, onComplete }: ProcessingOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [area, setArea] = useState(50);
  const [isRenovation, setIsRenovation] = useState(false);
  const [services, setServices] = useState<ServiceSelection>({
    spacePlanning: true,
    interiorFinishes: true,
    furnishingDecor: true,
  });
  const [kitchenLength, setKitchenLength] = useState(4);
  const [wardrobeLength, setWardrobeLength] = useState(3);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setProgress(0);
      setFormReady(false);
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      // Show form after initial progress
      setTimeout(() => setFormReady(true), 800);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleSubmit = () => {
    onComplete({ area, isRenovation, services, kitchenLength, wardrobeLength });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />
      
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 pb-safe">
        {/* Progress bar */}
        <div className="mb-4 sm:mb-8">
          <div className="h-0.5 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all duration-300 ease-out progress-animate"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
            Analyzing your space...
          </p>
        </div>

        {/* Form card */}
        {formReady && (
          <div className="glass-panel rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 slide-up max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-serif mb-1">Refine your Quote</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">
              Help us calculate accurately
            </p>

            {/* Area slider */}
            <div className="mb-5 sm:mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs sm:text-sm font-medium">Total Area</label>
                <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">{area} m²</span>
              </div>
              <Slider
                value={[area]}
                onValueChange={(value) => setArea(value[0])}
                min={20}
                max={200}
                step={5}
                className="w-full"
              />
            </div>

            {/* Kitchen Length slider */}
            <div className="mb-5 sm:mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs sm:text-sm font-medium">Kitchen Length</label>
                <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">{kitchenLength} lm</span>
              </div>
              <Slider
                value={[kitchenLength]}
                onValueChange={(value) => setKitchenLength(value[0])}
                min={2}
                max={8}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Wardrobe Length slider */}
            <div className="mb-5 sm:mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs sm:text-sm font-medium">Built-in Wardrobes</label>
                <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">{wardrobeLength} lm</span>
              </div>
              <Slider
                value={[wardrobeLength]}
                onValueChange={(value) => setWardrobeLength(value[0])}
                min={0}
                max={12}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Renovation toggle */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100">
              <label className="font-medium text-sm text-stone-900">Renovation Required</label>
              <Switch
                checked={isRenovation}
                onCheckedChange={setIsRenovation}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={progress < 100}
              className={`w-full mt-5 sm:mt-6 py-3 sm:py-3.5 rounded-full font-medium text-sm transition-all duration-300 active:scale-[0.98] ${
                progress >= 100
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {progress >= 100 ? "View Solutions" : "Processing..."}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingOverlay;
