import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface HybridTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export const HybridTooltip = ({
  children,
  content,
  side = "top",
  className,
}: HybridTooltipProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!open);
    }
  };

  return (
    <Tooltip open={isMobile ? open : undefined} onOpenChange={isMobile ? setOpen : undefined}>
      <TooltipTrigger asChild onClick={handleTriggerClick}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={className}
        onPointerDownOutside={() => isMobile && setOpen(false)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
};
