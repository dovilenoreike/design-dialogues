import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GlobalSettings } from "@/lib/kitchen-calculator";

const FIELDS: { key: keyof GlobalSettings; label: string }[] = [
  { key: "baseHeight", label: "Base unit height" },
  { key: "wallHeight", label: "Wall unit height" },
  { key: "tallHeight", label: "Tall unit height" },
  { key: "baseDepth", label: "Base / tall depth" },
  { key: "wallDepth", label: "Wall depth" },
  { key: "islandDepth", label: "Island depth" },
];

interface KitchenSettingsPanelProps {
  settings: GlobalSettings;
  onChange: (settings: GlobalSettings) => void;
}

/** Collapsible heights/depths, collapsed by default (spec §Global Settings). */
export function KitchenSettingsPanel({ settings, onChange }: KitchenSettingsPanelProps) {
  const update = (key: keyof GlobalSettings, raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return;
    onChange({ ...settings, [key]: value });
  };

  return (
    <Collapsible className="rounded-md border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
        <span>Kitchen settings</span>
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-4 border-t px-4 py-4 md:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`setting-${f.key}`} className="text-xs text-muted-foreground">
                {f.label} (mm)
              </Label>
              <Input
                id={`setting-${f.key}`}
                type="number"
                inputMode="numeric"
                min="1"
                value={settings[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
