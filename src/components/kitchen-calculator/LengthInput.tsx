import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LengthInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
}

/** Single kitchen-length input + Generate (spec §UI Layout, top row). */
export function LengthInput({ value, onChange, onGenerate }: LengthInputProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kitchen-length">Kitchen length (m)</Label>
        <Input
          id="kitchen-length"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32"
          onKeyDown={(e) => {
            if (e.key === "Enter") onGenerate();
          }}
        />
      </div>
      <Button onClick={onGenerate} style={{ backgroundColor: "#647d75" }} className="text-white">
        Generate
      </Button>
    </div>
  );
}
