import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetChipProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export default function BudgetChip({ icon: Icon, label, active = true, onClick }: BudgetChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all touch-manipulation whitespace-nowrap shrink-0",
        active
          ? "bg-foreground/10 text-foreground"
          : "bg-muted/50 text-muted-foreground"
      )}
    >
      <Icon size={14} strokeWidth={1.5} />
      <span>{label}</span>
    </button>
  );
}
