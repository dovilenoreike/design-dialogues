import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const TRANSFORMATION_STATES = [
  { input: "/placeholders/floorplan.webp", output: "/placeholders/result-plan.webp" },
  { input: "/placeholders/sketch.webp", output: "/placeholders/result-sketch.webp" },
  { input: "/placeholders/photo.webp", output: "/placeholders/result-photo.webp" },
] as const;

// Timing constants (in ms)
const FADE_IN_DURATION = 500;
const HOLD_INPUT_DURATION = 1000;
const CROSSFADE_DURATION = 500;
const HOLD_OUTPUT_DURATION = 1500;
const FADE_OUT_DURATION = 500;

export function ConceptPlaceholder() {
  const { t } = useLanguage();
  const [stateIndex, setStateIndex] = useState(0);
  const [phase, setPhase] = useState<"fadeIn" | "holdInput" | "crossfade" | "holdOutput" | "fadeOut">("fadeIn");

  const advancePhase = useCallback(() => {
    setPhase((currentPhase) => {
      switch (currentPhase) {
        case "fadeIn":
          return "holdInput";
        case "holdInput":
          return "crossfade";
        case "crossfade":
          return "holdOutput";
        case "holdOutput":
          return "fadeOut";
        case "fadeOut":
          setStateIndex((prev) => (prev + 1) % TRANSFORMATION_STATES.length);
          return "fadeIn";
        default:
          return "fadeIn";
      }
    });
  }, []);

  useEffect(() => {
    const durations: Record<typeof phase, number> = {
      fadeIn: FADE_IN_DURATION,
      holdInput: HOLD_INPUT_DURATION,
      crossfade: CROSSFADE_DURATION,
      holdOutput: HOLD_OUTPUT_DURATION,
      fadeOut: FADE_OUT_DURATION,
    };

    const timeout = setTimeout(advancePhase, durations[phase]);
    return () => clearTimeout(timeout);
  }, [phase, advancePhase]);

  const currentState = TRANSFORMATION_STATES[stateIndex];

  // Determine opacity for each layer based on phase
  const getContainerOpacity = () => {
    if (phase === "fadeIn") return "opacity-0 animate-[fadeIn_500ms_ease-out_forwards]";
    if (phase === "fadeOut") return "opacity-100 animate-[fadeOut_500ms_ease-in_forwards]";
    return "opacity-100";
  };

  const showResult = phase === "crossfade" || phase === "holdOutput" || phase === "fadeOut";

  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Background images container with fade in/out */}
      <div className={cn("absolute inset-0", getContainerOpacity())}>
        {/* Input image */}
        <img
          src={currentState.input}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out",
            showResult ? "opacity-0" : "opacity-100"
          )}
        />
        {/* Output image */}
        <img
          src={currentState.output}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out",
            showResult ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* CTA content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <Plus className="w-10 h-10 stroke-[0.75]" />
        <span className="font-serif text-lg mt-2">
          {t("thread.conceptCTA")}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] mt-3 text-white/70">
          {t("thread.conceptMethods")}
        </span>
      </div>

      {/* Hover state */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
    </div>
  );
}
