import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { HardwareGrade } from "@/lib/kitchen-calculator";

const GRADES: { value: HardwareGrade; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "mid", label: "Mid" },
  { value: "premium", label: "Premium" },
];

interface HardwareGradeSelectorProps {
  value: HardwareGrade;
  onChange: (grade: HardwareGrade) => void;
}

/** Global hardware grade — reprices all hardware instantly (spec §Hardware). */
export function HardwareGradeSelector({ value, onChange }: HardwareGradeSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-muted-foreground">Hardware</span>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as HardwareGrade)}
        className="flex gap-5"
      >
        {GRADES.map((g) => (
          <div key={g.value} className="flex items-center gap-2">
            <RadioGroupItem value={g.value} id={`grade-${g.value}`} />
            <Label htmlFor={`grade-${g.value}`} className="cursor-pointer font-normal">
              {g.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
