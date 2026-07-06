import { useEffect, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AUTO_EXTRA_PCT,
  effectiveExtraAmount,
  type ExtraCost,
} from "@/lib/kitchen-calculator";

const SUGGESTIONS = [
  "Design & technical project",
  "Installation",
  "Delivery",
  "Dismantling old kitchen",
  "Waste removal",
  "Discount",
];

const eur = (n: number): string =>
  `${n < 0 ? "−" : ""}€${Math.abs(n).toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;

interface ExtraCostRowProps {
  cost: ExtraCost;
  displayAmount: number;
  /** Overridden auto line — offer a reset back to the default. */
  canReset: boolean;
  onLabelChange: (id: string, label: string) => void;
  onAmountChange: (id: string, amount: number) => void;
  onResetAuto: (id: string) => void;
  onRemove: (id: string) => void;
}

function ExtraCostRow({
  cost,
  displayAmount,
  canReset,
  onLabelChange,
  onAmountChange,
  onResetAuto,
  onRemove,
}: ExtraCostRowProps) {
  const [draft, setDraft] = useState(String(displayAmount));
  useEffect(() => setDraft(displayAmount ? String(displayAmount) : ""), [displayAmount]);

  const commit = (raw: string) => {
    const value = Number(raw);
    if (Number.isFinite(value)) onAmountChange(cost.id, value);
    else if (raw.trim() === "") onAmountChange(cost.id, 0);
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <Input
        value={cost.label}
        onChange={(e) => onLabelChange(cost.id, e.target.value)}
        placeholder="Cost description"
        className="flex-1"
        aria-label="Cost description"
      />
      {canReset && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onResetAuto(cost.id)}
          aria-label={`Reset ${cost.label || "line"} to the default %`}
          title="Back to default %"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">€</span>
        <Input
          type="number"
          inputMode="decimal"
          step="1"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={(e) => commit(e.target.value)}
          placeholder="0"
          className="w-24 text-right"
          aria-label={`${cost.label || "Cost"} amount`}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(cost.id)}
        aria-label={`Remove ${cost.label || "cost"}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ExtraCostsSectionProps {
  costs: ExtraCost[];
  /** Furniture cost the % lines are taken on (cabinets + worktop + extras). */
  furnitureSubtotal: number;
  onLabelChange: (id: string, label: string) => void;
  onAmountChange: (id: string, amount: number) => void;
  onResetAuto: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label?: string) => void;
}

/** Manual quote lines added after the units — delivery, installation, custom work. */
export function ExtraCostsSection({
  costs,
  furnitureSubtotal,
  onLabelChange,
  onAmountChange,
  onResetAuto,
  onRemove,
  onAdd,
}: ExtraCostsSectionProps) {
  const subtotal = costs.reduce((sum, c) => sum + effectiveExtraAmount(c, furnitureSubtotal), 0);
  const usedLabels = new Set(costs.map((c) => c.label.trim().toLowerCase()));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base font-medium text-foreground">
            Additional costs
          </CardTitle>
          {costs.length > 0 && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {eur(subtotal)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {costs.map((cost) => {
            const pct = cost.role ? AUTO_EXTRA_PCT[cost.role] : undefined;
            return (
              <ExtraCostRow
                key={cost.id}
                cost={cost}
                displayAmount={effectiveExtraAmount(cost, furnitureSubtotal)}
                canReset={!cost.auto && pct !== undefined}
                onLabelChange={onLabelChange}
                onAmountChange={onAmountChange}
                onResetAuto={onResetAuto}
                onRemove={onRemove}
              />
            );
          })}
        </div>
        {costs.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Add delivery, installation, or any custom line.
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAdd()}
            className="gap-1.5"
            style={{ color: "#647d75" }}
          >
            <Plus className="h-4 w-4" />
            Add custom line
          </Button>
          {SUGGESTIONS.filter((s) => !usedLabels.has(s.toLowerCase())).map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => onAdd(s)}
              className="h-7 gap-1 text-xs text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              {s}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
