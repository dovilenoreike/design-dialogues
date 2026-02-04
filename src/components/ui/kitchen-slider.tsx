import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { calculateKitchenLinear } from "@/data/layout-audit-rules";

interface KitchenSliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange"> {
  value: number;
  onValueChange: (value: number) => void;
  numberOfAdults: number;
  numberOfChildren: number;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Architectural slider with ergonomic standard range indicator
 *
 * Shows a subtle sage green segment for the optimal range
 * Clean, minimal aesthetic aligned with high-end design
 */
const KitchenSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  KitchenSliderProps
>(
  (
    {
      className,
      value,
      onValueChange,
      numberOfAdults,
      numberOfChildren,
      min = 2,
      max = 8,
      step = 0.5,
      ...props
    },
    ref
  ) => {
    // Ensure valid numbers with fallbacks
    const safeAdults = (typeof numberOfAdults === 'number' && !isNaN(numberOfAdults)) ? numberOfAdults : 2;
    const safeChildren = (typeof numberOfChildren === 'number' && !isNaN(numberOfChildren)) ? numberOfChildren : 0;
    const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 3;

    // Calculate recommended kitchen length
    const recommended = parseFloat(calculateKitchenLinear(safeAdults, safeChildren)) || 3.0;

    // Calculate ergonomic standard range (recommended ± tolerance)
    const rangeStart = Math.max(3, recommended - 0.9);
    const rangeEnd = Math.min(max, recommended + 1.2);

    // Calculate percentages for positioning
    const totalRange = max - min;
    const startPercent = ((rangeStart - min) / totalRange) * 100;
    const widthPercent = ((rangeEnd - rangeStart) / totalRange) * 100;

    // Calculate recommended marker position
    const recommendedPercent = ((recommended - min) / totalRange) * 100;

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={[safeValue]}
        onValueChange={(values) => onValueChange(values[0])}
        min={min}
        max={max}
        step={step}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-neutral-100">
          {/* Ergonomic Standard Range - Sage Green segment */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: 'rgba(100, 125, 117, 0.25)', // Sage Green at 25% opacity
            }}
          />
          {/* Recommended marker | */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-[#647D75] pointer-events-none"
            style={{ left: `${recommendedPercent}%` }}
          />
          <SliderPrimitive.Range className="absolute h-full bg-transparent" />
        </SliderPrimitive.Track>

        {/* Solid neutral-900 knob */}
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-neutral-900 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 z-10" />
      </SliderPrimitive.Root>
    );
  }
);

KitchenSlider.displayName = "KitchenSlider";

/**
 * Get the ergonomic status for kitchen length
 */
export const getKitchenStatus = (
  value: number,
  numberOfAdults: number,
  numberOfChildren: number
): 'optimal' | 'underbuilt' | 'overbuilt' => {
  const safeAdults = (typeof numberOfAdults === 'number' && !isNaN(numberOfAdults)) ? numberOfAdults : 2;
  const safeChildren = (typeof numberOfChildren === 'number' && !isNaN(numberOfChildren)) ? numberOfChildren : 0;
  const recommended = parseFloat(calculateKitchenLinear(safeAdults, safeChildren)) || 3.0;

  if (value < recommended - 0.9) return 'underbuilt';
  if (value > recommended + 1.5) return 'overbuilt';
  return 'optimal';
};

/**
 * Get recommended kitchen length
 */
export const getRecommendedKitchen = (numberOfAdults: number, numberOfChildren: number): number => {
  const safeAdults = (typeof numberOfAdults === 'number' && !isNaN(numberOfAdults)) ? numberOfAdults : 2;
  const safeChildren = (typeof numberOfChildren === 'number' && !isNaN(numberOfChildren)) ? numberOfChildren : 0;
  return parseFloat(calculateKitchenLinear(safeAdults, safeChildren)) || 3.0;
};

export { KitchenSlider };
